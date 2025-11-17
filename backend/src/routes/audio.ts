import { Hono } from "hono";
import type { AppType } from "../types";
import { env } from "../env";

const audioRouter = new Hono<AppType>();

/**
 * POST /transcribe - Transcribe audio to text
 * Uses OpenAI's Whisper API to transcribe audio files
 */
audioRouter.post("/transcribe", async (c) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    // Get the form data
    const formData = await c.req.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof File)) {
      return c.json({ message: "No audio file provided" }, 400);
    }

    console.log(`🎤 [Audio Transcription] User ${user.id} - File: ${audioFile.name} (${audioFile.type}, ${audioFile.size} bytes)`);

    // Check if OpenAI API key is configured
    if (!env.OPENAI_API_KEY) {
      console.error("❌ [Audio Transcription] OpenAI API key not configured");
      return c.json({ message: "Audio transcription is not configured" }, 500);
    }

    // Create a new FormData for OpenAI API
    const openaiFormData = new FormData();
    openaiFormData.append("file", audioFile);
    openaiFormData.append("model", "whisper-1");

    // Call OpenAI Whisper API
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: openaiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [Audio Transcription] OpenAI API error:", errorText);
      return c.json({ message: "Failed to transcribe audio" }, 500);
    }

    const result = await response.json();
    const transcription = result.text || "";

    console.log(`✅ [Audio Transcription] Success - Transcribed: "${transcription.substring(0, 50)}${transcription.length > 50 ? "..." : ""}"`);

    return c.json({ transcription });
  } catch (error) {
    console.error("❌ [Audio Transcription] Error:", error);
    return c.json({ message: "Failed to transcribe audio" }, 500);
  }
});

export { audioRouter };
