import React from 'react';
import { Wand2, Loader2, Sparkles, Crown, Crosshair, Gamepad2 } from 'lucide-react';
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

const PRIMARY_4K_PRESETS = [
  {
    icon: <Crown className="w-3.5 h-3.5 text-amber-400" />,
    label: '👑 PUBG Dark Fantasy (4K Master)',
    prompt: 'Apply dark fantasy PUBG lobby color grade, add beat sync zoom pulse at 1.2s on dance move, trim first 2 seconds, upscale to crisp 4K Ultra HD',
  },
  {
    icon: <Crosshair className="w-3.5 h-3.5 text-rose-400" />,
    label: '🔥 Velocity Speed Ramp (4K Master)',
    prompt: 'Apply dramatic velocity speed ramp, add beat sync zoom on dance move at 1.2s, set RGB shake, and enhance quality to 4K Ultra HD',
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
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          4K AI Video Upscaler & Editing Prompt
        </label>
        <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/30 text-amber-300 font-medium flex items-center gap-1">
          <Gamepad2 className="w-3.5 h-3.5 text-amber-400" /> 4K Ultra HD Active
        </span>
      </div>

      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your 4K video edits e.g., 'Add beat sync zoom on dance move, velocity speed ramp, PUBG dark fantasy color grade, and upscale to 4K Ultra HD'..."
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

      {/* Primary 4K Presets */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5 text-amber-400" /> Quick 4K Edit Recipes:
        </p>
        <div className="flex flex-wrap gap-2 max-w-full">
          {PRIMARY_4K_PRESETS.map((recipe, idx) => (
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
            <span>AI Upscaling & Rendering Video in 4K...</span>
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5 text-amber-200 group-hover:rotate-12 transition-transform duration-300" />
            <span>Start 4K AI Video Edit</span>
          </>
        )}
      </button>
    </div>
  );
};
