import React, { useState } from 'react';
import { Cpu, ChevronDown, ChevronUp, Code2, Scissors, Gauge, VolumeX, Eye, RotateCw, Volume2, Sparkles, Smartphone, Palette, Film, Gamepad2, Zap, Radio, Crown } from 'lucide-react';
import type { VideoEditInstructions } from '../../server/lib/geminiParser';

export type { VideoEditInstructions };

interface ParsedOpsViewerProps {
  instructions: VideoEditInstructions;
  aiSource?: 'gemini' | 'fallback';
  rawPrompt: string;
}

export const ParsedOpsViewer: React.FC<ParsedOpsViewerProps> = ({
  instructions,
  aiSource = 'gemini',
  rawPrompt,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4 shadow-xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-slate-200 text-sm">
            AI Gemini Flash Gaming Parameters
          </h3>
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
              aiSource === 'gemini'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {aiSource === 'gemini' ? 'Gemini 2.0 Flash' : 'Rule Fallback Engine'}
          </span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 transition-colors"
        >
          <Code2 className="w-3.5 h-3.5" />
          {isOpen ? 'Hide JSON Specs' : 'View JSON Specs'}
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Explanation Banner */}
      {instructions.explanation && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200 shadow-inner">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300">AI Gaming Summary: </span>
            {instructions.explanation}
          </div>
        </div>
      )}

      {/* Deep Multimodal Vision Analysis Notes */}
      {(instructions as any).deepAnalysisNotes && (
        <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-3 text-xs text-purple-200 shadow-inner">
          <Eye className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-purple-300">Gemini Deep Multimodal Vision Analysis: </span>
            {(instructions as any).deepAnalysisNotes}
          </div>
        </div>
      )}

      {/* Parameter Badges */}
      <div className="flex flex-wrap gap-2 pt-1">
        {(instructions.upscale || instructions.upscaleTarget === '4K') && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-xs text-amber-200 shadow-sm font-bold">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            Output Quality: <span className="font-mono text-amber-300">{instructions.upscaleTarget || instructions.upscale?.target || '4K'} Ultra HD</span>
          </div>
        )}

        {instructions.fps60 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 shadow-sm font-semibold">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            Frame Rate: <span className="font-mono text-emerald-300">Smooth 60 FPS</span>
          </div>
        )}

        {instructions.highGraphicsColor && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs text-purple-200 shadow-sm font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Graphics: <span className="font-mono text-purple-300">High Graphics Color Boost</span>
          </div>
        )}
        {instructions.colorPreset === 'pubg_dark_fantasy' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 shadow-sm font-semibold">
            <Gamepad2 className="w-3.5 h-3.5 text-yellow-400" />
            Style: <span className="font-mono text-yellow-300">PUBG Dark Fantasy</span>
          </div>
        )}

        {instructions.zoomPulse && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs text-purple-200 shadow-sm font-semibold">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            Beat Sync Zoom: <span className="font-mono text-purple-300">{instructions.zoomPulse.zoomFactor || 1.3}x @ {instructions.zoomPulse.time || 1.2}s</span>
          </div>
        )}

        {instructions.speedRamp && instructions.speedRamp.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-200 shadow-sm font-semibold">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            Speed Ramp: <span className="font-mono text-cyan-300">Active Velocity</span>
          </div>
        )}

        {instructions.flashCut && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 shadow-sm font-semibold">
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            Flash Cut: <span className="font-mono text-rose-300">Active</span>
          </div>
        )}

        {instructions.rgbShake && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 shadow-sm font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            RGB Shake: <span className="font-mono text-blue-300">Enabled</span>
          </div>
        )}

        {instructions.aspectRatio && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs text-slate-200 shadow-sm">
            <Smartphone className="w-3.5 h-3.5 text-pink-400" />
            Aspect: <span className="font-mono text-pink-300 font-bold">{instructions.aspectRatio}</span>
          </div>
        )}

        {instructions.colorPreset && instructions.colorPreset !== 'pubg_dark_fantasy' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs text-slate-200 shadow-sm">
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            Preset: <span className="font-mono text-cyan-300 font-bold uppercase">{instructions.colorPreset}</span>
          </div>
        )}

        {typeof instructions.trimStart === 'number' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs text-slate-200 shadow-sm">
            <Scissors className="w-3.5 h-3.5 text-rose-400" />
            Trim Start: <span className="font-mono text-rose-300 font-bold">{instructions.trimStart}s</span>
          </div>
        )}

        {typeof instructions.speed === 'number' && instructions.speed !== 1 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs text-slate-200 shadow-sm">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            Speed: <span className="font-mono text-cyan-300 font-bold">{instructions.speed}x</span>
          </div>
        )}

        {instructions.vignette && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs text-slate-200 shadow-sm">
            <Film className="w-3.5 h-3.5 text-purple-400" />
            Vignette: <span className="font-mono text-purple-300 font-bold">Active</span>
          </div>
        )}

        {instructions.mute ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs text-slate-200 shadow-sm">
            <VolumeX className="w-3.5 h-3.5 text-red-400" />
            Audio: <span className="font-mono text-red-300 font-bold">Muted</span>
          </div>
        ) : (
          typeof instructions.volume === 'number' && instructions.volume !== 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs text-slate-200 shadow-sm">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              Volume: <span className="font-mono text-emerald-300 font-bold">{instructions.volume}x</span>
            </div>
          )
        )}
      </div>

      {/* Expandable Raw JSON Output */}
      {isOpen && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Structured Gaming JSON output from Gemini Flash &rarr; FFmpeg Engine:</span>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-amber-300/90 text-xs overflow-x-auto border border-slate-800 font-mono shadow-inner">
            {JSON.stringify(instructions, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
