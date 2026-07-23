import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import type { VideoEditInstructions } from './geminiParser.js';
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
    console.log(`[FFmpegRunner] Starting Next-Gen video processing...`);
    console.log(`[FFmpegRunner] Input: ${inputPath}`);
    console.log(`[FFmpegRunner] Output: ${outputPath}`);
    console.log(`[FFmpegRunner] Instructions:`, JSON.stringify(instructions, null, 2));

    // Ensure output directory exists
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
      // Crop for vertical TikTok / Reels / Shorts
      videoFilters.push("crop=w='min(iw,ih*9/16)':h='min(ih,iw*16/9)'");
    } else if (instructions.aspectRatio === '1:1') {
      // Crop for Instagram Square
      videoFilters.push("crop='min(iw,ih)':'min(iw,ih)'");
    } else if (instructions.aspectRatio === '16:9') {
      // Crop for Widescreen Cinematic
      videoFilters.push("crop='min(iw,ih*16/9)':'min(ih,iw*9/16)'");
    }

    // --- Speed Adjustment ---
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

    // --- Grayscale / Saturation / Contrast / Brightness ---
    if (instructions.grayscale) {
      videoFilters.push('eq=saturation=0');
    } else {
      const eqParts: string[] = [];
      if (typeof instructions.contrast === 'number') {
        eqParts.push(`contrast=${instructions.contrast}`);
      }
      if (typeof instructions.brightness === 'number') {
        eqParts.push(`brightness=${instructions.brightness}`);
      }
      if (typeof instructions.saturation === 'number') {
        eqParts.push(`saturation=${instructions.saturation}`);
      }
      if (eqParts.length > 0) {
        videoFilters.push(`eq=${eqParts.join(':')}`);
      }
    }

    // --- Color Presets & Styling ---
    if (instructions.colorPreset === 'cyberpunk') {
      videoFilters.push('colorchannelmixer=rr=1.2:rg=0.1:rb=0.4:gr=0.0:gg=0.8:gb=0.2:br=0.3:bg=0.1:bb=1.3');
    } else if (instructions.colorPreset === 'vintage') {
      videoFilters.push('colorchannelmixer=rr=1.1:rg=0.1:rb=0.0:gr=0.1:gg=1.0:gb=0.1:br=0.1:bg=0.1:bb=0.8');
      videoFilters.push('vignette=PI/4');
    } else if (instructions.colorPreset === 'warm_sunset') {
      videoFilters.push('colorchannelmixer=rr=1.3:rg=0.1:rb=0.0:gr=0.1:gg=1.1:gb=0.0:br=0.0:bg=0.1:bb=0.7');
    } else if (instructions.colorPreset === 'matrix') {
      videoFilters.push('colorchannelmixer=rr=0.1:rg=0.9:rb=0.1:gr=0.1:gg=1.3:gb=0.1:br=0.1:bg=0.9:bb=0.1');
    } else if (instructions.colorPreset === 'sepia') {
      videoFilters.push('colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131');
    } else if (instructions.colorPreset === 'dramatic') {
      videoFilters.push('eq=contrast=1.35:brightness=-0.05:saturation=0.85');
    } else if (instructions.colorPreset === 'vivid') {
      videoFilters.push('eq=contrast=1.2:saturation=1.7');
    }

    // --- Vignette ---
    if (instructions.vignette && instructions.colorPreset !== 'vintage') {
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

    // --- Video Fades ---
    if (typeof instructions.videoFadeIn === 'number' && instructions.videoFadeIn > 0) {
      videoFilters.push(`fade=t=in:st=0:d=${instructions.videoFadeIn}`);
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
      if (typeof instructions.audioFadeIn === 'number' && instructions.audioFadeIn > 0) {
        audioFilters.push(`afade=t=in:st=0:d=${instructions.audioFadeIn}`);
      }
      if (typeof instructions.audioFadeOut === 'number' && instructions.audioFadeOut > 0) {
        // Approximate audio fade out start if duration is set
        const fadeStart = instructions.duration ? Math.max(0, instructions.duration - instructions.audioFadeOut) : 5;
        audioFilters.push(`afade=t=out:st=${fadeStart}:d=${instructions.audioFadeOut}`);
      }

      if (audioFilters.length > 0) {
        command = command.audioFilters(audioFilters);
      }
      
      command = command.audioCodec('aac').audioBitrate('128k');
    }

    // Output options
    command = command
      .videoCodec('libx264')
      .outputOptions([
        '-preset ultrafast',
        '-crf 22',
        '-pix_fmt yuv420p',
        '-movflags +faststart'
      ])
      .output(outputPath);

    // Event handlers
    command
      .on('start', (commandLine) => {
        console.log(`[FFmpegRunner] Executing: ${commandLine}`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`[FFmpegRunner] Progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log(`[FFmpegRunner] Next-Gen video processing complete!`);
        resolve(outputPath);
      })
      .on('error', (err, stdout, stderr) => {
        console.error(`[FFmpegRunner] FFmpeg error: ${err.message}`);
        console.error(`[FFmpegRunner] FFmpeg stderr: ${stderr}`);
        reject(new Error(`FFmpeg processing failed: ${err.message}`));
      });

    command.run();
  });
}
