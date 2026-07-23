import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import type { UpscaleOption } from './qualityEnhancer.js';

dotenv.config();

export interface SpeedRampSegment {
  start: number;
  end: number;
  speed: number;
}

export interface ZoomPulse {
  time: number;
  zoomFactor: number; // e.g. 1.2 to 1.5
  duration: number;   // e.g. 0.3 to 0.6 seconds
}

export interface FlashCut {
  time: number;
}

export interface VideoEditInstructions {
  trimStart?: number;
  trimEnd?: number;
  duration?: number;
  speed?: number;
  mute?: boolean;
  volume?: number;
  grayscale?: boolean;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  rotate?: 90 | 180 | 270;

  // Advanced PUBG & Gaming Edit Specs
  aspectRatio?: '9:16' | '1:1' | '16:9';
  colorPreset?: 'pubg_dark_fantasy' | 'cyberpunk' | 'vintage' | 'warm_sunset' | 'matrix' | 'dramatic' | 'sepia' | 'vivid';
  contrast?: number;      // 0.5 to 2.0
  brightness?: number;    // -0.5 to 0.5
  saturation?: number;    // 0.0 to 3.0
  vignette?: boolean;
  audioFadeIn?: number;   
  audioFadeOut?: number;  
  videoFadeIn?: number;   
  videoFadeOut?: number;  

  // Gaming Specific FX
  speedRamp?: SpeedRampSegment[];
  zoomPulse?: ZoomPulse;
  colorGrade?: string;    
  flashCut?: FlashCut;
  rgbShake?: boolean;

  // Resolution & Quality Upscaling
  upscale?: UpscaleOption;

  explanation?: string;
}

const SYSTEM_PROMPT = `
You are an elite Gaming Video Systems Engineer & AI Quality Enhancement Specialist.
Your task is to analyze natural language editing prompts and extract structured FFmpeg JSON parameters.

Output ONLY valid JSON matching this schema:
{
  "trimStart": number or null,
  "trimEnd": number or null,
  "duration": number or null,
  "speed": number or null,
  "speedRamp": [
    { "start": 0, "end": 1.5, "speed": 0.5 },
    { "start": 1.5, "end": 3.0, "speed": 2.0 }
  ] or null,
  "zoomPulse": { "time": 1.2, "zoomFactor": 1.3, "duration": 0.4 } or null,
  "flashCut": { "time": 1.2 } or null,
  "rgbShake": boolean or null,
  "colorPreset": string or null ("pubg_dark_fantasy", "cyberpunk", "vintage", "matrix", "dramatic", "vivid"),
  "colorGrade": string or null,
  "aspectRatio": string or null ("9:16", "1:1", "16:9"),
  "mute": boolean,
  "volume": number or null,
  "vignette": boolean,
  "upscale": {
    "target": "1080p" | "2K" | "4K",
    "mode": "fast_lanczos" | "ai_esrgan",
    "sharpening": number (e.g. 0.5),
    "denoise": boolean
  } or null,
  "explanation": string
}

Rules:
1. Return ONLY pure valid JSON. No markdown wrappers.
2. If prompt mentions 4K, 4k quality, crisp 4k, 2K, 2k qhd, HD, 1080p, sharpen, or enhance quality:
   - Set "upscale": { "target": "4K" | "2K" | "1080p", "mode": "fast_lanczos", "sharpening": 0.5, "denoise": true }.
3. If prompt mentions PUBG or gaming, infer "pubg_dark_fantasy" color grade and beat sync zoom.
`;

