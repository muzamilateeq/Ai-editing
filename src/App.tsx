import { useState, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { PromptInput } from './components/PromptInput';
import { VideoPlayer } from './components/VideoPlayer';
import { ParsedOpsViewer, VideoEditInstructions } from './components/ParsedOpsViewer';
import { Wand2, Film, Sparkles, AlertCircle, CheckCircle2, Video, RefreshCw, KeyRound } from 'lucide-react';

interface EditResult {
  resultUrl: string;
  originalUrl: string;
  instructions: VideoEditInstructions;
  aiSource: 'gemini' | 'fallback';
  prompt: string;
}

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('Trim the first 3 seconds, speed up by 1.5x, and mute audio');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editResult, setEditResult] = useState<EditResult | null>(null);
  const [healthInfo, setHealthInfo] = useState<{ geminiKeyConfigured: boolean } | null>(null);

  // Check backend status on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealthInfo(data))
      .catch(() => setHealthInfo(null));
  }, []);

  // Update object URL for file preview
  const handleFileSelect = (file: File | null) => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setSelectedFile(file);
    if (file) {
      setVideoPreviewUrl(URL.createObjectURL(file));
      setEditResult(null);
      setError(null);
    } else {
      setVideoPreviewUrl(null);
    }
  };

  const handleStartEditing = async () => {
    if (!selectedFile || !prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('prompt', prompt.trim());

    try {
      const response = await fetch('/api/edit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to edit video');
      }

      setEditResult({
        resultUrl: data.resultUrl,
        originalUrl: data.originalUrl,
        instructions: data.instructions,
        aiSource: data.aiSource,
        prompt: data.prompt,
      });
    } catch (err: any) {
      console.error('Error editing video:', err);
      setError(err.message || 'An error occurred while communicating with the backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-16 pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header Bar */}
      <header className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800 relative overflow-hidden shadow-2xl">
        {/* Background glow effects */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white flex-shrink-0 animate-pulse-glow">
            <Video className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                AI Video Editor
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30">
                Gemini Flash
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Upload video &rarr; Prompt instructions &rarr; Gemini parses FFmpeg commands &rarr; Instant edit
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3 relative z-10 text-xs">
          <div className="glass-panel px-3.5 py-2 rounded-xl flex items-center gap-2 border border-slate-800">
            <Sparkles className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-slate-300 font-medium">
              Engine: <span className="text-white font-semibold">Gemini 2.5 Flash</span>
            </span>
          </div>

          {healthInfo && (
            <div className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 font-medium ${
              healthInfo.geminiKeyConfigured
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              <KeyRound className="w-3.5 h-3.5" />
              {healthInfo.geminiKeyConfigured ? 'API Key Active' : 'Fallback Engine (Set .env)'}
            </div>
          )}
        </div>
      </header>

      {/* Main Grid: Upload & Prompt Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">1</span>
            Upload Video File
          </div>
          <UploadZone
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            videoPreviewUrl={videoPreviewUrl}
          />
        </div>

        {/* Right Column: Edit Prompt */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">2</span>
              Describe Desired Edits
            </div>
            {selectedFile && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Video Ready
              </span>
            )}
          </div>

          <PromptInput
            prompt={prompt}
            setPrompt={setPrompt}
            onSubmit={handleStartEditing}
            isLoading={isLoading}
            disabled={!selectedFile}
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-200 text-sm shadow-xl">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-rose-300">Processing Error</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Loading Progress State Banner */}
      {isLoading && (
        <div className="glass-panel rounded-2xl p-6 border border-indigo-500/30 space-y-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 animate-pulse" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
              <div>
                <h4 className="font-semibold text-slate-100 text-sm">Editing Video in Progress...</h4>
                <p className="text-xs text-slate-400">Gemini Flash AI is parsing options and FFmpeg is re-encoding the stream.</p>
              </div>
            </div>
            <span className="text-xs font-mono text-indigo-300 animate-pulse">FFmpeg Running</span>
          </div>

          {/* Progress bar animation */}
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden relative border border-slate-800">
            <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 w-full animate-pulse" />
          </div>
        </div>
      )}

      {/* Results Section */}
      {editResult && (
        <div className="space-y-6 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">3</span>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Video Edit Results
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Output format: MP4 (H.264 / AAC)
            </span>
          </div>

          {/* Side-by-Side Video Players */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <VideoPlayer
              title="Original Upload"
              videoUrl={editResult.originalUrl}
              badge="Source File"
              badgeType="original"
            />

            <VideoPlayer
              title="AI Edited Result"
              videoUrl={editResult.resultUrl}
              badge="FFmpeg Processed"
              badgeType="result"
              downloadName={`edited-${Date.now()}.mp4`}
            />
          </div>

          {/* Parsed AI Operations Inspection */}
          <ParsedOpsViewer
            instructions={editResult.instructions}
            aiSource={editResult.aiSource}
            rawPrompt={editResult.prompt}
          />
        </div>
      )}
    </div>
  );
}
