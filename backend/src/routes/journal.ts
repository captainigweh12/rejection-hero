import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { randomUUID } from "node:crypto";
import { type AppType } from "../types";
import { db } from "../db";
import {
  transcribeAudioRequestSchema,
  createJournalEntryRequestSchema,
  updateJournalEntryRequestSchema,
} from "../../../shared/contracts";

const journalRouter = new Hono<AppType>();

// ============================================
// POST /api/journal/transcribe - Transcribe audio and generate summary
// ============================================
journalRouter.post("/transcribe", zValidator("json", transcribeAudioRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { audioBase64, text } = c.req.valid("json");

  // Check if OpenAI API key is available
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return c.json({ message: "OpenAI API key not configured" }, 500);
  }

  try {
    let transcript = "";

    // If text is provided directly, use it; otherwise transcribe audio
    if (text) {
      transcript = text;
    } else if (audioBase64) {
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioBase64, "base64");

      // Step 1: Transcribe audio using Whisper API
      const formData = new FormData();
      const audioBlob = new Blob([audioBuffer], { type: "audio/m4a" });
      formData.append("file", audioBlob, "audio.m4a");
      formData.append("model", "whisper-1");

      const transcriptionResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
        },
        body: formData,
      });

      if (!transcriptionResponse.ok) {
        const error = await transcriptionResponse.text();
        console.error("Whisper API error:", error);
        return c.json({ message: "Failed to transcribe audio" }, 500);
      }

      const transcriptionData = (await transcriptionResponse.json()) as { text: string };
      transcript = transcriptionData.text;
    } else {
      return c.json({ message: "Either audioBase64 or text must be provided" }, 400);
    }

    // Step 2: Generate summary using GPT-4
    const summaryResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that summarizes journal entries. Create a brief 1-2 sentence summary of the user's journal entry. Focus on the key action they took and the outcome.",
          },
          {
            role: "user",
            content: `Summarize this journal entry: ${transcript}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (!summaryResponse.ok) {
      const error = await summaryResponse.text();
      console.error("GPT API error:", error);
      return c.json({ message: "Failed to generate summary" }, 500);
    }

    const summaryData = (await summaryResponse.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const summary = summaryData.choices[0].message.content.trim();

    return c.json({
      transcript,
      summary,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return c.json({ message: "Failed to process audio" }, 500);
  }
});

// ============================================
// POST /api/journal - Create journal entry with achievement
// ============================================
journalRouter.post("/", zValidator("json", createJournalEntryRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { audioUrl, audioTranscript, aiSummary, userEditedSummary, outcome, imageUrls, location } = c.req.valid("json");

  try {
    // Create journal entry
    const journalEntry = await db.journal_entry.create({
      data: {
        id: randomUUID(), // Generate unique ID for journal entry
        userId: user.id,
        audioUrl,
        audioTranscript,
        aiSummary,
        userEditedSummary,
        outcome,
        imageUrls: imageUrls ? JSON.stringify(imageUrls) : null,
        location,
        updatedAt: new Date(), // Set updatedAt timestamp
      },
    });

    // Determine achievement type based on outcome
    let achievementType = "gold_star"; // Default for YES
    let achievementDescription = "";

    switch (outcome) {
      case "YES":
        achievementType = "gold_star";
        achievementDescription = "Successfully got a YES! Keep up the great work!";
        break;
      case "NO":
        achievementType = "gold_star";
        achievementDescription = "Faced rejection head-on! This is growth!";
        break;
      case "ACTIVITY":
        achievementType = "gold_star";
        achievementDescription = "Completed an activity! You're making progress!";
        break;
    }

    // Create growth achievement
    const achievement = await db.growth_achievement.create({
      data: {
        id: randomUUID(), // Generate unique ID for achievement
        userId: user.id,
        journalEntryId: journalEntry.id,
        type: achievementType,
        description: achievementDescription,
      },
    });

    return c.json({
      id: journalEntry.id,
      achievement: {
        id: achievement.id,
        type: achievement.type,
        description: achievement.description,
        earnedAt: achievement.earnedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create journal entry error:", error);
    return c.json({ message: "Failed to create journal entry" }, 500);
  }
});

// ============================================
// GET /api/journal - Get all journal entries
// ============================================
journalRouter.get("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const entries = await db.journal_entry.findMany({
      where: {
        userId: user.id,
      },
      include: {
        growth_achievement: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return c.json({
      entries: entries.map((entry) => {
        // Safely parse imageUrls JSON
        let imageUrls: string[] = [];
        if (entry.imageUrls) {
          try {
            const parsed = JSON.parse(entry.imageUrls);
            // Ensure it's an array
            imageUrls = Array.isArray(parsed) ? parsed.filter((url) => typeof url === "string") : [];
          } catch (error) {
            console.error("Error parsing imageUrls for entry:", entry.id, error);
            imageUrls = [];
          }
        }

        return {
          id: entry.id,
          audioUrl: entry.audioUrl,
          audioTranscript: entry.audioTranscript,
          aiSummary: entry.aiSummary,
          userEditedSummary: entry.userEditedSummary,
          outcome: entry.outcome,
          imageUrls,
          location: entry.location,
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
          achievements: entry.growth_achievement.map((ach) => ({
            id: ach.id,
            type: ach.type,
            description: ach.description,
            earnedAt: ach.earnedAt.toISOString(),
          })),
        };
      }),
    });
  } catch (error) {
    console.error("Get journal entries error:", error);
    return c.json({ message: "Failed to fetch journal entries" }, 500);
  }
});

// ============================================
// PUT /api/journal/:id - Update journal entry
// ============================================
journalRouter.put("/:id", zValidator("json", updateJournalEntryRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { id } = c.req.param();
  const { userEditedSummary, outcome, imageUrls, location } = c.req.valid("json");

  try {
    // Verify entry belongs to user
    const entry = await db.journal_entry.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!entry) {
      return c.json({ message: "Journal entry not found" }, 404);
    }

    // Update entry
    const updateData: any = {
      userEditedSummary,
    };

    if (outcome) {
      updateData.outcome = outcome;
    }

    if (imageUrls) {
      updateData.imageUrls = JSON.stringify(imageUrls);
    }

    if (location) {
      updateData.location = location;
    }

    const updatedEntry = await db.journal_entry.update({
      where: { id },
      data: updateData,
    });

    // Safely parse imageUrls JSON
    let imageUrls: string[] = [];
    if (updatedEntry.imageUrls) {
      try {
        const parsed = JSON.parse(updatedEntry.imageUrls);
        imageUrls = Array.isArray(parsed) ? parsed.filter((url) => typeof url === "string") : [];
      } catch (error) {
        console.error("Error parsing imageUrls for updated entry:", updatedEntry.id, error);
        imageUrls = [];
      }
    }

    return c.json({
      id: updatedEntry.id,
      userEditedSummary: updatedEntry.userEditedSummary,
      imageUrls,
      location: updatedEntry.location,
    });
  } catch (error) {
    console.error("Update journal entry error:", error);
    return c.json({ message: "Failed to update journal entry" }, 500);
  }
});

// ============================================
// GET /api/journal/achievements - Get all growth achievements
// ============================================
journalRouter.get("/achievements", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const achievements = await db.growth_achievement.findMany({
      where: {
        userId: user.id,
      },
      include: {
        journal_entry: true,
      },
      orderBy: {
        earnedAt: "desc",
      },
    });

    // Calculate stats
    const stats = {
      totalAchievements: achievements.length,
      goldStars: achievements.filter((a) => a.type === "gold_star").length,
      silverStars: achievements.filter((a) => a.type === "silver_star").length,
      bronzeStars: achievements.filter((a) => a.type === "bronze_star").length,
    };

    return c.json({
      achievements: achievements.map((ach) => ({
        id: ach.id,
        type: ach.type,
        description: ach.description,
        earnedAt: ach.earnedAt.toISOString(),
        journalEntry: {
          id: ach.journal_entry.id,
          aiSummary: ach.journal_entry.aiSummary,
          userEditedSummary: ach.journal_entry.userEditedSummary,
          outcome: ach.journal_entry.outcome,
          createdAt: ach.journal_entry.createdAt.toISOString(),
        },
      })),
      stats,
    });
  } catch (error) {
    console.error("Get achievements error:", error);
    return c.json({ message: "Failed to fetch achievements" }, 500);
  }
});

export default journalRouter;
