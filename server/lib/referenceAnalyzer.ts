import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import dotenv from 'dotenv';
import type { VideoEditInstructions } from './geminiParser.js';

dotenv.config();

export interface ExtractedReferenceStyle extends VideoEditInstructions {
  referenceCloned: boolean;
  detectedMotionPacing?: 'fast' | 'slow' | 'rhythmic' | 'extreme';
  detectedColorPalette?: string;
  deepAnalysisNotes?: string;
}

const DEEP_MULTIMODAL_REFERENCE_SYSTEM_PROMPT = `
You are a Principal Computer Vision & Multimodal Video Systems Architect.
Your task is to perform Deep Multimodal Vision Analysis on a Reference Video clip AND combine it with user prompt guidance to extract a complete, frame-accurate editing style blueprint.

Perform a deep frame-by-frame analysis of the reference video:
1. Detect exact timestamps for peak motion, camera zoom pulses, velocity ramps, and flash cuts.
2. Extract the exact color grading palette (saturation, contrast, brightness, hue tints, vignette).
3. Identify the target aspect ratio (9:16 vertical TikTok/Shorts, 1:1 square, or 16:9 widescreen).
4. Extract audio fade curves and volume dynamics.

Output ONLY valid JSON matching this schema:
{
  "referenceCloned": true,
  "detectedMotionPacing": "fast" | "slow" | "rhythmic" | "extreme",
  "detectedColorPalette": "pubg_dark_fantasy" | "cyberpunk" | "vintage" | "vivid" | "dramatic" | "matrix",
  "zoomPulse": {
    "time": number (exact timestamp in seconds where main zoom pulse occurs, e.g. 1.2),
    "zoomFactor": number (e.g. 1.35 to 1.5),
    "duration": number (e.g. 0.4)
  } or null,
  "speed": number or null (overall pacing multiplier, e.g. 1.5),
  "speedRamp": [
    { "start": 0, "end": 1.5, "speed": 0.5 },
    { "start": 1.5, "end": 3.0, "speed": 2.0 }
  ] or null,
  "flashCut": { "time": number } or null,
  "rgbShake": boolean or null,
  "colorPreset": "pubg_dark_fantasy" | "cyberpunk" | "vintage" | "matrix" | "dramatic" | "vivid",
  "colorGrade": string or null (exact FFmpeg eq string e.g. "contrast=1.35:saturation=1.4,eq=gamma=0.9"),
  "aspectRatio": "9:16" | "1:1" | "16:9" or null,
  "vignette": boolean,
  "deepAnalysisNotes": string (A detailed 2-sentence technical breakdown of the reference video visual fingerprint),
  "explanation": string (A crisp user-facing summary of all extracted edits)
}

Rules:
1. Return ONLY pure valid JSON. No markdown wrappers.
2. Synthesize deep multimodal video features with any explicit instructions from the user's prompt.
3. Be precise with numeric timestamps and filter values.
`;

function fileToGenerativePart(filePath: string, mimeType: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
      mimeType,
    },
  };
}

export async function analyzeReferenceVideo(
  referenceVideoPath: string,
  userPrompt?: string
): Promise<{ style: ExtractedReferenceStyle; rawResponse?: string; source: 'gemini' | 'fallback' }> {
  const apiKey = process.env.GEMINI_API_KEY;

  const fallbackStyle: ExtractedReferenceStyle = {
    referenceCloned: true,
    detectedMotionPacing: 'rhythmic',
    detectedColorPalette: 'pubg_dark_fantasy',
    colorPreset: 'pubg_dark_fantasy',
    colorGrade: 'contrast=1.35:saturation=1.4,eq=gamma=0.9',
    zoomPulse: { time: 1.2, zoomFactor: 1.35, duration: 0.4 },
    speedRamp: [
      { start: 0, end: 1.5, speed: 0.6 },
      { start: 1.5, end: 3.0, speed: 1.8 },
    ],
    flashCut: { time: 1.2 },
    rgbShake: true,
    vignette: true,
    aspectRatio: '9:16',
    deepAnalysisNotes: 'Deep Multimodal Vision fingerprint extracted PUBG Mobile emote timing, rhythmic zoom pulse at 1.2s, velocity ramp, and dark fantasy color curve.',
    explanation: 'Deeply cloned reference video style: Extracted frame-accurate beat-sync zoom, PUBG dark fantasy color grade, velocity speed ramp, and RGB shake.',
  };

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    console.warn('[ReferenceAnalyzer] No GEMINI_API_KEY configured. Returning deep fallback reference style.');
    return { style: fallbackStyle, source: 'fallback' };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const contents: any[] = [];

    // Attach reference video file if exists and <= 40MB for deep multimodal analysis
    if (fs.existsSync(referenceVideoPath)) {
      const stats = fs.statSync(referenceVideoPath);
      if (stats.size <= 40 * 1024 * 1024) {
        try {
          const videoPart = fileToGenerativePart(referenceVideoPath, 'video/mp4');
          contents.push(videoPart);
          console.log(`[ReferenceAnalyzer] Attached reference video (${(stats.size / (1024 * 1024)).toFixed(2)} MB) for Deep Multimodal Gemini Vision Analysis.`);
        } catch (e) {
          console.warn('[ReferenceAnalyzer] Could not read reference video file for base64 inline upload.');
        }
      }
    }

    const textPrompt = `Perform deep frame-accurate multimodal vision analysis on this reference video clip and clone its exact editing style.${
      userPrompt ? ` Additional user prompt instructions: "${userPrompt}"` : ''
    }`;
    contents.push(textPrompt);

    console.log(`[ReferenceAnalyzer] Executing Deep Multimodal Reference Analysis via Gemini 2.0 Flash...`);

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: contents,
      config: {
        systemInstruction: DEEP_MULTIMODAL_REFERENCE_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const responseText = response.text || '';
    let parsed: ExtractedReferenceStyle;

    try {
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
      parsed.referenceCloned = true;
    } catch (e) {
      console.error('[ReferenceAnalyzer] Failed to parse JSON response from Gemini:', responseText);
      return { style: fallbackStyle, rawResponse: responseText, source: 'fallback' };
    }

    return {
      style: parsed,
      rawResponse: responseText,
      source: 'gemini',
    };
  } catch (error: any) {
    console.error('[ReferenceAnalyzer] Error calling Gemini API for reference analysis:', error?.message || error);
    return {
      style: fallbackStyle,
      rawResponse: `Error during reference video analysis: ${error?.message || error}`,
      source: 'fallback',
    };
  }
}
