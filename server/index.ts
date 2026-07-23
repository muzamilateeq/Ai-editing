import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { parseVideoEditPrompt } from './lib/geminiParser.js';
import { processVideoWithFFmpeg } from './lib/ffmpegRunner.js';
import { analyzeReferenceVideo } from './lib/referenceAnalyzer.js';
import { processStyleTransferWithFFmpeg } from './lib/ffmpegStyleTransfer.js';
import { processHuggingFace4KUpscale } from './lib/huggingFace4k.js';
import { processUltra10XUpscale } from './lib/ultra10xUpscaler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3001;

// Define directories for uploads and outputs
const UPLOADS_DIR = path.join(rootDir, 'public', 'uploads');
const OUTPUTS_DIR = path.join(rootDir, 'public', 'outputs');

// Ensure public directories exist
[UPLOADS_DIR, OUTPUTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static assets (uploaded videos & processed outputs)
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/outputs', express.static(OUTPUTS_DIR));
app.use(express.static(path.join(rootDir, 'public')));
app.use(express.static(path.join(rootDir, 'dist')));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const timestamp = Date.now();
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, `input-${timestamp}-${safeName}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 }, // 250MB limit
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/mpeg'];
    if (allowedMimeTypes.includes(file.mimetype) || file.originalname.match(/\.(mp4|mov|webm|avi|mkv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload a valid MP4, MOV, or WebM video file.'));
    }
  },
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiKeyConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
  });
});

// Primary Video Editing API Endpoint
app.post('/api/edit', upload.single('video'), async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const file = req.file;
    const prompt = req.body?.prompt;

    if (!file) {
      res.status(400).json({ success: false, error: 'No video file was uploaded.' });
      return;
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      res.status(400).json({ success: false, error: 'Edit prompt is required.' });
      return;
    }

    console.log(`\n==================================================`);
    console.log(`[API /api/edit] Received file: ${file.filename} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`[API /api/edit] User Prompt: "${prompt}"`);

    // Step 1: Parse User Prompt via Gemini AI (or Fallback Engine)
    console.log(`[API /api/edit] Step 1: Parsing prompt via AI...`);
    const parseResult = await parseVideoEditPrompt(prompt);
    console.log(`[API /api/edit] AI Parsing Result (${parseResult.source}):`, parseResult.instructions);

    // Step 2: Prepare output file path
    const outputFilename = `edited-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.mp4`;
    const outputPath = path.join(OUTPUTS_DIR, outputFilename);

    // Step 3: Run FFmpeg processing pipeline
    console.log(`[API /api/edit] Step 2: Processing video with FFmpeg...`);
    await processVideoWithFFmpeg(file.path, outputPath, parseResult.instructions);

    const relativeResultUrl = `/outputs/${outputFilename}`;
    const relativeOriginalUrl = `/uploads/${file.filename}`;

    console.log(`[API /api/edit] Step 3: Success! Edited output ready at ${relativeResultUrl}`);
    console.log(`==================================================\n`);

    res.json({
      success: true,
      resultUrl: relativeResultUrl,
      originalUrl: relativeOriginalUrl,
      instructions: parseResult.instructions,
      aiSource: parseResult.source,
      prompt: prompt,
      rawAiResponse: parseResult.rawResponse,
    });
  } catch (error: any) {
    console.error('[API /api/edit] Error during video edit process:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred while processing your video.',
    });
  }
});

// Reference Style Cloning API Endpoint
app.post(
  '/api/edit-with-reference',
  upload.fields([
    { name: 'user_video', maxCount: 1 },
    { name: 'reference_video', maxCount: 1 },
    { name: 'video', maxCount: 1 }, // Fallback alias
  ]),
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const userFile = files?.['user_video']?.[0] || files?.['video']?.[0];
      const referenceFile = files?.['reference_video']?.[0];
      const prompt = req.body?.prompt || '';

      if (!userFile) {
        res.status(400).json({ success: false, error: 'Target user video file (user_video) is required.' });
        return;
      }

      console.log(`\n==================================================`);
      console.log(`[API /api/edit-with-reference] Processing Reference Style Cloning...`);
      console.log(`[API /api/edit-with-reference] Target Video: ${userFile.filename}`);
      if (referenceFile) {
        console.log(`[API /api/edit-with-reference] Reference Style Video: ${referenceFile.filename}`);
      }

      // Step 1: Analyze Reference Video via Gemini Multimodal Flash
      const referencePath = referenceFile ? referenceFile.path : '';
      const analysisResult = await analyzeReferenceVideo(referencePath, prompt);
      console.log(`[API /api/edit-with-reference] Reference Analysis (${analysisResult.source}):`, analysisResult.style);

      // Step 2: Prepare output file path
      const outputFilename = `cloned-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.mp4`;
      const outputPath = path.join(OUTPUTS_DIR, outputFilename);

      // Step 3: Run FFmpeg Style Transfer pipeline
      await processStyleTransferWithFFmpeg(userFile.path, outputPath, analysisResult.style);

      const relativeResultUrl = `/outputs/${outputFilename}`;
      const relativeOriginalUrl = `/uploads/${userFile.filename}`;
      const relativeReferenceUrl = referenceFile ? `/uploads/${referenceFile.filename}` : null;

      console.log(`[API /api/edit-with-reference] Success! Cloned video ready at ${relativeResultUrl}`);
      console.log(`==================================================\n`);

      res.json({
        success: true,
        resultUrl: relativeResultUrl,
        originalUrl: relativeOriginalUrl,
        referenceUrl: relativeReferenceUrl,
        instructions: analysisResult.style,
        aiSource: analysisResult.source,
        prompt: prompt,
        rawAiResponse: analysisResult.rawResponse,
      });
    } catch (error: any) {
      console.error('[API /api/edit-with-reference] Error during style transfer:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'An unexpected error occurred during style transfer.',
      });
    }
  }
);

