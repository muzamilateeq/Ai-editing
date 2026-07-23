import React from 'react';
import { Crown, Sparkles, Zap, Tv, Sparkle } from 'lucide-react';
import type { UpscaleOption } from '../../server/lib/qualityEnhancer';

interface ResolutionSelectorProps {
  selectedResolution: '1080p' | '2K' | '4K';
  onResolutionChange: (res: '1080p' | '2K' | '4K') => void;
  disabled?: boolean;
}

export const ResolutionSelector: React.FC<ResolutionSelectorProps> = ({
  selectedResolution,
  onResolutionChange,
  disabled = false,
}) => {
  const RESOLUTIONS: { id: '1080p' | '2K' | '4K'; label: string; sub: string; badge: string; icon: React.ReactNode }[] = [
    {
      id: '1080p',
      label: '1080p Full HD',
      sub: 'Fast Render • 1920x1080',
      badge: 'Standard',
      icon: <Tv className="w-4 h-4 text-indigo-400" />,
    },
    {
      id: '2K',
      label: '2K QHD Master',
      sub: 'Enhanced Sharpened • 2560x1440',
      badge: 'Lanczos 2K',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    },
    {
      id: '4K',
      label: '4K Ultra HD',
      sub: 'Crisp Master • 3840x2160',
      badge: '4K Master',
      icon: <Crown className="w-4 h-4 text-amber-400" />,
    },
  ];

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Output Resolution & Quality Engine
        </label>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono flex items-center gap-1">
          <Sparkle className="w-3 h-3 text-amber-400" /> 4K Ultra-HD Crisp Engine
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {RESOLUTIONS.map((res) => {
          const isSelected = selectedResolution === res.id;
          return (
            <button
              key={res.id}
              type="button"
              disabled={disabled}
              onClick={() => onResolutionChange(res.id)}
              className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between space-y-2 ${
                isSelected
                  ? 'bg-slate-800/90 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'bg-slate-900/60 border-slate-700/60 hover:bg-slate-800/60 hover:border-slate-600 text-slate-400'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {res.icon}
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {res.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 truncate max-w-[140px]">{res.sub}</span>
                {isSelected && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 flex-shrink-0">
                    Active
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
