export interface ComplexFilterOptions {
  slowMoInterpolation?: boolean; // Use minterpolate for smooth 60fps slow-mo
  zoomPulse?: { time: number; zoomFactor: number; duration: number };
  flashCut?: { time: number };
  rgbShake?: boolean;
  colorGradePreset?: 'pubg_dark_gothic' | 'pubg_gold_god' | 'cyberpunk' | 'matrix';
  customColorGrade?: string;
  vignette?: boolean;
}

export function buildComplexGamingFilterGraph(options: ComplexFilterOptions): string[] {
  const filters: string[] = [];

  // 1. Smooth Motion Interpolation for Slow-Mo
  if (options.slowMoInterpolation) {
    filters.push('minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir');
  }

  // 2. Keyframed Zoom-Pan Pulse
  if (options.zoomPulse) {
    const zFactor = options.zoomPulse.zoomFactor || 1.35;
    const zTime = options.zoomPulse.time || 1.0;
    const zDur = options.zoomPulse.duration || 0.4;
    const zoomExpr = `if(between(time,${zTime},${zTime + zDur}),${zFactor},1.0)`;
    filters.push(`zoompan=z='${zoomExpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=hd720:fps=30`);
  }

  // 3. Dark Gothic / PUBG Color Grading
  if (options.customColorGrade) {
    filters.push(`eq=${options.customColorGrade}`);
  } else if (options.colorGradePreset === 'pubg_dark_gothic') {
    filters.push('eq=contrast=1.38:brightness=-0.05:saturation=1.45');
    filters.push('colorchannelmixer=rr=1.1:rg=0.0:rb=0.2:gr=0.0:gg=1.0:gb=0.1:br=0.2:bg=0.0:bb=1.2');
    filters.push('vignette=PI/3.5');
  } else if (options.colorGradePreset === 'pubg_gold_god') {
    filters.push('eq=contrast=1.25:brightness=0.02:saturation=1.5');
    filters.push('colorchannelmixer=rr=1.3:rg=0.2:rb=0.0:gr=0.1:gg=1.1:gb=0.0:br=0.0:bg=0.1:bb=0.7');
  } else if (options.colorGradePreset === 'cyberpunk') {
    filters.push('colorchannelmixer=rr=1.2:rg=0.1:rb=0.4:gr=0.0:gg=0.8:gb=0.2:br=0.3:bg=0.1:bb=1.3');
  } else if (options.colorGradePreset === 'matrix') {
    filters.push('colorchannelmixer=rr=0.1:rg=0.9:rb=0.1:gr=0.1:gg=1.3:gb=0.1:br=0.1:bg=0.9:bb=0.1');
  }

  // 4. Flash Cut Overlay
  if (options.flashCut) {
    filters.push('eq=brightness=0.3:contrast=1.5');
  }

  // 5. RGB Shake / Chromatic Aberration
  if (options.rgbShake) {
    filters.push('rgbashift=rh=4:bv=-4');
  }

  // 6. Vignette
  if (options.vignette && !options.colorGradePreset?.includes('pubg')) {
    filters.push('vignette=PI/3.5');
  }

  return filters;
}
