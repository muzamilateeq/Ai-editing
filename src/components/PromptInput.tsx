import React from 'react';
import { Wand2, Loader2, Sparkles, Zap, Flame, Film, Smartphone, Gamepad2, Radio, Crosshair } from 'lucide-react';
import { ResolutionSelector } from './ResolutionSelector';

interface PromptInputProps {
  prompt: string;
  setPrompt: (value: string) => void;
  selectedResolution: '1080p' | '2K' | '4K';
  onResolutionChange: (res: '1080p' | '2K' | '4K') => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled: boolean;
}

const PUBG_GAMING_PRESETS = [
  {
    icon: <Gamepad2 className="w-3.5 h-3.5 text-yellow-400" />,
    label: '🎮 PUBG Dark Fantasy (4K)',
    prompt: 'Apply dark fantasy PUBG lobby color grade, add beat sync zoom pulse at 1.2s on dance move, trim first 2 seconds, upscale to crisp 4K Ultra HD',
  },
  {
    icon: <Crosshair className="w-3.5 h-3.5 text-rose-400" />,
    label: '🔥 Velocity Speed Ramp & 2K',
    prompt: 'Apply dramatic velocity speed ramp, add beat sync zoom on dance move at 1.2s, set RGB shake, and enhance quality to 2K QHD',
  },
  {
    icon: <Radio className="w-3.5 h-3.5 text-purple-400" />,
    label: '⚡ Flash Cut & Beat Zoom',
    prompt: 'Add flash cut at 1.2s, zoomPulse at 1.2s with factor 1.4, apply dark fantasy PUBG color grade',
  },
  {
    icon: <Smartphone className="w-3.5 h-3.5 text-pink-400" />,
    label: '📱 PUBG TikTok Montage (9:16)',
    prompt: 'Crop to 9:16 vertical for TikTok Reels, apply PUBG lobby color grade with contrast 1.4, beat sync zoom at 1.0s, and speed up 1.5x',
  },
  {
    icon: <Flame className="w-3.5 h-3.5 text-cyan-400" />,
    label: '⚡ Cyberpunk 4K Master',
    prompt: 'Apply Cyberpunk neon color grade, RGB shake effect, 2.0x speed, and render crisp 4K Ultra HD master',
  },
  {
    icon: <Film className="w-3.5 h-3.5 text-amber-400" />,
    label: '🌇 Vintage 2K QHD Montage',
    prompt: 'Apply vintage retro film grade, slow motion 0.5x, dark vignette, 2K QHD sharpening, and trim first 3 seconds',
  },
];

export const PromptInput: React.FC<PromptInputProps> = ({
  prompt,
  setPrompt,
  selectedResolution,
  onResolutionChange,
  onSubmit,
  isLoading,
  disabled,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isLoading && prompt.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 space-y-4 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          Gaming & Emote AI Editing Prompt
        </label>
        <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/30 text-amber-300 font-medium flex items-center gap-1">
          <Gamepad2 className="w-3 h-3 text-yellow-400" /> PUBG 4K Engine
        </span>
      </div>

      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your PUBG / Gaming montage edits e.g., 'Add beat sync zoom on dance move, velocity speed ramp, PUBG dark fantasy color grade, and upscale to 4K Ultra HD'..."
          disabled={isLoading}
          rows={3}
          className="w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 rounded-xl p-4 text-sm border border-slate-700/70 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all resize-none shadow-inner"
        />

        <div className="absolute bottom-3 right-3 text-xs text-slate-500 pointer-events-none hidden sm:block">
          Press Enter to execute
        </div>
      </div>

      {/* Resolution & Quality Selector */}
      <ResolutionSelector
        selectedResolution={selectedResolution}
        onResolutionChange={onResolutionChange}
        disabled={isLoading}
      />

      {/* Gaming Preset Chips */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-yellow-400" /> PUBG & Gaming Edit Recipes:
        </p>
        <div className="flex flex-wrap gap-2 max-w-full">
          {PUBG_GAMING_PRESETS.map((recipe, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(recipe.prompt)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-amber-900/50 hover:text-amber-200 border border-slate-700/70 hover:border-amber-500/50 text-slate-200 transition-all duration-200 flex items-center gap-1.5 active:scale-95 touch-manipulation shadow-sm"
            >
              {recipe.icon}
              <span>{recipe.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={disabled || isLoading || !prompt.trim()}
        className={`w-full py-4 px-6 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-xl relative overflow-hidden group ${
          disabled || isLoading || !prompt.trim()
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            : 'bg-gradient-to-r from-amber-600 via-purple-600 to-indigo-600 hover:from-amber-500 hover:via-purple-500 hover:to-indigo-500 text-white shadow-amber-500/25 hover:shadow-purple-500/40 hover:scale-[1.005] active:scale-[0.995]'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-amber-200" />
            <span>AI Upscaling & Rendering Video ({selectedResolution})...</span>
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5 text-amber-200 group-hover:rotate-12 transition-transform duration-300" />
            <span>Start AI Edit ({selectedResolution})</span>
          </>
        )}
      </button>
    </div>
  );
};
