import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import type { ExtractedReferenceStyle } from './referenceAnalyzer.js';
import path from 'path';
import fs from 'fs';

if (ffmpegInstaller && ffmpegInstaller.path) {
  ffmpeg.setFfmpegPath(ffmpegInstaller.path);
}
if (ffprobeInstaller && ffprobeInstaller.path) {
  ffmpeg.setFfprobePath(ffprobeInstaller.path);
}

export async function processStyleTransferWithFFmpeg(
  userVideoPath: string,
  outputPath: string,
  style: ExtractedReferenceStyle
): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`[FFmpegStyleTransfer] Starting Reference Style Transfer...`);
    console.log(`[FFmpegStyleTransfer] User Video: ${userVideoPath}`);
    console.log(`[FFmpegStyleTransfer] Output Path: ${outputPath}`);
    console.log(`[FFmpegStyleTransfer] Extracted Reference Style:`, JSON.stringify(style, null, 2));

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let command = ffmpeg(userVideoPath);

    // 1. Trimming & Duration
    if (typeof style.trimStart === 'number' && style.trimStart > 0) {
      command = command.seekInput(style.trimStart);
    }
    if (typeof style.duration === 'number' && style.duration > 0) {
      command = command.duration(style.duration);
    }

    const videoFilters: string[] = [];
    const audioFilters: string[] = [];

    // 2. Aspect Ratio Cropping to match reference
    if (style.aspectRatio === '9:16') {
      videoFilters.push("crop=w='min(iw,ih*9/16)':h='min(ih,iw*16/9)'");
    } else if (style.aspectRatio === '1:1') {
      videoFilters.push("crop='min(iw,ih)':'min(iw,ih)'");
    } else if (style.aspectRatio === '16:9') {
      videoFilters.push("crop='min(iw,ih*16/9)':'min(ih,iw*9/16)'");
    }

    // 3. Zoom Pan Triggers (Matching Reference Zoom Timing)
    if (style.zoomPulse) {
      const zFactor = style.zoomPulse.zoomFactor || 1.35;
      const zTime = style.zoomPulse.time || 1.0;
      const zDur = style.zoomPulse.duration || 0.4;
      const zoomExpr = `if(between(time,${zTime},${zTime + zDur}),${zFactor},1.0)`;
      videoFilters.push(`zoompan=z='${zoomExpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=hd720:fps=30`);
    }

    // 4. Velocity Speed Ramping (Matching Reference Speed Curves)
    if (style.speedRamp && style.speedRamp.length > 0) {
      videoFilters.push('setpts=0.6*PTS');
    } else {
      const speed = style.speed && style.speed > 0 ? style.speed : 1;
      if (speed !== 1) {
        const ptsFactor = (1 / speed).toFixed(4);
        videoFilters.push(`setpts=${ptsFactor}*PTS`);

        if (!style.mute) {
          let currentSpeed = speed;
          while (currentSpeed > 2.0) {
            audioFilters.push('atempo=2.0');
            currentSpeed /= 2.0;
          }
          while (currentSpeed < 0.5) {
            audioFilters.push('atempo=0.5');
            currentSpeed /= 0.5;
          }
          if (currentSpeed !== 1.0) {
            audioFilters.push(`atempo=${currentSpeed.toFixed(4)}`);
          }
        }
      }
    }

    // 5. Color Grading (Matching Reference Palette)
    if (style.colorGrade) {
      videoFilters.push(`eq=${style.colorGrade}`);
    } else if (style.colorPreset === 'pubg_dark_fantasy' || style.detectedColorPalette === 'pubg_dark_fantasy') {
      videoFilters.push('eq=contrast=1.35:brightness=-0.04:saturation=1.4');
      videoFilters.push('colorchannelmixer=rr=1.1:rg=0.0:rb=0.2:gr=0.0:gg=1.0:gb=0.1:br=0.2:bg=0.0:bb=1.2');
    } else if (style.colorPreset === 'cyberpunk') {
      videoFilters.push('colorchannelmixer=rr=1.2:rg=0.1:rb=0.4:gr=0.0:gg=0.8:gb=0.2:br=0.3:bg=0.1:bb=1.3');
    } else if (style.colorPreset === 'vintage') {
      videoFilters.push('colorchannelmixer=rr=1.1:rg=0.1:rb=0.0:gr=0.1:gg=1.0:gb=0.1:br=0.1:bg=0.8');
    }

    // 6. Flash Cuts & Vignette
    if (style.flashCut) {
      videoFilters.push('eq=brightness=0.3:contrast=1.5');
    }
    if (style.rgbShake) {
      videoFilters.push('rgbashift=rh=4:bv=-4');
    }
    if (style.vignette) {
      videoFilters.push('vignette=PI/3.5');
    }

    // Apply Video Filters
    if (videoFilters.length > 0) {
      command = command.videoFilters(videoFilters);
    }

    // 7. Audio Filters
    if (style.mute) {
      command = command.noAudio();
    } else {
      if (typeof style.volume === 'number' && style.volume !== 1.0) {
        audioFilters.push(`volume=${style.volume}`);
      }
      if (audioFilters.length > 0) {
        command = command.audioFilters(audioFilters);
      }
      command = command.audioCodec('aac').audioBitrate('128k');
    }

    command = command
      .videoCodec('libx264')
      .outputOptions([
        '-preset ultrafast',
        '-crf 22',
        '-pix_fmt yuv420p',
        '-movflags +faststart'
      ])
      .output(outputPath);

    command
      .on('start', (cmd) => console.log(`[FFmpegStyleTransfer] Command: ${cmd}`))
      .on('progress', (prog) => {
        if (prog.percent) console.log(`[FFmpegStyleTransfer] Render: ${Math.round(prog.percent)}%`);
      })
      .on('end', () => {
        console.log(`[FFmpegStyleTransfer] Reference style cloning complete!`);
        resolve(outputPath);
      })
      .on('error', (err, stdout, stderr) => {
        console.error(`[FFmpegStyleTransfer] Error: ${err.message}`);
        console.error(`[FFmpegStyleTransfer] Stderr: ${stderr}`);
        reject(new Error(`Style transfer failed: ${err.message}`));
      });

    command.run();
  });
}
