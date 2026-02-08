import { createClient } from "jsr:@supabase/supabase-js@2";
import { GoogleGenAI } from "npm:@google/genai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
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

    // Server-side daily limit enforcement
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('daily_usage, last_usage_date, account_tier, account_status, free_credits, purchased_credits')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Could not fetch user profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile.account_status !== 'ACTIVE') {
      return new Response(
        JSON.stringify({ error: "Account not active. Please verify your email." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check credits
    if (profile.free_credits <= 0 && profile.purchased_credits <= 0) {
      return new Response(
        JSON.stringify({ error: "Out of credits. Purchase a package to continue." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check daily limit
    const now = new Date();
    const lastUsage = new Date(profile.last_usage_date);
    const daysPassed = (now.getTime() - lastUsage.getTime()) / (24 * 60 * 60 * 1000);
    const currentDailyUsage = daysPassed > 1 ? 0 : profile.daily_usage;
    const dailyLimit = profile.account_tier === 'PREMIUM' ? 100 : 10;

    if (currentDailyUsage >= dailyLimit) {
      return new Response(
        JSON.stringify({ error: "Daily limit reached. Upgrade to Premium for higher limits or try again tomorrow." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, prompt, aspectRatio, imageBase64, editPrompt } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("VITE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Validate aspect ratio - Gemini supports these values
    const validAspectRatios = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];
    const safeAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : "1:1";

    console.log(`Processing ${action} request for user ${user.id}, aspect ratio: ${safeAspectRatio}`);

    if (action === "generate") {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp-image-generation",
        contents: prompt,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio: safeAspectRatio,
          },
        },
      });

      // Extract image from response parts
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
        console.error("No image in response parts:", JSON.stringify(parts).substring(0, 500));
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
      // For editing, send the existing image + edit prompt
      const mimeType = imageBase64?.startsWith("data:")
        ? imageBase64.split(";")[0].split(":")[1]
        : "image/png";
      const base64Data = imageBase64?.includes(",")
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
          imageConfig: {
            aspectRatio: safeAspectRatio,
          },
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

    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use 'generate' or 'edit'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("generate-image error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Handle Gemini-specific errors
    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
