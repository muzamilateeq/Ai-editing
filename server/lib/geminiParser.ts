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
  zoomFactor: number;
  duration: number;
}

export interface FlashCut {
  time: number;
}

export interface HighGraphics4KConfig {
  upscaleTarget: '4K' | '2K' | '1080p';
  fps60?: boolean;
  sharpening?: boolean;
  denoise?: boolean;
  highGraphicsColor?: boolean;
  crf?: number;
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

  // Gaming & Montage Specs
  aspectRatio?: '9:16' | '1:1' | '16:9';
  colorPreset?: 'pubg_dark_fantasy' | 'cyberpunk' | 'vintage' | 'warm_sunset' | 'matrix' | 'dramatic' | 'sepia' | 'vivid';
  contrast?: number;      
  brightness?: number;    
  saturation?: number;    
  vignette?: boolean;
  audioFadeIn?: number;   
  audioFadeOut?: number;  
  videoFadeIn?: number;   
  videoFadeOut?: number;  

  speedRamp?: SpeedRampSegment[];
  zoomPulse?: ZoomPulse;
  colorGrade?: string;    
  flashCut?: FlashCut;
  rgbShake?: boolean;

  // 4K High Graphics & Resolution Config
  upscale?: UpscaleOption;
  highGraphics4K?: HighGraphics4KConfig;
  upscaleTarget?: '4K' | '2K' | '1080p';
  fps60?: boolean;
  sharpening?: boolean;
  denoise?: boolean;
  highGraphicsColor?: boolean;
  crf?: number;

  explanation?: string;
}

const SYSTEM_PROMPT = `
You are a Senior Video Systems Architect & AI High-Graphics 4K Specialist.
Your task is to analyze natural language video prompts and convert them into structured FFmpeg JSON parameters for smooth, high-graphics 4K conversions.

Whenever the prompt mentions keywords like "4k", "convert to 4k", "high graphics", "ultra hd", "smooth 4k", "crisp quality", or "sharpen video", YOU MUST INCLUDE THIS ULTRA HIGH-GRAPHICS CONFIGURATION IN THE JSON OUTPUT:
{
  "upscaleTarget": "4K",
  "fps60": true,
  "sharpening": true,
  "denoise": true,
  "highGraphicsColor": true,
  "crf": 14,
  "upscale": {
    "target": "4K",
    "mode": "pro_master",
    "sharpening": 0.6,
    "denoise": true
  }
}

Output ONLY valid JSON matching this schema:
{
  "trimStart": number or null,
  "trimEnd": number or null,
  "duration": number or null,
  "speed": number or null,
  "upscaleTarget": "4K" | "2K" | "1080p" or null,
  "fps60": boolean or null,
  "sharpening": boolean or null,
  "denoise": boolean or null,
  "highGraphicsColor": boolean or null,
  "crf": number or null,
  "speedRamp": [
    { "start": 0, "end": 1.5, "speed": 0.5 },
    { "start": 1.5, "end": 3.0, "speed": 2.0 }
  ] or null,
  "zoomPulse": { "time": 1.2, "zoomFactor": 1.35, "duration": 0.4 } or null,
  "flashCut": { "time": 1.2 } or null,
  "rgbShake": boolean or null,
  "colorPreset": string or null ("pubg_dark_fantasy", "cyberpunk", "vintage", "matrix", "dramatic", "vivid"),
  "colorGrade": string or null,
  "aspectRatio": string or null ("9:16", "1:1", "16:9"),
  "mute": boolean,
  "volume": number or null,
  "vignette": boolean,
  "explanation": string
}

Rules:
1. Return ONLY pure valid JSON. No markdown syntax wrappers.
2. If keywords like "4k", "high graphics", "smooth 4k", "ultra hd", or "crisp" are present, automatically set upscaleTarget: "4K", fps60: true, sharpening: true, denoise: true, highGraphicsColor: true, crf: 14.
`;

function fallbackRuleBasedParser(prompt: string): VideoEditInstructions {
  const lower = prompt.toLowerCase();
  const result: VideoEditInstructions = {
    explanation: `Parsed prompt via rule-based High-Graphics 4K AI engine: "${prompt}"`,
  };

  // High Graphics 4K Detection
  if (lower.includes('4k') || lower.includes('convert to 4k') || lower.includes('high graphics') || lower.includes('ultra hd') || lower.includes('smooth 4k') || lower.includes('crisp')) {
    result.upscaleTarget = '4K';
    result.fps60 = true;
    result.sharpening = true;
    result.denoise = true;
    result.highGraphicsColor = true;
    result.crf = 14;
    result.upscale = { target: '4K', mode: 'pro_master', sharpening: 0.6, denoise: true };
  } else if (lower.includes('2k')) {
    result.upscaleTarget = '2K';
    result.fps60 = true;
    result.sharpening = true;
    result.crf = 16;
    result.upscale = { target: '2K', mode: 'pro_master', sharpening: 0.5, denoise: true };
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
  }

  // PUBG & Gaming Color Grading
  if (lower.includes('pubg') || lower.includes('lobby') || lower.includes('emote') || lower.includes('dark fantasy')) {
    result.colorPreset = 'pubg_dark_fantasy';
    result.colorGrade = 'contrast=1.35:saturation=1.45,eq=gamma=0.9';
    result.vignette = true;
  }

  // Beat Sync Zoom
  if (lower.includes('zoom') || lower.includes('beat sync')) {
    result.zoomPulse = { time: 1.2, zoomFactor: 1.35, duration: 0.4 };
  }

  // Flash Cuts & RGB Shake
  if (lower.includes('flash')) {
    result.flashCut = { time: 1.2 };
  }
  if (lower.includes('shake')) {
    result.rgbShake = true;
  }

  // Aspect ratio
  if (lower.includes('9:16') || lower.includes('tiktok') || lower.includes('reel')) {
    result.aspectRatio = '9:16';
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
        temperature: 0.1,
      },
    });

    const responseText = response.text || '';
    let parsed: VideoEditInstructions;

    try {
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);

      // Ensure High Graphics 4K config is auto-attached if upscaleTarget is 4K
      if (parsed.upscaleTarget === '4K' || prompt.toLowerCase().includes('4k')) {
        parsed.upscaleTarget = '4K';
        parsed.fps60 = true;
        parsed.sharpening = true;
        parsed.denoise = true;
        parsed.highGraphicsColor = true;
        parsed.crf = 14;
        parsed.upscale = { target: '4K', mode: 'pro_master', sharpening: 0.6, denoise: true };
      }
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
