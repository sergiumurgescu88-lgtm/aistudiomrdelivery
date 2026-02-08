import { GoogleGenAI, Type, Modality } from "@google/genai";
import { PhotoStyle, ImageSize, PhotoQuality, MenuAnalysisResult, AspectRatio } from "../types";
import { supabase } from "@/integrations/supabase/client";

let cachedApiKey: string | null = null;

const getApiKey = async (): Promise<string> => {
  if (cachedApiKey) return cachedApiKey;

  // Try VITE env var first (backwards compatibility)
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey) {
    cachedApiKey = envKey;
    return envKey;
  }

  // Fetch from edge function for authenticated users
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Authentication required to use AI features. Please sign in.");

  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/get-config`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to load API configuration");
  }

  const { geminiKey } = await response.json();
  if (!geminiKey) throw new Error("Gemini API key not configured on server");

  cachedApiKey = geminiKey;
  return geminiKey;
};

export const clearApiKeyCache = () => {
  cachedApiKey = null;
};

const getMimeType = (dataUrl: string) => {
  try {
    return dataUrl.split(';')[0].split(':')[1];
  } catch (e) {
    return "image/png";
  }
};

const getBase64Data = (dataUrl: string) => {
  return dataUrl.split(',')[1];
};

export const PREP_TEAM_PROMPT = `[PROTOCOL 3: PREP TEAM - HYPER-REALISTIC MINIATURE KITCHEN]
MANDATE: Add 3-5 hyper-realistic miniature humans (scale 1:12-1:20) actively preparing the dish.
ABSOLUTE REQUIREMENT: Characters MUST look like 100% REAL HUMANS with photorealistic skin and unique facial features. NO PLASTIC, NO CGI, and NO TOY-LIKE appearance.
CHARACTER DETAILS:
- 3-5 unique individuals with distinct ethnicities, facial hair, and ages (25-55).
- FACE REALISM: Visible pores, natural skin tone variations, subtle veins, laugh lines, and genuine human imperfections.
DYNAMIC ACTIONS & TOOLS:
- 1 Chef wiping hands on a linen apron mid-task.
- 1 Sous Chef whisking with visible wrist rotation in a scaled stainless steel bowl.
- 1 Prep Cook mid-chopping motion on a scaled wooden grain board.
- 1 Assistant sprinkling micro-spices with visible particles caught in the air.
INTEGRATION: Characters physically interact with ingredients.
ATMOSPHERE: Warm collaborative kitchen energy (3200-4500K).`;

export const DETECTION_SQUAD_PROMPT = `[PROTOCOL 4: DETECTION SQUAD - FORENSIC FOOD INVESTIGATION]
MANDATE: Add 3-5 hyper-realistic miniature detectives investigating the dish as a crime scene evidence.
ABSOLUTE REQUIREMENT: Characters MUST be real humans with unique faces and natural skin textures.
CHARACTER DETAILS:
- 1-2 Lead Detectives in trench coats, 2-3 Forensic Specialists in clinical lab gear.
DYNAMIC ACTIONS & FORENSIC TOOLS:
- Lead detective examining a garnish through a scaled magnifying glass.
- Specialist using precision metal tweezers to carefully lift a micro-ingredient.
- Assistant placing yellow numbered evidence tents around the dish ingredients.
ATMOSPHERE: Dramatic noir/investigative mood. Cool/neutral tones (4500-5500K).`;

export const generateDishImage = async (
  dishName: string,
  dishDescription: string,
  style: PhotoStyle,
  size: ImageSize,
  quality: PhotoQuality,
  aspectRatio: AspectRatio,
  logoBase64?: string | null,
  locationBase64?: string | null,
  referenceBase64?: string | null
): Promise<string> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const masterPrompt = `[MICHELIN PRODUCTION PROTOCOL] - ${dishName.toUpperCase()}
  MANDATE: Create a 100% photorealistic commercial asset.
  STYLE: ${style}
  CONTEXT: ${dishDescription}
  ${logoBase64 ? "INTEGRATE LOGO: Follow subtle branding protocol." : ""}
  ${locationBase64 ? "ENVIRONMENT: Use provided background context." : ""}
  COMPOSITION: Perfectly level horizon, 30% negative space, cinematic bokeh.`;

  const parts: any[] = [{ text: masterPrompt }];

  if (referenceBase64) {
    parts.unshift({ inlineData: { mimeType: getMimeType(referenceBase64), data: getBase64Data(referenceBase64) } });
    parts.push({ text: "REFERENCE LOCK: Match this plating architecture exactly." });
  }
  if (locationBase64) {
    parts.push({ inlineData: { mimeType: getMimeType(locationBase64), data: getBase64Data(locationBase64) } });
  }
  if (logoBase64) {
    parts.push({ inlineData: { mimeType: getMimeType(logoBase64), data: getBase64Data(logoBase64) } });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: { parts: parts },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
  if (!part) throw new Error("API failed to return image data.");
  return `data:${(part as any).inlineData.mimeType};base64,${(part as any).inlineData.data}`;
};

export const parseMenuText = async (text: string): Promise<MenuAnalysisResult> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Parse menu items into structural high-end data. Return JSON with a "dishes" array where each item has "name" and "description" fields: ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dishes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["name", "description"],
            },
          },
        },
      },
    },
  });
  return JSON.parse(response.text || '{"dishes":[]}');
};

export const editDishImage = async (currentImageBase64: string, editPrompt: string): Promise<string> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: {
      parts: [
        { inlineData: { data: getBase64Data(currentImageBase64), mimeType: getMimeType(currentImageBase64) } },
        { text: `MAGIC EDIT: ${editPrompt}. Hyper-realistic execution.` },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });
  const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
  if (!part) throw new Error("Edit failed.");
  return `data:${(part as any).inlineData.mimeType};base64,${(part as any).inlineData.data}`;
};

export const analyzeDishNutrition = async (imageBase64: string): Promise<string> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: {
      parts: [
        { inlineData: { data: getBase64Data(imageBase64), mimeType: getMimeType(imageBase64) } },
        { text: "Analyze this dish: list ingredients, estimated calories, and give Michelin-style feedback." }
      ]
    }
  });
  return response.text || "";
};

export async function* chatWithConcierge(message: string, history: any[], imageBase64?: string | null) {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const contents: any[] = history.map((h: any) => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));

  const userParts: any[] = [{ text: message }];
  if (imageBase64) {
    userParts.push({
      inlineData: {
        data: getBase64Data(imageBase64),
        mimeType: getMimeType(imageBase64)
      }
    });
  }

  const response = await ai.models.generateContentStream({
    model: 'gemini-2.0-flash',
    contents: [...contents, { role: 'user', parts: userParts }],
    config: {
      systemInstruction: `You are Maya, the expert AI Concierge for Instant Menu Pictures.
      Analyze any images provided with Michelin standards.
      Keep responses concise but intellectually deep.`
    },
  });

  for await (const chunk of response) if (chunk.text) yield chunk.text;
}

export const speakText = async (text: string): Promise<ArrayBuffer> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ parts: [{ text: `Please generate a spoken version of this text: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });
  const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64) throw new Error("TTS failed.");
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

export const connectLiveConcierge = async (callbacks: any) => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  return ai.live.connect({
    model: 'gemini-2.0-flash-live-001',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: "You are Maya, the Live AI Concierge. Respond naturally in real-time.",
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
    },
  });
};
