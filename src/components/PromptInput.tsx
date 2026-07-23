import React from 'react';
import { Wand2, Loader2, Sparkles, Zap } from 'lucide-react';

interface PromptInputProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled: boolean;
}

const PRESET_RECIPES = [
  { label: '✂️ Trim 3s & Speed 1.5x', prompt: 'Trim the first 3 seconds, speed up by 1.5x, and mute audio' },
  { label: '🎬 Black & White Silent', prompt: 'Convert to grayscale, mute audio, and trim first 2 seconds' },
  { label: '⚡ 2x Fast Forward', prompt: 'Speed up video by 2.0x speed' },
  { label: '🔄 Mirror & Slow Mo', prompt: 'Flip horizontally and slow down to 0.5x speed' },
  { label: '🔉 Half Volume & Trim', prompt: 'Reduce volume to 0.5x and trim first 4 seconds' },
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
    <div className="glass-panel rounded-2xl p-6 space-y-4 border border-slate-800">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Natural Language Edit Prompt
        </label>
        <span className="text-xs text-slate-400">Powered by Gemini 2.5 Flash AI</span>
      </div>

      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your edits e.g., 'Trim the first 3 seconds, speed up by 1.5x, convert to grayscale, and mute audio'..."
          disabled={isLoading}
          rows={3}
          className="w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 rounded-xl p-4 text-sm border border-slate-700/70 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all resize-none shadow-inner"
        />

        <div className="absolute bottom-3 right-3 text-xs text-slate-500 pointer-events-none">
          Press Enter to run
        </div>
      </div>

      {/* Preset Chips */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-400 flex items-center gap-1">
          <Zap className="w-3 h-3 text-indigo-400" /> Quick Recipes:
        </p>
        <div className="flex flex-wrap gap-2 max-w-full">
          {PRESET_RECIPES.map((recipe, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(recipe.prompt)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-900/40 hover:text-indigo-200 border border-slate-700/60 hover:border-indigo-500/40 text-slate-300 transition-all duration-200 flex items-center gap-1.5 active:scale-95 touch-manipulation"
            >
              {recipe.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={disabled || isLoading || !prompt.trim()}
        className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg relative overflow-hidden group ${
          disabled || isLoading || !prompt.trim()
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.005] active:scale-[0.995]'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-indigo-200" />
            <span>Processing Video with AI & FFmpeg...</span>
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5 text-indigo-200 group-hover:rotate-12 transition-transform duration-300" />
            <span>Start Editing Video</span>
          </>
        )}
      </button>
    </div>
  );
};
