import React from 'react';
import { Wand2, Loader2, Sparkles, Zap, Flame, Film, Smartphone, Music, Sun } from 'lucide-react';

interface PromptInputProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled: boolean;
}

const NEXT_GEN_PRESETS = [
  {
    icon: <Smartphone className="w-3.5 h-3.5 text-pink-400" />,
    label: '📱 TikTok Reel (9:16)',
    prompt: 'Crop to 9:16 vertical for TikTok, speed up by 1.5x, apply Cyberpunk color grade, and trim first 2 seconds',
  },
  {
    icon: <Film className="w-3.5 h-3.5 text-amber-400" />,
    label: '🌇 Vintage Retro 80s',
    prompt: 'Apply vintage 80s retro film style with warm tones, vignette effect, slow down to 0.8x, and trim first 3 seconds',
  },
  {
    icon: <Flame className="w-3.5 h-3.5 text-cyan-400" />,
    label: '⚡ Cyberpunk Neon',
    prompt: 'Apply vibrant Cyberpunk neon color grade with high contrast, 2.0x speed, and trim first 2 seconds',
  },
  {
    icon: <Sun className="w-3.5 h-3.5 text-emerald-400" />,
    label: '🎬 Matrix Hacker',
    prompt: 'Apply Matrix green color grading with dramatic contrast and speed up by 1.5x',
  },
  {
    icon: <Music className="w-3.5 h-3.5 text-purple-400" />,
    label: '🔊 Audio Fade & Boost',
    prompt: 'Boost volume to 2.0x, add 1.5s audio fade out at the end, and trim first 4 seconds',
  },
  {
    icon: <Zap className="w-3.5 h-3.5 text-yellow-400" />,
    label: '✂️ 16:9 Cinematic Widescreen',
    prompt: 'Crop to 16:9 widescreen, set dramatic color grade, trim first 3 seconds, and speed up 1.25x',
  },
];

export const PromptInput: React.FC<PromptInputProps> = ({
  prompt,
  setPrompt,
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
          Next-Gen AI Creative Prompt
        </label>
        <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium">
          Gemini 2.5 Flash + FFmpeg Engine
        </span>
      </div>

      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe any creative edit e.g., 'Make it a 9:16 TikTok reel with Cyberpunk color grading, 1.5x speed, audio boost, and trim first 3s'..."
          disabled={isLoading}
          rows={3}
          className="w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 rounded-xl p-4 text-sm border border-slate-700/70 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all resize-none shadow-inner"
        />

        <div className="absolute bottom-3 right-3 text-xs text-slate-500 pointer-events-none hidden sm:block">
          Press Enter to execute
        </div>
      </div>

      {/* Preset Chips */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-indigo-400" /> Next-Gen AI Presets:
        </p>
        <div className="flex flex-wrap gap-2 max-w-full">
          {NEXT_GEN_PRESETS.map((recipe, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(recipe.prompt)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-indigo-900/50 hover:text-white border border-slate-700/70 hover:border-indigo-500/50 text-slate-200 transition-all duration-200 flex items-center gap-1.5 active:scale-95 touch-manipulation shadow-sm"
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
            : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-indigo-500/25 hover:shadow-purple-500/40 hover:scale-[1.005] active:scale-[0.995]'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-indigo-200" />
            <span>AI Rendering Next-Gen Video Stream...</span>
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5 text-indigo-200 group-hover:rotate-12 transition-transform duration-300" />
            <span>Execute Next-Gen AI Edit</span>
          </>
        )}
      </button>
    </div>
  );
};