function fallbackRuleBasedParser(prompt: string): VideoEditInstructions {
  const lower = prompt.toLowerCase();
  const result: VideoEditInstructions = {
    explanation: `Parsed prompt via rule-based AI engine: "${prompt}"`,
  };

  // Resolution Upscaling
  if (lower.includes('4k') || lower.includes('4k ultra hd') || lower.includes('3840')) {
    result.upscale = { target: '4K', mode: 'fast_lanczos', sharpening: 0.6, denoise: true };
  } else if (lower.includes('2k') || lower.includes('2k qhd') || lower.includes('1440')) {
    result.upscale = { target: '2K', mode: 'fast_lanczos', sharpening: 0.5, denoise: true };
  } else if (lower.includes('1080p') || lower.includes('hd') || lower.includes('sharpen')) {
    result.upscale = { target: '1080p', mode: 'fast_lanczos', sharpening: 0.4, denoise: true };
  }

  // Trimming
  const trimStartMatch = lower.match(/(?:trim|cut|crop|skip|remove)\s+(?:the\s+)?first\s+(\d+(?:\.\d+)?)\s*(?:sec|seconds|s)?/);
  if (trimStartMatch) {
    result.trimStart = parseFloat(trimStartMatch[1]);
  }

  // Speed & Ramping
  const speedMatch = lower.match(/(?:speed\s*up|fast\s*forward|speed)\s*(?:by\s*)?(\d+(?:\.\d+)?)\s*x?/);
  if (speedMatch) {
    result.speed = parseFloat(speedMatch[1]);
  } else if (lower.includes('speed ramp') || lower.includes('velocity')) {
    result.speedRamp = [
      { start: 0, end: 1.5, speed: 0.5 },
      { start: 1.5, end: 3.0, speed: 2.0 },
    ];
  } else if (lower.includes('slow motion') || lower.includes('slow mo')) {
    result.speed = 0.5;
  }

  // PUBG & Gaming Color Grading
  if (lower.includes('pubg') || lower.includes('lobby') || lower.includes('emote') || lower.includes('dark fantasy')) {
    result.colorPreset = 'pubg_dark_fantasy';
    result.colorGrade = 'contrast=1.3:saturation=1.4,eq=gamma=0.9';
    result.vignette = true;
  } else if (lower.includes('cyberpunk')) {
    result.colorPreset = 'cyberpunk';
  }

  // Beat Sync Zoom
  if (lower.includes('zoom') || lower.includes('beat sync') || lower.includes('dance move')) {
    result.zoomPulse = { time: 1.2, zoomFactor: 1.3, duration: 0.4 };
  }

  // Flash Cuts & RGB Shake
  if (lower.includes('flash cut') || lower.includes('flash')) {
    result.flashCut = { time: 1.2 };
  }
  if (lower.includes('shake') || lower.includes('rgb shake')) {
    result.rgbShake = true;
  }

  // Aspect ratio
  if (lower.includes('9:16') || lower.includes('tiktok') || lower.includes('reel') || lower.includes('shorts')) {
    result.aspectRatio = '9:16';
  }

  // Mute / Volume
  if (lower.includes('mute') || lower.includes('no audio') || lower.includes('silent')) {
    result.mute = true;
  }

  return result;
}

export async function parseVideoEditPrompt(prompt: string): Promise<{ instructions: VideoEditInstructions; rawResponse?: string; source: 'gemini' | 'fallback' }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    console.warn('[GeminiParser] No GEMINI_API_KEY set in .env. Utilizing rule-based fallback parser.');
    return {
      instructions: fallbackRuleBasedParser(prompt),
      source: 'fallback',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Call Gemini 2.0 Flash model
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.15,
      },
    });

    const responseText = response.text || '';
    let parsed: VideoEditInstructions;

    try {
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (e) {
      console.error('[GeminiParser] Failed to parse JSON response from Gemini:', responseText);
      parsed = fallbackRuleBasedParser(prompt);
      return { instructions: parsed, rawResponse: responseText, source: 'fallback' };
    }

    return {
      instructions: parsed,
      rawResponse: responseText,
      source: 'gemini',
    };
  } catch (error: any) {
    console.error('[GeminiParser] Error calling Gemini API:', error?.message || error);
    const fallback = fallbackRuleBasedParser(prompt);
    return {
      instructions: fallback,
      rawResponse: `Error calling Gemini API: ${error?.message || error}. Used fallback parser.`,
      source: 'fallback',
    };
  }
}
