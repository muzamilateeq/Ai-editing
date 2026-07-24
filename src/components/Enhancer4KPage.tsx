import React, { useState } from 'react';
import { UploadZone } from './UploadZone';
import { VideoPlayer } from './VideoPlayer';
import { Crown, Sparkles, Loader2, ShieldCheck, Zap, Layers, CheckCircle2, AlertCircle, RefreshCw, Cpu } from 'lucide-react';

interface Enhancer4KPageProps {
  apiBaseUrl: string;
}

interface FallbackStatus {
  engine: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
}

export const Enhancer4KPage: React.FC<Enhancer4KPageProps> = ({ apiBaseUrl }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeEngineStage, setActiveEngineStage] = useState<string>('Initializing Multi-AI Fallback Engine...');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    resultUrl: string;
    originalUrl: string;
    engineUsed: string;
    fallbackHistory: FallbackStatus[];
    resolution: string;
    aiReport?: string;
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
    setActiveEngineStage('Engine A: Querying Replicate Real-ESRGAN Neural AI...');

    const formData = new FormData();
    formData.append('user_video', selectedFile);
    formData.append('video', selectedFile);

    const endpoint = `${apiBaseUrl}/api/enhance-video-4k`;

    // Simulated progress stage updates for real-time user feedback
    const timer1 = setTimeout(() => {
      setActiveEngineStage('Engine B: Gemini 2.0 Flash Multimodal Vision AI analyzing keyframes & edge vectors...');
    }, 2500);

    const timer2 = setTimeout(() => {
      setActiveEngineStage('Engine C: Executing Sub-Pixel Spline 4K Scaling + 11x11 Sharpening Matrix...');
    }, 6000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to enhance video in 4K');
      }

      const buildFullUrl = (urlPath: string) => urlPath.startsWith('http') ? urlPath : `${apiBaseUrl}${urlPath}`;

      setResult({
        resultUrl: buildFullUrl(data.resultUrl),
        originalUrl: buildFullUrl(data.originalUrl),
        engineUsed: data.engineUsed || 'Multi-AI 4K Engine Manager',
        fallbackHistory: data.fallbackHistory || [],
        resolution: data.resolution || '3840x2160 (4K Ultra-HD @ 60FPS)',
        aiReport: data.aiReport,
      });
    } catch (err: any) {
      console.error('Error enhancing video in 4K:', err);
      setError(err.message || 'An error occurred during Multi-AI 4K video enhancement.');
    } finally {
      setIsLoading(false);
      setActiveEngineStage('');
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
              Page 2 • Multi-AI 4K Video Enhancer & Quality Cleaner
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              Multi-AI 4K Video Quality Enhancer
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Automatic Multi-AI Fallback Sequence: <span className="text-amber-300 font-bold">Engine A (Real-ESRGAN)</span> &rarr; <span className="text-purple-300 font-bold">Engine B (Gemini 2.0 Flash Vision AI)</span> &rarr; <span className="text-emerald-300 font-bold">Engine C (Local Spline 4K Master Engine)</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass-panel px-4 py-3 rounded-2xl border border-amber-500/30 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white">Multi-AI Manager Active</div>
                <div className="text-[10px] text-slate-400">Automatic Fallback Sequence</div>
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
            Upload Video File for Multi-AI 4K Enhancement
          </div>
          <UploadZone
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            videoPreviewUrl={previewUrl}
            title="Upload Raw Video for Multi-AI 4K Conversion"
            badge="Target 4K Input Video"
            accentColor="amber"
          />
        </div>

        {/* Right Column: Multi-AI Enhancement Action */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">2</span>
            Execute Multi-AI 4K Enhancement
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6 shadow-xl flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-base text-white">
                <Crown className="w-5 h-5 text-amber-400" />
                Multi-Provider AI Fallback Engine
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Clicking the button below passes your video through our automated multi-provider AI pipeline. If Engine A times out or requires API credits, the system automatically hands over execution to Engine B (Gemini 2.0 Flash Vision AI) and Engine C (Local Spline 4K Master Engine) without failing!
              </p>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/20 text-slate-300 space-y-1">
                  <div className="font-bold text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Engine A
                  </div>
                  <div className="text-[10px] text-slate-400">Real-ESRGAN Neural</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-purple-500/20 text-slate-300 space-y-1">
                  <div className="font-bold text-purple-300 flex items-center gap-1">
                    <Cpu className="w-3 h-3" /> Engine B
                  </div>
                  <div className="text-[10px] text-slate-400">Gemini Flash Vision</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/20 text-slate-300 space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Engine C
                  </div>
                  <div className="text-[10px] text-slate-400">Spline 4K Master</div>
                </div>
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
                  <span>Enhancing Video to 4K Ultra-HD (3840x2160 @ 60FPS)...</span>
                </>
              ) : (
                <>
                  <Crown className="w-6 h-6 text-amber-200" />
                  <span>Enhance Video in 4K Ultra-HD Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Progress State Banner */}
      {isLoading && (
        <div className="glass-panel rounded-2xl p-6 border border-purple-500/30 space-y-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 animate-pulse" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
              <div>
                <h4 className="font-semibold text-slate-100 text-sm">
                  Multi-AI Enhancement Active
                </h4>
                <p className="text-xs text-purple-300 font-medium">
                  {activeEngineStage}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-amber-300 animate-pulse">
              Multi-AI Active
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden relative border border-slate-800">
            <div className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-indigo-500 w-full animate-pulse" />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-rose-300">Multi-AI Processing Error: </span> {error}
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-6 pt-4 border-t border-slate-800">
          {/* Active Engine Badge & Fallback History */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Processed Engine Provider</div>
                <div className="text-base font-bold text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  {result.engineUsed}
                </div>
              </div>

              <span className="text-xs px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 self-start sm:self-auto">
                Output Resolution: {result.resolution}
              </span>
            </div>

            {/* Fallback Sequence History Badges */}
            {result.fallbackHistory && result.fallbackHistory.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-800/80">
                <div className="text-xs font-semibold text-slate-300">Multi-AI Fallback Execution History:</div>
                <div className="flex flex-wrap gap-2">
                  {result.fallbackHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 ${
                        item.status === 'success'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : item.status === 'failed'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {item.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {item.status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                      {item.status === 'skipped' && <Zap className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{item.engine}</span>
                      <span className="text-[10px] opacity-75 uppercase">({item.status})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gemini AI Multimodal Vision Report */}
            {result.aiReport && (
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200">
                <span className="font-bold text-purple-300">AI Intelligence Insight: </span>
                {result.aiReport}
              </div>
            )}
          </div>

          {/* Side-by-Side Video Players */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <VideoPlayer
              title="Original Input Video"
              videoUrl={result.originalUrl}
              badge="Raw Input"
              badgeType="original"
            />
            <VideoPlayer
              title="Multi-AI 4K Enhanced Output"
              videoUrl={result.resultUrl}
              badge="3840x2160 @ 60FPS"
              badgeType="result"
              downloadName={`multi-ai-4k-enhanced-${Date.now()}.mp4`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
