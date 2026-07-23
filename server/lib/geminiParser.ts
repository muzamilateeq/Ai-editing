import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

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
  
  // Advanced AI Features
  aspectRatio?: '9:16' | '1:1' | '16:9';
  colorPreset?: 'cyberpunk' | 'vintage' | 'warm_sunset' | 'matrix' | 'dramatic' | 'sepia' | 'vivid';
  contrast?: number;      // 0.5 to 2.0
  brightness?: number;    // -0.5 to 0.5
  saturation?: number;    // 0.0 to 3.0
  vignette?: boolean;
  audioFadeIn?: number;   // seconds
  audioFadeOut?: number;  // seconds
  videoFadeIn?: number;   // seconds
  videoFadeOut?: number;  // seconds

  explanation?: string;
}

const SYSTEM_PROMPT = `
You are an advanced Next-Gen AI Video Editing Assistant powered by Gemini 2.5 Flash.
Your job is to analyze any natural language request (simple or complex creative prompt) and extract comprehensive FFmpeg processing parameters.

Output ONLY valid JSON adhering strictly to this schema:
{
  "trimStart": number or null (seconds to skip from beginning),
  "trimEnd": number or null (absolute timestamp in seconds to end clip),
  "duration": number or null (total duration of edited clip in seconds),
  "speed": number or null (playback speed multiplier: e.g. 0.5 for slow motion, 1.5, 2.0, 3.0),
  "mute": boolean (true if audio should be stripped),
  "volume": number or null (audio volume multiplier, e.g. 0.5 for half, 2.0 for double boost),
  "grayscale": boolean (true for black and white / monochrome),
  "flipHorizontal": boolean (true for horizontal mirror),
  "flipVertical": boolean (true for upside down flip),
  "rotate": number (90, 180, or 270 degrees clockwise rotation if requested, else null),
  "aspectRatio": string or null ("9:16" for TikTok/Reels vertical, "1:1" for Instagram square, "16:9" for widescreen),
  "colorPreset": string or null ("cyberpunk", "vintage", "warm_sunset", "matrix", "dramatic", "sepia", "vivid"),
  "contrast": number or null (contrast adjustment, e.g. 1.2 to 1.5 for high contrast),
  "brightness": number or null (brightness shift, e.g. 0.1 for brighter, -0.1 for darker),
  "saturation": number or null (color saturation shift, e.g. 1.5 for vibrant colors, 0.0 for grayscale),
  "vignette": boolean (true if cinematic dark border vignette effect requested),
  "audioFadeIn": number or null (audio fade-in duration in seconds, e.g. 1.0),
  "audioFadeOut": number or null (audio fade-out duration in seconds, e.g. 1.5),
  "videoFadeIn": number or null (video fade-in duration in seconds),
  "videoFadeOut": number or null (video fade-out duration in seconds),
  "explanation": string (A crisp 1-2 sentence professional creative summary of all applied edits)
}

Rules:
1. Return ONLY pure valid JSON. No markdown backticks.
2. Infer creative presets if the user specifies moods (e.g. "make it like a 80s movie" -> vintage + vignette, "make it a TikTok reel" -> aspect 9:16 + speed 1.25x).
3. Keep parameter ranges realistic and harmonized for high video quality.
`;

/**
 * Fallback parser using regex heuristics if GEMINI_API_KEY is missing or fails.
 */
function fallbackRuleBasedParser(prompt: string): VideoEditInstructions {
  const lower = prompt.toLowerCase();
  const result: VideoEditInstructions = {
    explanation: `Parsed prompt via rule-based AI engine: "${prompt}"`,
  };

  // Trimming
  const trimStartMatch = lower.match(/(?:trim|cut|crop|skip|remove)\s+(?:the\s+)?first\s+(\d+(?:\.\d+)?)\s*(?:sec|seconds|s)?/);
  if (trimStartMatch) {
    result.trimStart = parseFloat(trimStartMatch[1]);
  }

  // Duration
  const durMatch = lower.match(/(?:duration|keep|make\s+it)\s+(\d+(?:\.\d+)?)\s*(?:sec|seconds|s)/);
  if (durMatch) {
    result.duration = parseFloat(durMatch[1]);
  }

  // Speed
  const speedMatch = lower.match(/(?:speed\s*up|fast\s*forward|speed)\s*(?:by\s*)?(\d+(?:\.\d+)?)\s*x?/);
  if (speedMatch) {
    result.speed = parseFloat(speedMatch[1]);
  } else if (lower.includes('slow motion') || lower.includes('slow mo')) {
    result.speed = 0.5;
  } else if (lower.includes('double speed')) {
    result.speed = 2.0;
  }

  // Mute / Volume
  if (lower.includes('mute') || lower.includes('no audio') || lower.includes('silent') || lower.includes('remove audio')) {
    result.mute = true;
  } else {
    const volMatch = lower.match(/(?:volume|sound)\s*(?:to\s*)?(\d+(?:\.\d+)?)\s*x?/);
    if (volMatch) {
      result.volume = parseFloat(volMatch[1]);
    }
  }

  // Aspect Ratio
  if (lower.includes('tiktok') || lower.includes('reel') || lower.includes('shorts') || lower.includes('9:16') || lower.includes('vertical')) {
    result.aspectRatio = '9:16';
  } else if (lower.includes('square') || lower.includes('1:1') || lower.includes('instagram post')) {
    result.aspectRatio = '1:1';
  } else if (lower.includes('widescreen') || lower.includes('16:9') || lower.includes('cinematic aspect')) {
    result.aspectRatio = '16:9';
  }

  // Presets & Color Grading
  if (lower.includes('cyberpunk') || lower.includes('neon')) {
    result.colorPreset = 'cyberpunk';
    result.contrast = 1.3;
    result.saturation = 1.5;
  } else if (lower.includes('vintage') || lower.includes('retro') || lower.includes('80s')) {
    result.colorPreset = 'vintage';
    result.vignette = true;
  } else if (lower.includes('matrix') || lower.includes('hacker')) {
    result.colorPreset = 'matrix';
  } else if (lower.includes('sunset') || lower.includes('warm')) {
    result.colorPreset = 'warm_sunset';
  } else if (lower.includes('grayscale') || lower.includes('black and white') || lower.includes('b&w')) {
    result.grayscale = true;
  } else if (lower.includes('vivid') || lower.includes('vibrant')) {
    result.saturation = 1.6;
    result.contrast = 1.2;
  }

  // Audio / Video Fades
  if (lower.includes('fade out') || lower.includes('fade audio')) {
    result.audioFadeOut = 1.5;
    result.videoFadeOut = 1.0;
  }

  // Flips & Rotations
  if (lower.includes('flip horizontal') || lower.includes('mirror')) {
    result.flipHorizontal = true;
  }
  if (lower.includes('flip vertical')) {
    result.flipVertical = true;
  }
  if (lower.includes('rotate 90')) {
    result.rotate = 90;
  } else if (lower.includes('rotate 180')) {
    result.rotate = 180;
  } else if (lower.includes('rotate 270')) {
    result.rotate = 270;
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
