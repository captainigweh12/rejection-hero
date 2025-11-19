import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppType } from "../types";
import { db } from "../db";
import { createOrUpdateContact, sendEmail } from "../services/gohighlevel";

const bugReportRouter = new Hono<AppType>();

const bugReportSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum(["BUG", "FEATURE_REQUEST", "UI_ISSUE", "PERFORMANCE", "OTHER"]).optional(),
  stepsToReproduce: z.string().optional(),
  deviceInfo: z.string().optional(),
});

/**
 * POST /api/bug-reports
 * Submit a bug report and notify via GoHighLevel
 */
bugReportRouter.post("/", zValidator("json", bugReportSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { subject, description, category = "OTHER", stepsToReproduce, deviceInfo } = c.req.valid("json");

  try {
    // Get user profile
    const profile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    const displayName = profile?.displayName || user.name || "User";
    const email = user.email;

    // Create or update contact in GoHighLevel
    const contactResult = await createOrUpdateContact({
      firstName: displayName.split(" ")[0] || "User",
      lastName: displayName.split(" ").slice(1).join(" ") || "",
      name: displayName,
      email: email,
      tags: ["Bug Reporter", "App User"],
      customFields: [
        { key: "userId", field_value: user.id },
        { key: "lastBugReport", field_value: new Date().toISOString() },
      ],
    });

    const contactId = contactResult.contact?.id || contactResult.id;

    if (!contactId) {
      console.error("❌ [Bug Report] Failed to get contact ID");
      return c.json({ message: "Failed to submit bug report" }, 500);
    }

    // Create bug report HTML
    const bugReportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #FF6B35 0%, #0099FF 100%);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            margin-bottom: 0;
          }
          .content {
            background: #f9f9f9;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
          .field {
            margin-bottom: 20px;
          }
          .field-label {
            font-weight: bold;
            color: #555;
            margin-bottom: 5px;
            font-size: 14px;
          }
          .field-value {
            background: white;
            padding: 12px;
            border-radius: 4px;
            border: 1px solid #ddd;
            color: #333;
          }
          .category-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            background: #7E3FE4;
            color: white;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2 style="margin: 0;">🐛 Bug Report Submitted</h2>
        </div>
        <div class="content">
          <div class="field">
            <div class="field-label">Reported By:</div>
            <div class="field-value">${displayName} (${email})</div>
          </div>
          <div class="field">
            <div class="field-label">User ID:</div>
            <div class="field-value">${user.id}</div>
          </div>
          <div class="field">
            <div class="field-label">Category:</div>
            <div class="field-value">
              <span class="category-badge">${category}</span>
            </div>
          </div>
          <div class="field">
            <div class="field-label">Subject:</div>
            <div class="field-value">${subject}</div>
          </div>
          <div class="field">
            <div class="field-label">Description:</div>
            <div class="field-value">${description.replace(/\n/g, "<br>")}</div>
          </div>
          ${stepsToReproduce ? `
          <div class="field">
            <div class="field-label">Steps to Reproduce:</div>
            <div class="field-value">${stepsToReproduce.replace(/\n/g, "<br>")}</div>
          </div>
          ` : ""}
          ${deviceInfo ? `
          <div class="field">
            <div class="field-label">Device Info:</div>
            <div class="field-value">${deviceInfo}</div>
          </div>
          ` : ""}
          <div class="field">
            <div class="field-label">Submitted At:</div>
            <div class="field-value">${new Date().toLocaleString()}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email notification via GoHighLevel
    // Note: This requires the contact to have an email conversation thread
    // We'll also create a note/activity in GoHighLevel
    const emailResult = await sendEmail(
      contactId,
      `🐛 Bug Report: ${subject}`,
      bugReportHTML
    );

    // Also create a note in GoHighLevel (if API supports it)
    // For now, we'll rely on the email notification

    // Store bug report in database for tracking
    await db.bugReport.create({
      data: {
        userId: user.id,
        subject,
        description,
        category,
        stepsToReproduce: stepsToReproduce || null,
        deviceInfo: deviceInfo || null,
        status: "PENDING",
      },
    });

    return c.json({
      success: true,
      message: "Bug report submitted successfully",
      contactId,
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error("❌ [Bug Report] Error:", error);
    return c.json(
      {
        success: false,
        message: "Failed to submit bug report",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

export default bugReportRouter;

