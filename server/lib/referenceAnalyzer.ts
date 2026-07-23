import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import dotenv from 'dotenv';
import type { VideoEditInstructions } from './geminiParser.js';

dotenv.config();

export interface ExtractedReferenceStyle extends VideoEditInstructions {
  referenceCloned: boolean;
  detectedMotionPacing?: 'fast' | 'slow' | 'rhythmic' | 'extreme';
  detectedColorPalette?: string;
}

const REFERENCE_ANALYSIS_SYSTEM_PROMPT = `
You are an expert Computer Vision & Multimodal Video Systems Specialist.
Your task is to analyze a Reference Video clip (and optional user instructions) to extract its complete visual editing style, pacing, transitions, color grading, and dynamic effects.

Output ONLY valid JSON matching this schema:
{
  "referenceCloned": true,
  "detectedMotionPacing": "fast" | "slow" | "rhythmic" | "extreme",
  "detectedColorPalette": "pubg_dark_fantasy" | "cyberpunk" | "vintage" | "vivid" | "dramatic",
  "zoomPulse": {
    "time": number (timestamp in seconds where peak zoom pulse occurs, e.g. 1.0),
    "zoomFactor": number (e.g. 1.35),
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
  "colorGrade": string or null (e.g. "contrast=1.3:saturation=1.5,eq=gamma=0.85"),
  "aspectRatio": "9:16" | "1:1" | "16:9" or null,
  "vignette": boolean,
  "explanation": string (A crisp 2-sentence breakdown of all reference style elements cloned)
}

Rules:
1. Return ONLY pure valid JSON. No markdown backticks.
2. Analyze the pace, camera zooms, velocity ramping, color palette, and flash effects of the reference video.
3. Be precise with numeric parameters for smooth FFmpeg filter graph generation.
`;

/**
 * Converts a local file to inline data format required by Google GenAI SDK.
 */
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
    vignette: true,
    aspectRatio: '9:16',
    explanation: 'Cloned reference video style: Extracted PUBG Mobile beat-sync zoom, dark fantasy color grade, velocity speed ramp, and vignette.',
  };

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    console.warn('[ReferenceAnalyzer] No GEMINI_API_KEY configured. Returning fallback reference style.');
    return { style: fallbackStyle, source: 'fallback' };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Prepare multimodal input prompt
    const contents: any[] = [];

    // Attach reference video file if exists and under size limit
    if (fs.existsSync(referenceVideoPath)) {
      const stats = fs.statSync(referenceVideoPath);
      // Attach video if file size is <= 25MB for fast multimodal analysis
      if (stats.size <= 25 * 1024 * 1024) {
        try {
          const videoPart = fileToGenerativePart(referenceVideoPath, 'video/mp4');
          contents.push(videoPart);
        } catch (e) {
          console.warn('[ReferenceAnalyzer] Could not read reference video file for inline base64 upload, proceeding with prompt analysis.');
        }
      }
    }

    const textPrompt = `Analyze this reference video clip and clone its editing style.${
      userPrompt ? ` Additional user guidance: "${userPrompt}"` : ''
    }`;
    contents.push(textPrompt);

    console.log(`[ReferenceAnalyzer] Sending reference video analysis request to Gemini 2.0 Flash...`);

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: contents,
      config: {
        systemInstruction: REFERENCE_ANALYSIS_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.15,
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
