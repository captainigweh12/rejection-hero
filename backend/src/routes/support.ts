import { Hono } from "hono";
import { type AppType } from "../types";
import { createOrUpdateContact, sendEmail } from "../services/gohighlevel";

const app = new Hono<AppType>();

/**
 * POST /api/support/create-ticket
 * Create a support ticket and send it to GoHighLevel
 */
app.post("/create-ticket", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await c.req.json();
    const { subject, category, description, userEmail, userName } = body;

    if (!subject || !category || !description) {
      return c.json({ error: "Subject, category, and description are required" }, 400);
    }

    const email = userEmail || user.email;
    const name = userName || user.name || "User";

    console.log("🎫 [Support] Creating support ticket for:", email);

    // Create or update contact in GoHighLevel with support tags
    const contactResult = await createOrUpdateContact({
      email,
      name,
      tags: ["support", "needs-assistance", `support-${category}`],
      customFields: [
        { key: "latest_support_ticket", field_value: subject },
        { key: "support_category", field_value: category },
        { key: "support_status", field_value: "open" },
      ],
    });

    if (!contactResult.success || !contactResult.contactId) {
      console.error("❌ [Support] Failed to create/update contact:", contactResult.error);
      return c.json(
        {
          error: "Failed to create contact in support system",
          details: contactResult.error,
        },
        500
      );
    }

    console.log("✅ [Support] Contact created/updated with ID:", contactResult.contactId);

    // Send confirmation email to user
    const confirmationEmailHTML = getSupportTicketConfirmationEmail(name, subject, category);
    const emailResult = await sendEmail(
      contactResult.contactId,
      `Support Ticket Received: ${subject}`,
      confirmationEmailHTML,
      "support@rejectionhero.com"
    );

    if (!emailResult.success) {
      console.error("⚠️ [Support] Failed to send confirmation email:", emailResult.error);
      // Don't fail the request if email fails
    } else {
      console.log("✅ [Support] Confirmation email sent successfully");
    }

    // Log the support ticket details for internal tracking
    console.log("📋 [Support] Ticket Details:");
    console.log(`   Subject: ${subject}`);
    console.log(`   Category: ${category}`);
    console.log(`   Description: ${description}`);
    console.log(`   User: ${name} (${email})`);
    console.log(`   Contact ID: ${contactResult.contactId}`);

    return c.json({
      success: true,
      message: "Support ticket created successfully",
      ticketId: contactResult.contactId,
    });
  } catch (error) {
    console.error("❌ [Support] Error creating ticket:", error);
    return c.json(
      {
        error: "Failed to create support ticket",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

/**
 * Get support ticket confirmation email HTML template
 */
function getSupportTicketConfirmationEmail(userName: string, subject: string, category: string): string {
  const categoryEmojis: Record<string, string> = {
    bug: "🐛",
    feature: "💡",
    account: "👤",
    payment: "💳",
    technical: "⚙️",
    other: "📝",
  };

  const categoryLabels: Record<string, string> = {
    bug: "Bug Report",
    feature: "Feature Request",
    account: "Account Issue",
    payment: "Payment/Billing",
    technical: "Technical Support",
    other: "General Support",
  };

  const emoji = categoryEmojis[category] || "📝";
  const categoryLabel = categoryLabels[category] || category;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 0;
          background-color: #f4f4f4;
        }
        .email-container {
          background-color: #ffffff;
          margin: 20px auto;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #7E3FE4 0%, #00D9FF 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: bold;
        }
        .header p {
          margin: 10px 0 0;
          font-size: 18px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #7E3FE4;
          font-size: 24px;
          margin-top: 0;
        }
        .ticket-box {
          background: #f8f9fa;
          border-left: 4px solid #4CAF50;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .ticket-box h3 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 18px;
        }
        .ticket-box p {
          margin: 8px 0;
          color: #666;
        }
        .ticket-box .label {
          font-weight: bold;
          color: #333;
        }
        .status-badge {
          display: inline-block;
          background: #4CAF50;
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          margin: 10px 0;
        }
        .info-box {
          background: #e3f2fd;
          border-left: 4px solid #2196F3;
          padding: 15px 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>Rejection Hero</h1>
          <p>Support Team</p>
        </div>

        <div class="content">
          <h2>Support Ticket Received ${emoji}</h2>

          <p>Hi ${userName},</p>

          <p>Thank you for contacting Rejection Hero support! We've received your support ticket and our team is on it.</p>

          <div class="ticket-box">
            <h3>Your Ticket Details</h3>
            <p><span class="label">Subject:</span> ${subject}</p>
            <p><span class="label">Category:</span> ${categoryLabel}</p>
            <span class="status-badge">Open</span>
          </div>

          <div class="info-box">
            <p><strong>📧 What happens next?</strong></p>
            <p>• Our support team will review your ticket within 24 hours</p>
            <p>• We'll respond directly to this email with updates</p>
            <p>• You can reply to this email to add more information</p>
          </div>

          <p>In the meantime, you might find these resources helpful:</p>
          <ul>
            <li>Check our <a href="https://rejectionhero.com/faq" style="color: #7E3FE4;">FAQ page</a></li>
            <li>Browse our <a href="https://rejectionhero.com/help" style="color: #7E3FE4;">Help Center</a></li>
            <li>Join our <a href="https://rejectionhero.com/community" style="color: #7E3FE4;">Community</a></li>
          </ul>

          <p>We appreciate your patience and are here to help you continue your journey of embracing rejection!</p>

          <p>
            Best regards,<br>
            <strong>The Rejection Hero Support Team</strong>
          </p>
        </div>

        <div class="footer">
          <p><strong>Rejection Hero</strong> - Embrace Your NO's</p>
          <p>This is an automated confirmation email. Please reply to this email if you have additional information.</p>
          <p>© ${new Date().getFullYear()} Rejection Hero. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export { app as supportRouter };
