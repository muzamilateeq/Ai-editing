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
  explanation?: string;
}

const SYSTEM_PROMPT = `
You are an expert FFmpeg parameter extraction assistant.
Your task is to convert natural language video editing prompts into structured JSON parameters for FFmpeg video processing.

Analyze the user's prompt and output ONLY valid JSON matching this schema:
{
  "trimStart": number or null (seconds to skip from beginning, e.g. 3 for "cut first 3 seconds"),
  "trimEnd": number or null (absolute timestamp in seconds to stop, e.g. 15),
  "duration": number or null (duration in seconds to keep, e.g. 10 for "make it 10s long"),
  "speed": number or null (speed multiplier, e.g. 1.5 for 1.5x speed, 0.5 for half speed / slow motion, 2.0 for 2x fast forward),
  "mute": boolean (true if user requests mute/remove audio/silent),
  "volume": number or null (audio volume multiplier, e.g. 0.5 for half volume, 2.0 for double volume),
  "grayscale": boolean (true if user asks for black and white / grayscale filter),
  "flipHorizontal": boolean (true for horizontal mirror/flip),
  "flipVertical": boolean (true for vertical flip),
  "rotate": number (90, 180, or 270 degrees clockwise rotation if requested, else null),
  "explanation": string (A brief 1-sentence concise description of what edits will be performed)
}

Rules:
1. Return ONLY pure JSON. Do not wrap in markdown quotes if possible, or use JSON mime mode.
2. Only set parameters explicitly requested or strongly implied by the prompt.
3. Be reasonable with numeric values (e.g. speed should usually be between 0.25 and 4.0).
`;

/**
 * Fallback parser using regex heuristics if GEMINI_API_KEY is missing or fails.
 */
function fallbackRuleBasedParser(prompt: string): VideoEditInstructions {
  const lower = prompt.toLowerCase();
  const result: VideoEditInstructions = {
    explanation: `Parsed prompt via rule-based engine: "${prompt}"`,
  };

  // Trim start
  const trimStartMatch = lower.match(/(?:trim|cut|crop|skip|remove)\s+(?:the\s+)?first\s+(\d+(?:\.\d+)?)\s*(?:sec|seconds|s)?/);
  if (trimStartMatch) {
    result.trimStart = parseFloat(trimStartMatch[1]);
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

  // Grayscale
  if (lower.includes('grayscale') || lower.includes('black and white') || lower.includes('b&w') || lower.includes('monochrome')) {
    result.grayscale = true;
  }

  // Flip / Rotate
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
    
    // Call Gemini 2.5 Flash model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
      // Clean potential JSON markdown code block formatting
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
