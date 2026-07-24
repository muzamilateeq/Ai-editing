import React from 'react';
import { Download, Film, Sparkles, ExternalLink } from 'lucide-react';

interface VideoPlayerProps {
  title: string;
  videoUrl: string;
  badge: string;
  badgeType: 'original' | 'result';
  downloadName?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  title,
  videoUrl,
  badge,
  badgeType,
  downloadName = 'enhanced-4k-video.mp4',
}) => {
  const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (videoUrl.startsWith('blob:')) {
      // Mobile blob download handler
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = downloadName.endsWith('.mp4') || downloadName.endsWith('.webm') ? downloadName : `${downloadName}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      e.preventDefault();
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col space-y-3 relative group shadow-xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {badgeType === 'result' ? (
            <Sparkles className="w-4 h-4 text-purple-400" />
          ) : (
            <Film className="w-4 h-4 text-indigo-400" />
          )}
          <h3 className="font-semibold text-slate-200 text-sm">{title}</h3>
        </div>

        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium border flex items-center gap-1 ${
            badgeType === 'result'
              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
              : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
          }`}
        >
          {badge}
        </span>
      </div>

      {/* HTML5 Video Element with Universal Mobile Source Fallback */}
      <div className="relative rounded-xl overflow-hidden bg-black/90 aspect-video border border-slate-800 shadow-2xl flex items-center justify-center">
        <video
          key={videoUrl}
          controls
          playsInline
          preload="auto"
          className="w-full h-full object-contain"
        >
          <source src={videoUrl} type={videoUrl.startsWith('blob:') ? 'video/webm' : 'video/mp4'} />
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          Your mobile browser does not support playing this video inline. Tap "Download" below to open in gallery.
        </video>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1">
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in new tab
        </a>

        {badgeType === 'result' && (
          <a
            href={videoUrl}
            download={downloadName}
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all hover:scale-105"
          >
            <Download className="w-3.5 h-3.5" />
            Download Enhanced Video
          </a>
        )}
      </div>
    </div>
  );
};