// Pro 4K AI Master Editing API Endpoint
app.post(
  '/api/edit-pro-4k',
  upload.fields([
    { name: 'user_video', maxCount: 1 },
    { name: 'reference_video', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const userFile = files?.['user_video']?.[0] || files?.['video']?.[0];
      const referenceFile = files?.['reference_video']?.[0];
      const prompt = req.body?.prompt || '';
      const targetRes = (req.body?.resolution as '1080p' | '2K' | '4K') || '4K';

      if (!userFile) {
        res.status(400).json({ success: false, error: 'Target video file is required.' });
        return;
      }

      console.log(`\n==================================================`);
      console.log(`[API /api/edit-pro-4k] Starting Pro 4K AI Video Render...`);
      console.log(`[API /api/edit-pro-4k] Resolution: ${targetRes}`);
      console.log(`[API /api/edit-pro-4k] User Video: ${userFile.filename}`);

      let instructions: any;
      let aiSource: 'gemini' | 'fallback' = 'gemini';
      let rawAiResponse: string | undefined;

      if (referenceFile) {
        console.log(`[API /api/edit-pro-4k] Reference Style Video: ${referenceFile.filename}`);
        const refAnalysis = await analyzeReferenceVideo(referenceFile.path, prompt);
        instructions = refAnalysis.style;
        aiSource = refAnalysis.source;
        rawAiResponse = refAnalysis.rawResponse;
      } else {
        const parseResult = await parseVideoEditPrompt(prompt);
        instructions = parseResult.instructions;
        aiSource = parseResult.source;
        rawAiResponse = parseResult.rawResponse;
      }

      // Enforce Pro 4K Upscale Option
      instructions.upscale = {
        target: targetRes,
        mode: 'pro_master',
        sharpening: 0.5,
        denoise: true,
      };

      const outputFilename = `pro-4k-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.mp4`;
      const outputPath = path.join(OUTPUTS_DIR, outputFilename);

      if (targetRes === '4K' || prompt.toLowerCase().includes('4k')) {
        console.log(`[API /api/edit-pro-4k] 4K Requested: Routing to Hugging Face Open-Source AI Super-Resolution...`);
        await processHuggingFace4KUpscale({
          inputPath: userFile.path,
          outputPath: outputPath,
          targetResolution: '3840x2160',
          fps: 60,
        });
      } else if (referenceFile) {
        await processStyleTransferWithFFmpeg(userFile.path, outputPath, instructions);
      } else {
        await processVideoWithFFmpeg(userFile.path, outputPath, instructions);
      }

      const relativeResultUrl = `/outputs/${outputFilename}`;
      const relativeOriginalUrl = `/uploads/${userFile.filename}`;
      const relativeReferenceUrl = referenceFile ? `/uploads/${referenceFile.filename}` : null;

      console.log(`[API /api/edit-pro-4k] Pro 4K Render Success! Output: ${relativeResultUrl}`);
      console.log(`==================================================\n`);

      res.json({
        success: true,
        resultUrl: relativeResultUrl,
        originalUrl: relativeOriginalUrl,
        referenceUrl: relativeReferenceUrl,
        instructions: instructions,
        aiSource: aiSource,
        prompt: prompt,
        rawAiResponse: rawAiResponse,
      });
    } catch (error: any) {
      console.error('[API /api/edit-pro-4k] Error during Pro 4K render:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'An unexpected error occurred during 4K render.',
      });
    }
  }
);

