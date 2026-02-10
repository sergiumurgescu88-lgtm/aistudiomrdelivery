import { createClient } from "jsr:@supabase/supabase-js@2";
import { GoogleGenAI, Modality } from "npm:@google/genai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
      p_reason: 'Live AI Concierge session',
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

    const { message, audioBase64 } = body;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "message is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (message.length > 5000) {
      return new Response(
        JSON.stringify({ error: "message must be under 5000 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const parts: any[] = [{ text: message }];
    if (audioBase64 && typeof audioBase64 === "string" && audioBase64.length < 5_000_000) {
      const mimeType = audioBase64.startsWith("data:")
        ? audioBase64.split(";")[0].split(":")[1]
        : "audio/webm";
      const data = audioBase64.includes(",")
        ? audioBase64.split(",")[1]
        : audioBase64;
      parts.push({ inlineData: { data, mimeType } });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ role: "user", parts }],
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: "You are Maya, the Live AI Concierge. Respond naturally and conversationally.",
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
        },
      },
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!audioPart?.data) {
      return new Response(
        JSON.stringify({ error: "No audio response generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ audioBase64: audioPart.data, mimeType: audioPart.mimeType || "audio/wav" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("gemini-live-session error:", error);
    return new Response(
      JSON.stringify({ error: "Live session processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
