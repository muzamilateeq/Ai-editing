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
    console.log(`[FFmpegRunner] Starting video processing...`);
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

    // Speed adjustment (setpts for video, atempo for audio)
    const speed = instructions.speed && instructions.speed > 0 ? instructions.speed : 1;
    if (speed !== 1) {
      // setpts filter formula: setpts = (1/speed) * PTS
      const ptsFactor = (1 / speed).toFixed(4);
      videoFilters.push(`setpts=${ptsFactor}*PTS`);

      // Audio atempo handling (atempo accepts 0.5 to 2.0, chain if outside range)
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

    // Grayscale / Saturation
    if (instructions.grayscale) {
      videoFilters.push('eq=saturation=0');
    }

    // Flips
    if (instructions.flipHorizontal) {
      videoFilters.push('hflip');
    }
    if (instructions.flipVertical) {
      videoFilters.push('vflip');
    }

    // Rotation
    if (instructions.rotate === 90) {
      videoFilters.push('transpose=1');
    } else if (instructions.rotate === 180) {
      videoFilters.push('hflip,vflip');
    } else if (instructions.rotate === 270) {
      videoFilters.push('transpose=2');
    }

    // Apply Video Filters
    if (videoFilters.length > 0) {
      command = command.videoFilters(videoFilters);
    }

    // 3. Audio handling (Mute / Volume / Filters)
    if (instructions.mute) {
      command = command.noAudio();
    } else {
      if (typeof instructions.volume === 'number' && instructions.volume !== 1.0 && instructions.volume >= 0) {
        audioFilters.push(`volume=${instructions.volume}`);
      }

      if (audioFilters.length > 0) {
        command = command.audioFilters(audioFilters);
      }
      
      // Ensure web standard AAC audio encoding
      command = command.audioCodec('aac').audioBitrate('128k');
    }

    // Ensure web standard H.264 video encoding & MP4 container compatibility
    command = command
      .videoCodec('libx264')
      .outputOptions([
        '-preset ultrafast',
        '-crf 23',
        '-pix_fmt yuv420p',
        '-movflags +faststart' // allow web playback before full download
      ])
      .output(outputPath);

    // Event listeners
    command
      .on('start', (commandLine) => {
        console.log(`[FFmpegRunner] Spawned FFmpeg with command: ${commandLine}`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`[FFmpegRunner] Processing: ${Math.round(progress.percent)}% done`);
        }
      })
      .on('end', () => {
        console.log(`[FFmpegRunner] FFmpeg processing successfully completed!`);
        resolve(outputPath);
      })
      .on('error', (err, stdout, stderr) => {
        console.error(`[FFmpegRunner] FFmpeg Error: ${err.message}`);
        console.error(`[FFmpegRunner] FFmpeg stderr: ${stderr}`);
        reject(new Error(`FFmpeg failed: ${err.message}`));
      });

    // Run the command
    command.run();
  });
}
