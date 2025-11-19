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
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

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
  console.log("  👤 Profile:      GET/POST /api/profile");
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
