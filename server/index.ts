import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { parseVideoEditPrompt } from './lib/geminiParser.js';
import { processVideoWithFFmpeg } from './lib/ffmpegRunner.js';

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
