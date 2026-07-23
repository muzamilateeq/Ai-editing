import React, { useRef, useState } from 'react';
import { UploadCloud, Film, X, FileVideo, CheckCircle2 } from 'lucide-react';

interface UploadZoneProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  videoPreviewUrl: string | null;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ selectedFile, onFileSelect, videoPreviewUrl }) => {
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
          className={`glass-panel-interactive rounded-2xl p-8 text-center cursor-pointer border-2 border-dashed transition-all duration-300 relative group overflow-hidden ${
            isDragging
              ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
              : 'border-slate-700/70 hover:border-indigo-500/50 hover:bg-slate-900/60'
          }`}
        >
          {/* Subtle hover gradient background */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <div className="flex flex-col items-center justify-center space-y-4 py-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300 text-indigo-400">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <p className="text-lg font-semibold text-slate-100">
                Click to upload or drag & drop video
              </p>
              <p className="text-sm text-slate-400">
                MP4, MOV, WebM or AVI (Up to 250MB)
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300">
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              1-Click AI Automated Editing
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-4 border border-slate-700/80 flex flex-col md:flex-row items-center gap-4 relative overflow-hidden">
          {videoPreviewUrl && (
            <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden bg-black/60 relative border border-slate-800 flex-shrink-0">
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur">
                  Hover to Preview
                </span>
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <h4 className="font-semibold text-slate-100 truncate text-base">
                {selectedFile.name}
              </h4>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            title="Remove video"
          >
            <X className="w-4 h-4" />
            Change Video
          </button>
        </div>
      )}
    </div>
  );
};
