import { createClient } from "jsr:@supabase/supabase-js@2";
import { GoogleGenAI } from "npm:@google/genai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VALID_ACTIONS = ["generate", "edit"] as const;
const VALID_ASPECT_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];
const MAX_PROMPT_LENGTH = 10000;
const MAX_EDIT_PROMPT_LENGTH = 5000;
const MAX_IMAGE_BASE64_LENGTH = 10_000_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atomic credit check & deduction (replaces inline credit/daily-limit checks)
    const { data: creditResult, error: creditError } = await supabase.rpc('deduct_credit', {
      p_amount: 1,
      p_reason: 'Image generation',
    });

    if (creditError || !creditResult?.success) {
      const errorMsg = creditResult?.error || 'Credit check failed';
      const status = errorMsg.includes('Insufficient') ? 402 : errorMsg.includes('Daily limit') ? 429 : errorMsg.includes('not active') ? 403 : 500;
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate input
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, prompt, aspectRatio, imageBase64, editPrompt } = body;

    // Validate action
    if (!action || typeof action !== "string" || !VALID_ACTIONS.includes(action as any)) {
      return new Response(
        JSON.stringify({ error: "action must be 'generate' or 'edit'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate aspect ratio
    const safeAspectRatio = (typeof aspectRatio === "string" && VALID_ASPECT_RATIOS.includes(aspectRatio))
      ? aspectRatio
      : "1:1";

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    console.log(`Processing ${action} request for user ${user.id}, aspect ratio: ${safeAspectRatio}`);

    if (action === "generate") {
      if (!prompt || typeof prompt !== "string") {
        return new Response(
          JSON.stringify({ error: "prompt is required and must be a string" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (prompt.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "prompt cannot be empty" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (prompt.length > MAX_PROMPT_LENGTH) {
        return new Response(
          JSON.stringify({ error: `prompt must be under ${MAX_PROMPT_LENGTH} characters` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp-image-generation",
        contents: prompt,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio: safeAspectRatio },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts) {
        return new Response(
          JSON.stringify({ error: "No response from image generation model." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const imagePart = parts.find((p: any) => p.inlineData);
      const textPart = parts.find((p: any) => p.text);

      if (!imagePart?.inlineData) {
        return new Response(
          JSON.stringify({ error: "No image was generated. Try rephrasing your prompt." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      return new Response(
        JSON.stringify({ imageUrl, text: textPart?.text || "" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "edit") {
      if (!editPrompt || typeof editPrompt !== "string") {
        return new Response(
          JSON.stringify({ error: "editPrompt is required for edit action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (editPrompt.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "editPrompt cannot be empty" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (editPrompt.length > MAX_EDIT_PROMPT_LENGTH) {
        return new Response(
          JSON.stringify({ error: `editPrompt must be under ${MAX_EDIT_PROMPT_LENGTH} characters` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!imageBase64 || typeof imageBase64 !== "string") {
        return new Response(
          JSON.stringify({ error: "imageBase64 is required for edit action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
        return new Response(
          JSON.stringify({ error: "Image is too large (max ~7.5MB)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const mimeType = imageBase64.startsWith("data:")
        ? imageBase64.split(";")[0].split(":")[1]
        : "image/png";
      const base64Data = imageBase64.includes(",")
        ? imageBase64.split(",")[1]
        : imageBase64;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp-image-generation",
        contents: [
          {
            role: "user",
            parts: [
              { text: `MAGIC EDIT: ${editPrompt}. Hyper-realistic execution.` },
              { inlineData: { data: base64Data, mimeType } },
            ],
          },
        ],
        config: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio: safeAspectRatio },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      const imagePart = parts?.find((p: any) => p.inlineData);

      if (!imagePart?.inlineData) {
        return new Response(
          JSON.stringify({ error: "Edit failed. No image returned." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      return new Response(
        JSON.stringify({ imageUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-image error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Image generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
