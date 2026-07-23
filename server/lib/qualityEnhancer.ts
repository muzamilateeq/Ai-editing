export interface UpscaleOption {
  target: '1080p' | '2K' | '4K';
  mode?: 'fast_lanczos' | 'ai_esrgan' | 'pro_master';
  sharpening?: number;
  denoise?: boolean;
}

export function buildQualityFilterGraph(
  upscale: UpscaleOption,
  aspectRatio?: '9:16' | '1:1' | '16:9'
): { filters: string[]; outputOptions: string[] } {
  const filters: string[] = [];
  const target = upscale.target || '4K';

  // 1. Calculate target resolution dimensions
  let width = 3840;
  let height = 2160;

  if (target === '4K') {
    if (aspectRatio === '9:16') {
      width = 2160;
      height = 3840;
    } else if (aspectRatio === '1:1') {
      width = 2160;
      height = 2160;
    } else {
      width = 3840;
      height = 2160;
    }
  } else if (target === '2K') {
    if (aspectRatio === '9:16') {
      width = 1440;
      height = 2560;
    } else if (aspectRatio === '1:1') {
      width = 1440;
      height = 1440;
    } else {
      width = 2560;
      height = 1440;
    }
  } else {
    // 1080p
    if (aspectRatio === '9:16') {
      width = 1080;
      height = 1920;
    } else if (aspectRatio === '1:1') {
      width = 1080;
      height = 1080;
    } else {
      width = 1920;
      height = 1080;
    }
  }

  // 2. High Quality Spatial Upscaling (Lanczos)
  filters.push(`scale=${width}:${height}:flags=lanczos`);

  // 3. High Quality 3D Denoise
  if (upscale.denoise !== false) {
    filters.push('hqdn3d=1.5:1.5:3:3');
  }

  // 4. Adaptive Sharpening (Unsharp Mask - Built-in FFmpeg Filter)
  const sharpenAmount = typeof upscale.sharpening === 'number' ? upscale.sharpening : 0.5;
  if (sharpenAmount > 0) {
    const lumaAmount = (sharpenAmount * 1.2).toFixed(2);
    filters.push(`unsharp=5:5:${lumaAmount}:5:5:0.4`);
  }

  // 5. Master Export Encoding Settings
  let outputOptions: string[] = [];
  if (target === '4K') {
    outputOptions = [
      '-c:v libx264',
      '-crf 14',
      '-preset slow',
      '-pix_fmt yuv420p',
      '-b:a 320k',
      '-movflags +faststart',
    ];
  } else if (target === '2K') {
    outputOptions = [
      '-c:v libx264',
      '-crf 16',
      '-preset medium',
      '-pix_fmt yuv420p',
      '-b:a 256k',
      '-movflags +faststart',
    ];
  } else {
    outputOptions = [
      '-c:v libx264',
      '-crf 18',
      '-preset fast',
      '-pix_fmt yuv420p',
      '-b:a 192k',
      '-movflags +faststart',
    ];
  }

  return { filters, outputOptions };
}
