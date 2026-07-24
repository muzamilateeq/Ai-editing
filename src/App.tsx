import { useState, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { PromptInput } from './components/PromptInput';
import { VideoPlayer } from './components/VideoPlayer';
import { ParsedOpsViewer, VideoEditInstructions } from './components/ParsedOpsViewer';
import { Enhancer4KPage } from './components/Enhancer4KPage';
import { Wand2, Film, Sparkles, AlertCircle, CheckCircle2, Video, RefreshCw, KeyRound, Crown, Layers } from 'lucide-react';

interface EditResult {
  resultUrl: string;
  originalUrl: string;
  referenceUrl?: string | null;
  instructions: VideoEditInstructions;
  aiSource: 'gemini' | 'fallback';
  prompt: string;
}

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
};

const API_BASE_URL = getApiBaseUrl();

export default function App() {
  const [activeTab, setActiveTab] = useState<'editor' | '4k'>('editor');

  const [userFile, setUserFile] = useState<File | null>(null);
  const [userPreviewUrl, setUserPreviewUrl] = useState<string | null>(null);

  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState<string | null>(null);

  const [prompt, setPrompt] = useState<string>('Add beat sync zoom on dance move, apply PUBG dark fantasy lobby color grade, velocity speed ramp, upscale to 4K Ultra HD');
  const [selectedResolution, setSelectedResolution] = useState<'1080p' | '2K' | '4K'>('4K');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editResult, setEditResult] = useState<EditResult | null>(null);
  const [healthInfo, setHealthInfo] = useState<{ geminiKeyConfigured: boolean } | null>(null);

  // Check backend status on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setHealthInfo(data))
      .catch(() => setHealthInfo(null));
  }, []);

  const handleUserFileSelect = (file: File | null) => {
    if (userPreviewUrl) {
      URL.revokeObjectURL(userPreviewUrl);
    }
    setUserFile(file);
    if (file) {
      setUserPreviewUrl(URL.createObjectURL(file));
      setEditResult(null);
      setError(null);
    } else {
      setUserPreviewUrl(null);
    }
  };

  const handleReferenceFileSelect = (file: File | null) => {
    if (referencePreviewUrl) {
      URL.revokeObjectURL(referencePreviewUrl);
    }
    setReferenceFile(file);
    if (file) {
      setReferencePreviewUrl(URL.createObjectURL(file));
      setEditResult(null);
      setError(null);
    } else {
      setReferencePreviewUrl(null);
    }
  };

  const handleStartEditing = async () => {
    if (!userFile) return;

    setIsLoading(true);
    setError(null);

    let finalPrompt = prompt.trim();
    if (!finalPrompt.toLowerCase().includes('1080p') && !finalPrompt.toLowerCase().includes('2k') && !finalPrompt.toLowerCase().includes('4k')) {
      finalPrompt += `, render output in crisp ${selectedResolution} quality`;
    }

    const formData = new FormData();
    formData.append('user_video', userFile);
    formData.append('video', userFile);
    if (referenceFile) {
      formData.append('reference_video', referenceFile);
    }
    formData.append('prompt', finalPrompt);
    formData.append('resolution', selectedResolution);

    let endpoint = `${API_BASE_URL}/api/edit`;
    if (selectedResolution === '4K' || finalPrompt.toLowerCase().includes('4k')) {
      endpoint = `${API_BASE_URL}/api/free-4k-upscale`;
    } else if (referenceFile) {
      endpoint = `${API_BASE_URL}/api/edit-with-reference`;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned HTML response (${response.status}): ${text.substring(0, 150)}`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to edit video');
      }

      const buildFullUrl = (urlPath: string) => urlPath.startsWith('http') ? urlPath : `${API_BASE_URL}${urlPath}`;

      setEditResult({
        resultUrl: buildFullUrl(data.resultUrl),
        originalUrl: buildFullUrl(data.originalUrl),
        referenceUrl: data.referenceUrl ? buildFullUrl(data.referenceUrl) : null,
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
      {/* Top Main Navigation Bar & Page Selector */}
      <header className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white flex-shrink-0 animate-pulse-glow">
            <Video className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-amber-200">
              AI Video Studio Pro
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Page 1: AI Video Studio & Reference Edits | Page 2: Dedicated 4K Ultra-HD Enhancer
            </p>
          </div>
        </div>

        {/* 2-Page Tab Selector Buttons */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 relative z-10">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'editor'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Wand2 className="w-4 h-4 text-indigo-300" />
            Page 1: AI Video Studio
          </button>

          <button
            onClick={() => setActiveTab('4k')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-200 flex items-center gap-2 ${
              activeTab === '4k'
                ? 'bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 text-white shadow-lg shadow-amber-500/20 ring-1 ring-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400" />
            Page 2: 4K Ultra-HD Enhancer
          </button>
        </div>
      </header>

      {/* PAGE 1: AI Video Studio & Quick Edits */}
      {activeTab === 'editor' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Dual Video Uploaders */}
            <div className="lg:col-span-6 flex flex-col space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                Raw Footage & Optional Reference Style Video
              </div>

              <div className="space-y-4">
                <UploadZone
                  selectedFile={userFile}
                  onFileSelect={handleUserFileSelect}
                  videoPreviewUrl={userPreviewUrl}
                  title="Target Raw Video (Footage to edit)"
                  badge="Primary Raw Input"
                  accentColor="indigo"
                />

                <UploadZone
                  selectedFile={referenceFile}
                  onFileSelect={handleReferenceFileSelect}
                  videoPreviewUrl={referencePreviewUrl}
                  title="Reference Style Video (Optional)"
                  badge="AI Style Cloning Source"
                  accentColor="amber"
                />
              </div>
            </div>

            {/* Right Column: Edit Prompt & AI Controls */}
            <div className="lg:col-span-6 flex flex-col space-y-4">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                  AI Prompt & Style Guidance
                </div>
                {userFile && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {referenceFile ? 'Cloning Enabled' : 'Video Ready'}
                  </span>
                )}
              </div>

              <PromptInput
                prompt={prompt}
                setPrompt={setPrompt}
                selectedResolution={selectedResolution}
                onResolutionChange={setSelectedResolution}
                onSubmit={handleStartEditing}
                isLoading={isLoading}
                disabled={!userFile}
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
            <div className="glass-panel rounded-2xl p-6 border border-amber-500/30 space-y-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 animate-pulse" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                  <div>
                    <h4 className="font-semibold text-slate-100 text-sm">
                      Executing AI Video Edit...
                    </h4>
                    <p className="text-xs text-slate-400">
                      Gemini Flash AI is extracting beat sync zooms, velocity ramps, and FFmpeg filter graphs.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-amber-300 animate-pulse">
                  FFmpeg Active
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden relative border border-slate-800">
                <div className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-indigo-500 w-full animate-pulse" />
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
                    AI Edited Video Results
                  </h2>
                </div>
                <span className="text-xs text-slate-400">
                  Render Format: MP4 (H.264 / AAC)
                </span>
              </div>

              {/* Side-by-Side Video Players */}
              <div className={`grid grid-cols-1 ${editResult.referenceUrl ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
                <VideoPlayer
                  title="Target Raw Input"
                  videoUrl={editResult.originalUrl}
                  badge="Raw Clip"
                  badgeType="original"
                />

                {editResult.referenceUrl && (
                  <VideoPlayer
                    title="Reference Style Clip"
                    videoUrl={editResult.referenceUrl}
                    badge="Style Source"
                    badgeType="original"
                  />
                )}

                <VideoPlayer
                  title="AI Cloned Output Result"
                  videoUrl={editResult.resultUrl}
                  badge="FFmpeg Rendered"
                  badgeType="result"
                  downloadName={`ai-edited-${Date.now()}.mp4`}
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
      )}

      {/* PAGE 2: Dedicated 4K Ultra-HD Enhancer */}
      {activeTab === '4k' && (
        <Enhancer4KPage apiBaseUrl={API_BASE_URL} />
      )}
    </div>
  );
}
