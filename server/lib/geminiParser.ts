import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

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
  colorGrade?: string;    // Custom raw FFmpeg eq string e.g. "contrast=1.3:saturation=1.4,eq=gamma=0.9"
  flashCut?: FlashCut;
  rgbShake?: boolean;

  explanation?: string;
}

const SYSTEM_PROMPT = `
You are an elite Gaming Video Systems Engineer & AI Montage Specialist.
Your task is to analyze natural language editing prompts (specifically high-energy gaming clips like PUBG Mobile lobby/emotes) and convert them into structured FFmpeg JSON parameters.

You MUST parse user requests into structured JSON matching this EXACT schema:
{
  "trimStart": number or null (seconds to skip from start),
  "trimEnd": number or null (absolute timestamp to end clip),
  "duration": number or null (duration in seconds),
  "speed": number or null (overall speed multiplier, e.g., 1.5 for 1.5x fast-forward),
  "speedRamp": [
    { "start": 0, "end": 1.5, "speed": 0.5 },
    { "start": 1.5, "end": 3.0, "speed": 2.0 }
  ] or null,
  "zoomPulse": {
    "time": 1.2,
    "zoomFactor": 1.3,
    "duration": 0.4
  } or null,
  "flashCut": {
    "time": 1.2
  } or null,
  "rgbShake": boolean or null,
  "colorPreset": string or null ("pubg_dark_fantasy", "cyberpunk", "vintage", "matrix", "dramatic", "vivid"),
  "colorGrade": string or null (e.g. "contrast=1.3:saturation=1.4,eq=gamma=0.9"),
  "aspectRatio": string or null ("9:16", "1:1", "16:9"),
  "mute": boolean (true if audio should be silenced),
  "volume": number or null (audio multiplier),
  "vignette": boolean (true for dark border vignette),
  "explanation": string (A crisp 1-2 sentence description of the gaming montage edits)
}

Rules:
1. Return ONLY pure valid JSON. Never output markdown code block wrappers if possible.
2. If the user mentions PUBG, lobby, emote, dance move, or gaming montage:
   - Infer "pubg_dark_fantasy" color grade (or colorGrade: "contrast=1.3:saturation=1.5,eq=gamma=0.85").
   - Add zoomPulse / beat sync zoom on key action timestamps (e.g. at 1.0s to 1.5s).
   - Set flashCut or speedRamp velocity where requested.
3. Keep numerical values realistic and safe for FFmpeg rendering.
`;

/**
 * Fallback parser using regex heuristics if GEMINI_API_KEY is missing or fails.
 */
function fallbackRuleBasedParser(prompt: string): VideoEditInstructions {
  const lower = prompt.toLowerCase();
  const result: VideoEditInstructions = {
    explanation: `Parsed gaming edit prompt via rule-based AI engine: "${prompt}"`,
  };

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
