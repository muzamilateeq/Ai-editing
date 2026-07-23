import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import type { VideoEditInstructions } from './geminiParser.js';
import { buildQualityFilterGraph } from './qualityEnhancer.js';
import path from 'path';
import fs from 'fs';

// Set binary paths from installers
if (ffmpegInstaller && ffmpegInstaller.path) {
  ffmpeg.setFfmpegPath(ffmpegInstaller.path);
}
if (ffprobeInstaller && ffprobeInstaller.path) {
  ffmpeg.setFfprobePath(ffprobeInstaller.path);
}

export async function processVideoWithFFmpeg(
  inputPath: string,
  outputPath: string,
  instructions: VideoEditInstructions
): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`[FFmpegRunner] Starting High-Energy Gaming FFmpeg processing...`);
    console.log(`[FFmpegRunner] Input: ${inputPath}`);
    console.log(`[FFmpegRunner] Output: ${outputPath}`);
    console.log(`[FFmpegRunner] Instructions:`, JSON.stringify(instructions, null, 2));

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let command = ffmpeg(inputPath);

    // 1. Trimming & Seeking
    if (typeof instructions.trimStart === 'number' && instructions.trimStart > 0) {
      command = command.seekInput(instructions.trimStart);
    }

    if (typeof instructions.duration === 'number' && instructions.duration > 0) {
      command = command.duration(instructions.duration);
    } else if (typeof instructions.trimEnd === 'number' && instructions.trimEnd > (instructions.trimStart || 0)) {
      const calcDuration = instructions.trimEnd - (instructions.trimStart || 0);
      command = command.duration(calcDuration);
    }

    // 2. Video Filters Array
    const videoFilters: string[] = [];
    const audioFilters: string[] = [];

    // --- Aspect Ratio Cropping ---
    if (instructions.aspectRatio === '9:16') {
      videoFilters.push("crop=w='min(iw,ih*9/16)':h='min(ih,iw*16/9)'");
    } else if (instructions.aspectRatio === '1:1') {
      videoFilters.push("crop='min(iw,ih)':'min(iw,ih)'");
    } else if (instructions.aspectRatio === '16:9') {
      videoFilters.push("crop='min(iw,ih*16/9)':'min(ih,iw*9/16)'");
    }

    // --- Beat Sync Zoom Pulse Effect ---
    if (instructions.zoomPulse) {
      const zFactor = instructions.zoomPulse.zoomFactor || 1.3;
      const zTime = instructions.zoomPulse.time || 1.0;
      const zDur = instructions.zoomPulse.duration || 0.4;
      
      // Dynamic zoompan filter evaluating between zTime and zTime+zDur
      const zoomExpr = `if(between(time,${zTime},${zTime + zDur}),${zFactor},1.0)`;
      videoFilters.push(`zoompan=z='${zoomExpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=hd720:fps=30`);
    }

    // --- Speed Adjustment / Velocity Ramping ---
    if (instructions.speedRamp && instructions.speedRamp.length > 0) {
      // Speed ramp acceleration logic using setpts
      videoFilters.push(`setpts=0.6*PTS`);
    } else {
      const speed = instructions.speed && instructions.speed > 0 ? instructions.speed : 1;
      if (speed !== 1) {
        const ptsFactor = (1 / speed).toFixed(4);
        videoFilters.push(`setpts=${ptsFactor}*PTS`);

        if (!instructions.mute) {
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

    // --- PUBG Mobile Dark Fantasy & Custom Color Grading ---
    if (instructions.colorGrade) {
      // Apply raw FFmpeg eq string directly from Gemini (e.g. "contrast=1.2:saturation=1.4,eq=gamma=0.9")
      videoFilters.push(`eq=${instructions.colorGrade}`);
    } else if (instructions.colorPreset === 'pubg_dark_fantasy') {
      videoFilters.push('eq=contrast=1.35:brightness=-0.04:saturation=1.4');
      videoFilters.push('colorchannelmixer=rr=1.1:rg=0.0:rb=0.2:gr=0.0:gg=1.0:gb=0.1:br=0.2:bg=0.0:bb=1.2');
      videoFilters.push('vignette=PI/3.5');
    } else if (instructions.colorPreset === 'cyberpunk') {
      videoFilters.push('colorchannelmixer=rr=1.2:rg=0.1:rb=0.4:gr=0.0:gg=0.8:gb=0.2:br=0.3:bg=0.1:bb=1.3');
    } else if (instructions.colorPreset === 'vintage') {
      videoFilters.push('colorchannelmixer=rr=1.1:rg=0.1:rb=0.0:gr=0.1:gg=1.0:gb=0.1:br=0.1:bg=0.8');
      videoFilters.push('vignette=PI/4');
    } else if (instructions.colorPreset === 'matrix') {
      videoFilters.push('colorchannelmixer=rr=0.1:rg=0.9:rb=0.1:gr=0.1:gg=1.3:gb=0.1:br=0.1:bg=0.9:bb=0.1');
    }

    // --- Flash Cut Overlay ---
    if (instructions.flashCut) {
      // Flash cut brightening effect
      videoFilters.push('eq=brightness=0.3:contrast=1.5');
    }

    // --- RGB Shake / Split Effect ---
    if (instructions.rgbShake) {
      videoFilters.push('rgbashift=rh=4:bv=-4');
    }

    // --- Vignette ---
    if (instructions.vignette && !videoFilters.some(f => f.includes('vignette'))) {
      videoFilters.push('vignette=PI/4');
    }

    // --- Flips & Rotations ---
    if (instructions.flipHorizontal) {
      videoFilters.push('hflip');
    }
    if (instructions.flipVertical) {
      videoFilters.push('vflip');
    }
    if (instructions.rotate === 90) {
      videoFilters.push('transpose=1');
    } else if (instructions.rotate === 180) {
      videoFilters.push('hflip,vflip');
    } else if (instructions.rotate === 270) {
      videoFilters.push('transpose=2');
    }

    // --- Smooth 60FPS & High Graphics Color ---
    if (instructions.fps60) {
      videoFilters.push('fps=60');
    }
    if (instructions.highGraphicsColor) {
      videoFilters.push('eq=contrast=1.3:brightness=0.02:saturation=1.5,colorchannelmixer=rr=1.1:gg=1.1:bb=1.1');
    }

    // --- Resolution & Quality Upscaling ---
    let renderOptions = [
      '-preset ultrafast',
      '-crf 22',
      '-pix_fmt yuv420p',
      '-movflags +faststart'
    ];

    if (instructions.upscale || instructions.upscaleTarget === '4K' || instructions.crf === 14) {
      const targetRes = instructions.upscaleTarget || instructions.upscale?.target || '4K';
      const qGraph = buildQualityFilterGraph({ target: targetRes, mode: 'pro_master', sharpening: 0.6, denoise: true }, instructions.aspectRatio);
      videoFilters.push(...qGraph.filters);
      renderOptions = qGraph.outputOptions;
    }

    // Apply Video Filters
    if (videoFilters.length > 0) {
      command = command.videoFilters(videoFilters);
    }

    // 3. Audio Filters (Mute / Volume / Fades)
    if (instructions.mute) {
      command = command.noAudio();
    } else {
      if (typeof instructions.volume === 'number' && instructions.volume !== 1.0 && instructions.volume >= 0) {
        audioFilters.push(`volume=${instructions.volume}`);
      }

      if (audioFilters.length > 0) {
        command = command.audioFilters(audioFilters);
      }
      
      const audioBitrate = instructions.upscale?.target === '4K' ? '320k' : instructions.upscale?.target === '2K' ? '256k' : '128k';
      command = command.audioCodec('aac').audioBitrate(audioBitrate);
    }

    // Output options
    command = command
      .videoCodec('libx264')
      .outputOptions(renderOptions)
      .output(outputPath);

    // Event handlers
    command
      .on('start', (commandLine) => {
        console.log(`[FFmpegRunner] Executing Gaming FFmpeg command: ${commandLine}`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`[FFmpegRunner] Gaming Render Progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log(`[FFmpegRunner] Gaming montage render successfully complete!`);
        resolve(outputPath);
      })
      .on('error', (err, stdout, stderr) => {
        console.error(`[FFmpegRunner] FFmpeg error: ${err.message}`);
        console.error(`[FFmpegRunner] FFmpeg stderr: ${stderr}`);
        reject(new Error(`FFmpeg gaming render failed: ${err.message}`));
      });

    command.run();
  });
}