// Dedicated 4K Open-Source Master Upscaler API Endpoint
app.post(
  '/api/free-4k-upscale',
  upload.fields([
    { name: 'user_video', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const videoFile = files?.['user_video']?.[0] || files?.['video']?.[0];

      if (!videoFile) {
        res.status(400).json({ success: false, error: 'Video file (user_video) is required for 4K upscale.' });
        return;
      }

      console.log(`\n==================================================`);
      console.log(`[API /api/free-4k-upscale] Starting 4K AI Master Conversion...`);
      console.log(`[API /api/free-4k-upscale] Input File: ${videoFile.filename}`);

      const outputFilename = `master-4k-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.mp4`;
      const outputPath = path.join(OUTPUTS_DIR, outputFilename);

      const masterResult = await processHuggingFace4KUpscale({
        inputPath: videoFile.path,
        outputPath: outputPath,
        targetResolution: '3840x2160',
        fps: 60,
      });

      const relativeResultUrl = `/outputs/${outputFilename}`;
      const relativeOriginalUrl = `/uploads/${videoFile.filename}`;

      console.log(`[API /api/free-4k-upscale] Success! 4K Master video ready at ${relativeResultUrl}`);
      console.log(`==================================================\n`);

      res.json({
        success: true,
        resultUrl: relativeResultUrl,
        originalUrl: relativeOriginalUrl,
        upscaleEngine: masterResult.engine,
        resolution: masterResult.resolution,
        instructions: {
          upscaleTarget: '4K',
          fps60: true,
          sharpening: true,
          denoise: true,
          highGraphicsColor: true,
          crf: 12,
          explanation: 'Local 4K AI Super-Resolution Engine + High-Bitrate Lanczos 4K Assembly.',
        },
      });
    } catch (error: any) {
      console.error('[API /api/free-4k-upscale] Error during 4K upscale:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'An unexpected error occurred during 4K upscale.',
      });
    }
  }
);

// Dedicated Dual-Pass 10x AI Clarity Master Upscale API Endpoint
app.post(
  '/api/upscale-10x',
  upload.fields([
    { name: 'user_video', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const videoFile = files?.['user_video']?.[0] || files?.['video']?.[0];

      if (!videoFile) {
        res.status(400).json({ success: false, error: 'Video file (user_video) is required for 10x AI upscale.' });
        return;
      }

      console.log(`\n==================================================`);
      console.log(`[API /api/upscale-10x] Starting Dual-Pass AI 10x Clarity Master Conversion...`);
      console.log(`[API /api/upscale-10x] Input File: ${videoFile.filename}`);

      const outputFilename = `ultra10x-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.mp4`;
      const outputPath = path.join(OUTPUTS_DIR, outputFilename);

      const ultraResult = await processUltra10XUpscale({
        inputPath: videoFile.path,
        outputPath: outputPath,
        targetResolution: '3840x2160',
        fps: 60,
      });

      const relativeResultUrl = `/outputs/${outputFilename}`;
      const relativeOriginalUrl = `/uploads/${videoFile.filename}`;

      console.log(`[API /api/upscale-10x] Success! Dual-Pass 10x 4K Master ready at ${relativeResultUrl}`);
      console.log(`==================================================\n`);

      res.json({
        success: true,
        resultUrl: relativeResultUrl,
        originalUrl: relativeOriginalUrl,
        upscaleEngine: ultraResult.engine,
        resolution: ultraResult.resolution,
        instructions: {
          upscaleTarget: '4K',
          fps60: true,
          sharpening: true,
          denoise: true,
          highGraphicsColor: true,
          crf: 10,
          explanation: 'Local Dual-Pass High-Precision 10x AI Super-Resolution (Spatial Edge & Unsharp Reconstruction + CRF 10 Lossless Master Pass).',
        },
      });
    } catch (error: any) {
      console.error('[API /api/upscale-10x] Error during 10x AI upscale:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'An unexpected error occurred during 10x AI upscale.',
      });
    }
  }
);

// Global JSON error handler middleware to prevent HTML error responses
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Express Error Handler]:', err.message || err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An unexpected server error occurred.',
  });
});

// Fallback route for SPA serving index.html if dist exists
app.get('*', (_req, res) => {
  const indexPath = path.join(rootDir, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('AI Video Editor API Server is running. Frontend dev server runs at http://localhost:5173');
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`\n🚀 AI Video Editor Backend running at http://localhost:${PORT}`);
  console.log(`📁 Uploads served from: /uploads`);
  console.log(`📁 Outputs served from: /outputs`);
  console.log(`🔑 Gemini Key Configured: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No (Using Fallback)'}\n`);
});
