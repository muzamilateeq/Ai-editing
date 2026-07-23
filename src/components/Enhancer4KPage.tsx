import React, { useState } from 'react';
import { UploadZone } from './UploadZone';
import { VideoPlayer } from './VideoPlayer';
import { Crown, Sparkles, Loader2, ShieldCheck, Zap, Layers } from 'lucide-react';

interface Enhancer4KPageProps {
  apiBaseUrl: string;
}

export const Enhancer4KPage: React.FC<Enhancer4KPageProps> = ({ apiBaseUrl }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    resultUrl: string;
    originalUrl: string;
    engine: string;
    resolution: string;
  } | null>(null);

  const handleFileSelect = (file: File | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleStartEnhancing = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('user_video', selectedFile);
    formData.append('video', selectedFile);

    // Merged 4K Master Engine Endpoint
    const endpoint = `${apiBaseUrl}/api/upscale-10x`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to enhance video in 4K');
      }

      const buildFullUrl = (urlPath: string) => urlPath.startsWith('http') ? urlPath : `${apiBaseUrl}${urlPath}`;

      setResult({
        resultUrl: buildFullUrl(data.resultUrl),
        originalUrl: buildFullUrl(data.originalUrl),
        engine: data.upscaleEngine || 'Combined 4K Ultra-HD Master Engine',
        resolution: data.resolution || '3840x2160 (4K Ultra-HD @ 60FPS)',
      });
    } catch (err: any) {
      console.error('Error enhancing video in 4K:', err);
      setError(err.message || 'An error occurred during 4K video enhancement.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 4K Enhancer Hero Banner */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-amber-500/30 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Page 2 • Merged 4K Ultra-HD Video Enhancer
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              1-Click 4K AI Video Enhancer
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Upload any video & click the button below to upscale to <span className="text-amber-300 font-bold">3840x2160 (4K Ultra-HD) @ 60FPS</span> with Lanczos spatial scaling, 13x13 large-matrix sharpness, 3D denoise, and CRF 10 lossless bitrate.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass-panel px-4 py-3 rounded-2xl border border-amber-500/30 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white">Combined 4K Master Engine</div>
                <div className="text-[10px] text-slate-400">3840x2160 Lanczos + 13x13 Sharpening</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container: Single Upload & Single Merged 4K Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">1</span>
            Upload Video File for 4K Enhancement
          </div>
          <UploadZone
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            videoPreviewUrl={previewUrl}
            title="Upload Raw Video for 4K Conversion"
            badge="Target 4K Input Video"
            accentColor="amber"
          />
        </div>

        {/* Right Column: Combined Single Button Control */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">2</span>
            Execute 4K Ultra-HD Enhancement
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6 shadow-xl flex flex-col justify-between h-full">
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-bold text-base text-white">
                <Crown className="w-5 h-5 text-amber-400" />
                Combined 4K Ultra-HD & 10x Clarity Master
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Clicking the button below automatically combines <span className="text-amber-300 font-semibold">3840x2160 Lanczos spatial scaling</span>, <span className="text-purple-300 font-semibold">13x13 large-matrix luminance sharpness</span>, <span className="text-cyan-300 font-semibold">3D noise cleaning</span>, and <span className="text-emerald-300 font-semibold">60FPS smooth motion</span> in 1-click!
              </p>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Merged 1-Click Engine Active: Maximum visible clarity & sharp pixel reconstruction.</span>
              </div>
            </div>

            {/* Single Merged 4K Button */}
            <button
              onClick={handleStartEnhancing}
              disabled={!selectedFile || isLoading}
              className={`w-full py-5 px-6 rounded-xl font-extrabold text-base transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl relative overflow-hidden ${
                !selectedFile || isLoading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:via-purple-500 hover:to-indigo-500 text-white shadow-amber-500/30 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-amber-200" />
                  <span>Enhancing Video in 4K Ultra-HD (3840x2160 @ 60FPS)...</span>
                </>
              ) : (
                <>
                  <Crown className="w-6 h-6 text-amber-200" />
                  <span>Enhance Video in 4K Ultra-HD Master Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm">
          <span className="font-bold text-rose-300">4K Processing Error: </span> {error}
        </div>
      )}

      {/* Results Video Comparison */}
      {result && (
        <div className="space-y-6 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              4K Enhanced Video Comparison
            </h3>
            <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              Output: {result.resolution}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <VideoPlayer
              title="Original Input Video"
              videoUrl={result.originalUrl}
              badge="Raw Input"
              badgeType="original"
            />
            <VideoPlayer
              title="4K Ultra-HD Enhanced Output"
              videoUrl={result.resultUrl}
              badge="3840x2160 @ 60FPS"
              badgeType="result"
              downloadName={`4k-enhanced-${Date.now()}.mp4`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
