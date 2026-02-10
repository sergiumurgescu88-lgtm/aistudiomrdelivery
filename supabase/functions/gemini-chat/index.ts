import { createClient } from "jsr:@supabase/supabase-js@2";
import { GoogleGenAI } from "npm:@google/genai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_MESSAGE_LENGTH = 10000;
const MAX_HISTORY_LENGTH = 50;
const MAX_HISTORY_TEXT_LENGTH = 5000;
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

    // Atomic credit check & deduction
    const { data: creditResult, error: creditError } = await supabase.rpc('deduct_credit', {
      p_amount: 1,
      p_reason: 'Chat with AI Concierge',
    });

    if (creditError || !creditResult?.success) {
      const errorMsg = creditResult?.error || 'Credit check failed';
      const status = errorMsg.includes('Insufficient') ? 402 : errorMsg.includes('Daily limit') ? 429 : 403;
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { message, history, imageBase64 } = body;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "message is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: `message must be under ${MAX_MESSAGE_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (history !== undefined && history !== null) {
      if (!Array.isArray(history)) {
        return new Response(
          JSON.stringify({ error: "history must be an array" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (history.length > MAX_HISTORY_LENGTH) {
        return new Response(
          JSON.stringify({ error: `history must have at most ${MAX_HISTORY_LENGTH} entries` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (imageBase64 !== undefined && imageBase64 !== null) {
      if (typeof imageBase64 !== "string") {
        return new Response(
          JSON.stringify({ error: "imageBase64 must be a string" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
        return new Response(
          JSON.stringify({ error: "Image is too large (max ~7.5MB)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const safeHistory = (Array.isArray(history) ? history : [])
      .filter((h: any) => h && typeof h.role === "string" && typeof h.text === "string")
      .map((h: any) => ({
        role: h.role === "model" ? "model" : "user",
        parts: [{ text: String(h.text).slice(0, MAX_HISTORY_TEXT_LENGTH) }],
      }));

    const userParts: any[] = [{ text: message }];
    if (imageBase64 && typeof imageBase64 === "string") {
      const mimeType = imageBase64.startsWith("data:")
        ? imageBase64.split(";")[0].split(":")[1]
        : "image/png";
      const base64Data = imageBase64.includes(",")
        ? imageBase64.split(",")[1]
        : imageBase64;
      userParts.push({ inlineData: { data: base64Data, mimeType } });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [...safeHistory, { role: "user", parts: userParts }],
      config: {
        systemInstruction: `You are Maya, the expert AI Concierge for Instant Menu Pictures.
        Analyze any images provided with Michelin standards.
        Keep responses concise but intellectually deep.`,
      },
    });

    const text = response.text || "";

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("gemini-chat error:", error);
    return new Response(
      JSON.stringify({ error: "Chat processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
