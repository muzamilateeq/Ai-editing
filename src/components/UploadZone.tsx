import React, { useRef, useState } from 'react';
import { UploadCloud, Film, X, FileVideo, CheckCircle2 } from 'lucide-react';

interface UploadZoneProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  videoPreviewUrl: string | null;
  title?: string;
  badge?: string;
  accentColor?: 'indigo' | 'purple' | 'amber';
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  selectedFile,
  onFileSelect,
  videoPreviewUrl,
  title = 'Click to upload or drag & drop video',
  badge = '1-Click AI Automated Editing',
  accentColor = 'indigo',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|webm|avi|mkv)$/i)) {
        onFileSelect(file);
      } else {
        alert('Please drop a valid video file (MP4, MOV, WebM).');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const colorClasses = {
    indigo: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400',
    purple: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
    amber: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
  }[accentColor];

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/mp4,video/quicktime,video/webm,video/avi"
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`glass-panel-interactive rounded-2xl p-6 text-center cursor-pointer border-2 border-dashed transition-all duration-300 relative group overflow-hidden ${
            isDragging
              ? colorClasses
              : 'border-slate-700/70 hover:border-indigo-500/50 hover:bg-slate-900/60'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-3 py-2 relative z-10">
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-all duration-300 ${colorClasses}`}>
              <UploadCloud className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-100">{title}</p>
              <p className="text-xs text-slate-400">MP4, MOV, WebM (Up to 250MB)</p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300">
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              {badge}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-4 border border-slate-700/80 flex flex-col md:flex-row items-center gap-4 relative overflow-hidden">
          {videoPreviewUrl && (
            <div className="w-full md:w-40 h-28 rounded-xl overflow-hidden bg-black/60 relative border border-slate-800 flex-shrink-0">
              <video
                src={videoPreviewUrl}
                className="w-full h-full object-cover"
                muted
                playsInline
                onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                onMouseOut={(e) => {
                  const v = e.target as HTMLVideoElement;
                  v.pause();
                  v.currentTime = 0;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-1.5">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-300 bg-slate-900/80 px-1.5 py-0.5 rounded backdrop-blur">
                  Preview
                </span>
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <h4 className="font-semibold text-slate-100 truncate text-sm">
                {selectedFile.name}
              </h4>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <FileVideo className="w-3.5 h-3.5 text-indigo-400" />
                {formatFileSize(selectedFile.size)}
              </span>
              <span>•</span>
              <span className="uppercase">{selectedFile.type || 'Video'}</span>
            </div>
          </div>

          <button
            onClick={() => {
              onFileSelect(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            title="Change file"
          >
            <X className="w-3.5 h-3.5" />
            Change
          </button>
        </div>
      )}
    </div>
  );
};
