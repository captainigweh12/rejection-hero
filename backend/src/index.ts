import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "@hono/node-server/serve-static";

import { auth } from "./auth";
import { env } from "./env";
import { uploadRouter } from "./routes/upload";
import { sampleRouter } from "./routes/sample";
import { profileRouter } from "./routes/profile";
import { discoverRouter } from "./routes/discover";
import { swipeRouter } from "./routes/swipe";
import { matchesRouter } from "./routes/matches";
import { questsRouter } from "./routes/quests";
import { statsRouter } from "./routes/stats";
import liveRouter from "./routes/live";
import { friendsRouter } from "./routes/friends";
import { messagesRouter } from "./routes/messages";
import { groupsRouter } from "./routes/groups";
import { groupQuestsRouter } from "./routes/groupQuests";
import { groupLiveRouter } from "./routes/groupLive";
import { sharedQuestsRouter } from "./routes/sharedQuests";
import journalRouter from "./routes/journal";
import postsRouter from "./routes/posts";
import momentsRouter from "./routes/moments";
import { notificationsRouter } from "./routes/notifications";
import { gohighlevelRouter } from "./routes/gohighlevel";
import { supportRouter } from "./routes/support";
import { categoriesRouter } from "./routes/categories";
import { audioRouter } from "./routes/audio";
import { authRouter } from "./routes/auth";
import { webRedirectRouter } from "./routes/webRedirects";
import challengesRouter from "./routes/challenges";
import paymentsRouter, { paymentRedirectRouter } from "./routes/payments";
import policiesRouter from "./routes/policies";
import { adminRouter } from "./routes/admin";
import bugReportRouter from "./routes/bug-reports";
import { questVerificationRouter } from "./routes/questVerification";
import { generateDailyChallengesForAllUsers, sendMotivationalNotifications } from "./services/challengeScheduler";
import { type AppType } from "./types";

// AppType context adds user and session to the context, will be null if the user or session is null
const app = new Hono<AppType>();

console.log("🔧 Initializing Hono application...");
app.use("*", logger());
app.use("/*", cors());

/** Authentication middleware
 * Extracts session from request headers and attaches user/session to context
 * All routes can access c.get("user") and c.get("session")
 */
app.use("*", async (c, next) => {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    c.set("user", session?.user ?? null); // type: typeof auth.$Infer.Session.user | null
    c.set("session", session?.session ?? null); // type: typeof auth.$Infer.Session.session | null

    // Log auth status for API requests
    if (c.req.path.startsWith("/api/") && !c.req.path.startsWith("/api/auth/")) {
      console.log(`🔐 [Auth Middleware] ${c.req.method} ${c.req.path} - User: ${session?.user?.id || "null"}`);
    }

    return next();
  } catch (error) {
    console.error("❌ [Auth Middleware] Error:", error);
    c.set("user", null);
    c.set("session", null);
    return next();
  }
});

// Mount custom auth routes BEFORE Better Auth handler (so they take precedence)
console.log("🔐 Mounting custom password reset routes at /api/auth");
app.route("/api/auth", authRouter);

// Better Auth handler
// Handles all authentication endpoints: /api/auth/sign-in, /api/auth/sign-up, etc.
console.log("🔐 Mounting Better Auth handler at /api/auth/*");
app.on(["GET", "POST"], "/api/auth/*", async (c) => {
  try {
    const path = c.req.path;
    const method = c.req.method;
    const url = c.req.url;
    const headers = Object.fromEntries(c.req.raw.headers.entries());
    
    // Log ALL auth requests (not just sign-up) for debugging
    console.log(`🔐 [Auth Request] ${method} ${path}`);
    console.log(`   Full URL: ${url}`);
    console.log(`   Origin: ${headers.origin || "none"}`);
    console.log(`   User-Agent: ${headers["user-agent"]?.substring(0, 50) || "none"}...`);
    
    // Log sign-up requests with more detail
    if (path.includes("/sign-up/email")) {
      console.log("🔐 [Sign-Up] Email sign-up request received");
      console.log(`   Method: ${method}`);
      console.log(`   Path: ${path}`);
      console.log(`   Headers:`, JSON.stringify({
        origin: headers.origin,
        referer: headers.referer,
        contentType: headers["content-type"],
      }, null, 2));
      
      // Try to get request body for debugging (if available)
      try {
        // Clone request to read body without consuming it
        const clonedRequest = c.req.raw.clone();
        const body = await clonedRequest.json().catch(() => null);
        if (body) {
          console.log(`   Email: ${body.email || "not provided"}`);
          console.log(`   Name: ${body.name || "not provided"}`);
          console.log(`   Password: ${body.password ? "***" : "not provided"}`);
        } else {
          console.log(`   Body: Unable to parse (might be FormData or already consumed)`);
        }
      } catch (error) {
        console.log(`   Body parse error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Log OAuth callback requests for debugging
    if (path.includes("/callback/google")) {
      console.log("🔐 [OAuth] Google callback received");
      console.log(`   URL: ${c.req.url}`);
      console.log(`   Method: ${method}`);
      console.log(`   Query: ${c.req.query()}`);
    }
    
    const response = await auth.handler(c.req.raw);
    
    // Log sign-up responses
    if (path.includes("/sign-up/email")) {
      console.log(`🔐 [Sign-Up] Sign-up response: ${response.status}`);
      if (response.status >= 400) {
        const text = await response.clone().text().catch(() => "Unable to read response");
        console.error(`❌ [Sign-Up] Sign-up error (${response.status}):`);
        console.error(`   ${text.substring(0, 500)}`);
        
        // Check for specific error types
        if (text.includes("database") || text.includes("connection")) {
          console.error("   ⚠️  Database connection issue detected!");
          console.error("   Check DATABASE_URL in Railway environment variables");
        }
        if (text.includes("table") || text.includes("does not exist")) {
          console.error("   ⚠️  Missing table detected!");
          console.error("   Run: bun run db:push");
        }
        if (text.includes("unique constraint") || text.includes("already exists")) {
          console.error("   ⚠️  User already exists with this email");
        }
      } else {
        console.log("✅ [Sign-Up] Sign-up successful - user should be created in database");
        
        // Verify user was actually created (non-blocking)
        try {
          const responseText = await response.clone().text().catch(() => "");
          if (responseText) {
            const data = JSON.parse(responseText);
            if (data?.user?.id) {
              console.log(`   ✅ User ID: ${data.user.id}`);
              console.log(`   ✅ Email: ${data.user.email}`);
            }
          }
        } catch {
          // Verification failed, but sign-up was successful
        }
      }
    }
    
    // Log OAuth callback responses
    if (path.includes("/callback/google")) {
      console.log(`🔐 [OAuth] Google callback response: ${response.status}`);
      if (response.status >= 400) {
        const text = await response.clone().text().catch(() => "Unable to read response");
        console.error(`❌ [OAuth] Google callback error: ${text.substring(0, 200)}`);
      }
    }
    
    return response;
  } catch (error: any) {
    const path = c.req.path;
    const method = c.req.method;
    
    console.error(`❌ [Auth Handler] Error in auth handler:`);
    console.error(`   Path: ${path}`);
    console.error(`   Method: ${method}`);
    console.error(`   Error: ${error?.message || error}`);
    
    // Check for database connection errors
    if (error?.code === "P1001" || error?.message?.includes("Can't reach database")) {
      console.error("❌ [Auth Handler] Database connection failed!");
      console.error("   Check DATABASE_URL in Railway environment variables");
    }
    
    // Check for table missing errors
    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      console.error("❌ [Auth Handler] Table does not exist!");
      console.error("   Run: bun run db:push");
    }
    
    console.error(`   Stack: ${error?.stack?.substring(0, 500)}`);
    
    // Return proper error response instead of crashing
    return c.json(
      { 
        error: "Authentication error",
        message: error?.message || "An error occurred during authentication",
        path: path
      },
      500
    );
  }
});

// Serve uploaded images statically
// Files in uploads/ directory are accessible at /uploads/* URLs
console.log("📁 Serving static files from uploads/ directory");
app.use("/uploads/*", serveStatic({ root: "./" }));

// Mount route modules
console.log("📤 Mounting upload routes at /api/upload");
app.route("/api/upload", uploadRouter);

console.log("📝 Mounting sample routes at /api/sample");
app.route("/api/sample", sampleRouter);

console.log("👤 Mounting profile routes at /api/profile");
app.route("/api/profile", profileRouter);

console.log("🔍 Mounting discover routes at /api/discover");
app.route("/api/discover", discoverRouter);

console.log("👆 Mounting swipe routes at /api/swipe");
app.route("/api/swipe", swipeRouter);

console.log("💕 Mounting matches routes at /api/matches");
app.route("/api/matches", matchesRouter);

console.log("🎯 Mounting quests routes at /api/quests");
app.route("/api/quests", questsRouter);

console.log("🏆 Mounting challenges routes at /api/challenges");
app.route("/api/challenges", challengesRouter);

console.log("📊 Mounting stats routes at /api/stats");
app.route("/api/stats", statsRouter);

console.log("📹 Mounting live routes at /api/live");
app.route("/api/live", liveRouter);

console.log("👥 Mounting friends routes at /api/friends");
app.route("/api/friends", friendsRouter);

console.log("💬 Mounting messages routes at /api/messages");
app.route("/api/messages", messagesRouter);

console.log("🏘️  Mounting groups routes at /api/groups");
app.route("/api/groups", groupsRouter);

console.log("🎯 Mounting group quests routes at /api/group-quests");
app.route("/api/group-quests", groupQuestsRouter);

console.log("📹 Mounting group live routes at /api/group-live");
app.route("/api/group-live", groupLiveRouter);

console.log("🎁 Mounting shared quests routes at /api/shared-quests");
app.route("/api/shared-quests", sharedQuestsRouter);

console.log("✅ Mounting quest verification routes at /api/quest-verification");
app.route("/api/quest-verification", questVerificationRouter);

console.log("🛡️ Mounting moderation routes at /api/moderation");
import { moderationRouter } from "./routes/moderation";
app.route("/api/moderation", moderationRouter);

console.log("📓 Mounting journal routes at /api/journal");
app.route("/api/journal", journalRouter);

console.log("📝 Mounting posts routes at /api/posts");
app.route("/api/posts", postsRouter);

console.log("⏰ Mounting moments routes at /api/moments");
app.route("/api/moments", momentsRouter);

console.log("🔔 Mounting notifications routes at /api/notifications");
app.route("/api/notifications", notificationsRouter);

console.log("📧 Mounting GoHighLevel routes at /api/gohighlevel");
app.route("/api/gohighlevel", gohighlevelRouter);

console.log("🎫 Mounting support routes at /api/support");
app.route("/api/support", supportRouter);

console.log("📁 Mounting categories routes at /api/categories");
app.route("/api/categories", categoriesRouter);

console.log("🎤 Mounting audio routes at /api/audio");
app.route("/api/audio", audioRouter);

console.log("💳 Mounting payments routes at /api/payments");
app.route("/api/payments", paymentsRouter);

console.log("💳 Mounting payment redirect routes at root level");
app.route("/", paymentRedirectRouter);

console.log("📜 Mounting policies routes at /api/policies");
app.route("/api/policies", policiesRouter);

console.log("👑 Mounting admin routes at /api/admin");
app.route("/api/admin", adminRouter);

console.log("🐛 Mounting bug report routes at /api/bug-reports");
app.route("/api/bug-reports", bugReportRouter);

console.log("🌐 Mounting web redirect routes");
app.route("/", webRedirectRouter);

// Health check endpoint
// Used by load balancers and monitoring tools to verify service is running
app.get("/health", (c) => {
  console.log("💚 Health check requested");
  return c.json({ status: "ok" });
});

// Start the server
console.log("⚙️  Starting server...");

// Set up challenge scheduler (runs daily at 9 AM and 2 PM UTC)
let lastDailyGeneration = new Date();
let lastMotivationSend = new Date();

// Check every 5 minutes for scheduled tasks
setInterval(() => {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();

  // Generate daily challenges at 9:00 AM UTC (check at 9:00-9:05)
  if (utcHour === 9 && utcMinute >= 0 && utcMinute < 5) {
    const hoursSinceLastRun = (now.getTime() - lastDailyGeneration.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastRun >= 23) {
      // Only run if at least 23 hours have passed (once per day)
      console.log("⏰ [Challenge Scheduler] Running daily quest generation...");
      generateDailyChallengesForAllUsers().catch((error) => {
        console.error("❌ [Challenge Scheduler] Error generating daily challenges:", error);
      });
      lastDailyGeneration = now;
    }
  }

  // Send motivational notifications at 2:00 PM UTC (check at 14:00-14:05)
  if (utcHour === 14 && utcMinute >= 0 && utcMinute < 5) {
    const hoursSinceLastRun = (now.getTime() - lastMotivationSend.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastRun >= 23) {
      // Only run if at least 23 hours have passed (once per day)
      console.log("💪 [Challenge Scheduler] Sending motivational notifications...");
      sendMotivationalNotifications().catch((error) => {
        console.error("❌ [Challenge Scheduler] Error sending motivation:", error);
      });
      lastMotivationSend = now;
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Decay confidence meters every hour
setInterval(async () => {
  try {
    const { decayConfidenceMeters } = await import("./services/confidenceDecay");
    await decayConfidenceMeters();
  } catch (error) {
    console.error("❌ [Confidence Decay] Error:", error);
  }
}, 60 * 60 * 1000); // Every hour

// Check leaderboard fall-behind every 6 hours
setInterval(async () => {
  try {
    const { checkLeaderboardFallBehind } = await import("./services/leaderboardNotifications");
    await checkLeaderboardFallBehind();
  } catch (error) {
    console.error("❌ [Leaderboard Notifications] Error:", error);
  }
}, 6 * 60 * 60 * 1000); // Every 6 hours

// Check quest time warnings every minute
setInterval(async () => {
  try {
    const { checkQuestTimeWarnings } = await import("./services/questTimeWarnings");
    const result = await checkQuestTimeWarnings();
    if (result.warningsSent > 0) {
      console.log(`⏰ [Quest Time Warnings] Sent ${result.warningsSent} time warning(s)`);
    }
  } catch (error) {
    console.error("❌ [Quest Time Warnings] Error:", error);
  }
}, 60 * 1000); // Every minute

// Send quest reminders every 2 hours
setInterval(async () => {
  try {
    const { sendQuestReminders } = await import("./services/questTimeWarnings");
    const result = await sendQuestReminders();
    if (result.remindersSent > 0) {
      console.log(`📋 [Quest Reminders] Sent ${result.remindersSent} reminder(s)`);
    }
  } catch (error) {
    console.error("❌ [Quest Reminders] Error:", error);
  }
}, 2 * 60 * 60 * 1000); // Every 2 hours

serve({ fetch: app.fetch, port: Number(env.PORT) }, () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📍 Environment: ${env.NODE_ENV}`);
  console.log(`🚀 Server is running on port ${env.PORT}`);
  console.log(`🔗 Base URL: http://localhost:${env.PORT}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📚 Available endpoints:");
  console.log("  🔐 Auth:         /api/auth/*");
  console.log("  📤 Upload:       POST /api/upload/image");
  console.log("  📝 Sample:       GET/POST /api/sample");
  console.log("  👤 profile:      GET/POST /api/profile");
  console.log("  🔍 Discover:     GET /api/discover");
  console.log("  👆 Swipe:        POST /api/swipe");
  console.log("  💕 Matches:      GET /api/matches");
  console.log("  🎯 Quests:       GET/POST /api/quests");
  console.log("  🏆 Challenges:   GET/POST /api/challenges");
  console.log("  📊 Stats:        GET /api/stats");
  console.log("  📹 Live:        GET/POST /api/live");
  console.log("  👥 Friends:      GET/POST /api/friends");
  console.log("  💬 Messages:     GET/POST /api/messages");
  console.log("  🏘️  Groups:       GET/POST /api/groups");
  console.log("  🎁 SharedQuests: GET/POST /api/shared-quests");
  console.log("  📓 Journal:      GET/POST /api/journal");
  console.log("  🔔 Notifications: GET /api/notifications");
  console.log("  💚 Health:       GET /health");
  console.log("\n⏰ Challenge Scheduler: Active (Daily at 9 AM & 2 PM UTC)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
});
