import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import crypto from "crypto";
import { type AppType } from "../types";
import { db } from "../db";
import {
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
} from "@/shared/contracts";
import { createOrUpdateContact, sendEmail } from "../services/gohighlevel";

const app = new Hono<AppType>();

// Generate a secure reset token
function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Generate password reset email HTML
function getPasswordResetEmailHTML(userName: string, resetLink: string): string {
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
          background: linear-gradient(135deg, #FF6B35 0%, #0099FF 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        .content {
          padding: 40px 30px;
          background: #ffffff;
        }
        .content p {
          margin: 16px 0;
          font-size: 16px;
          color: #333;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #FF6B35 0%, #0099FF 100%);
          color: white !important;
          padding: 16px 40px;
          text-decoration: none;
          border-radius: 50px;
          font-weight: bold;
          font-size: 18px;
          box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
          transition: transform 0.2s;
        }
        .button:hover {
          transform: scale(1.05);
        }
        .warning {
          background-color: #FFF3E0;
          padding: 20px;
          border-left: 4px solid #FF6B35;
          border-radius: 5px;
          margin: 20px 0;
          font-size: 14px;
          color: #666;
        }
        .footer {
          text-align: center;
          padding: 30px;
          background-color: #f9f9f9;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #999;
        }
        .footer a {
          color: #FF6B35;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>We received a request to reset your Rejection Hero password. If you didn't make this request, you can safely ignore this email.</p>

          <p>To reset your password, click the button below:</p>

          <div class="button-container">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>

          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; font-size: 12px; color: #666;">${resetLink}</p>

          <div class="warning">
            <strong>⚠️ Security Notice:</strong> This link will expire in 24 hours. If you didn't request a password reset, please ignore this email and your account will remain secure.
          </div>

          <p>Best regards,<br><strong>The Rejection Hero Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 Rejection Hero. All rights reserved.</p>
          <p>This is an automated message, please don't reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * POST /api/auth/forgot-password
 * Send password reset email
 */
app.post(
  "/forgot-password",
  zValidator("json", forgotPasswordRequestSchema),
  async (c) => {
    try {
      const { email } = c.req.valid("json");

      console.log("🔐 [Auth] Password reset requested for:", email);

      // Find user by email
      const user = await db.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't reveal if user exists or not (security best practice)
        console.log("ℹ️ [Auth] Password reset requested for non-existent user:", email);
        return c.json(
          {
            success: true,
            message:
              "If an account with this email exists, a password reset link has been sent.",
          },
          200
        );
      }

      // Generate reset token
      const resetToken = generateResetToken();
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store verification token in database
      await db.verification.create({
        data: {
          id: crypto.randomUUID(),
          identifier: `password-reset:${email}`,
          value: resetToken,
          expiresAt: tokenExpiry,
        },
      });

      console.log("✅ [Auth] Reset token stored for:", email);

      // Create or update contact in GoHighLevel
      const contactResult = await createOrUpdateContact({
        email,
        name: user.name || "User",
        tags: ["password-reset", "rejection-hero"],
      });

      if (!contactResult.success || !contactResult.contactId) {
        console.error("❌ [Auth] Failed to create GoHighLevel contact:", contactResult.error);
        return c.json(
          {
            success: false,
            message: "Failed to send password reset email",
          },
          500
        );
      }

      // Generate reset link
      const backendUrl = process.env.BACKEND_URL || "https://preview-cgmxpdeghzpq.share.sandbox.dev";
      const resetLink = `vibecode://reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      // Send password reset email via GoHighLevel
      const emailHTML = getPasswordResetEmailHTML(user.name || "User", resetLink);
      const emailResult = await sendEmail(
        contactResult.contactId,
        "Reset Your Rejection Hero Password",
        emailHTML,
        "noreply@rejectionhero.com"
      );

      if (!emailResult.success) {
        console.error("❌ [Auth] Failed to send email:", emailResult.error);
        return c.json(
          {
            success: false,
            message: "Failed to send password reset email",
          },
          500
        );
      }

      console.log("✅ [Auth] Password reset email sent successfully");

      return c.json(
        {
          success: true,
          message: "If an account with this email exists, a password reset link has been sent.",
        },
        200
      );
    } catch (error) {
      console.error("❌ [Auth] Error in forgot-password:", error);
      return c.json(
        {
          success: false,
          message: "An error occurred. Please try again later.",
        },
        500
      );
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
app.post(
  "/reset-password",
  zValidator("json", resetPasswordRequestSchema),
  async (c) => {
    try {
      const { token, password } = c.req.valid("json");

      console.log("🔐 [Auth] Attempting password reset with token");

      // Find valid reset token
      const verification = await db.verification.findFirst({
        where: {
          identifier: {
            startsWith: "password-reset:",
          },
          value: token,
          expiresAt: {
            gt: new Date(), // Token must not be expired
          },
        },
      });

      if (!verification) {
        console.log("❌ [Auth] Invalid or expired reset token");
        return c.json(
          {
            success: false,
            message: "Invalid or expired reset token",
          },
          400
        );
      }

      // Extract email from identifier
      const email = verification.identifier.replace("password-reset:", "");

      // Find user by email
      const user = await db.user.findUnique({
        where: { email },
      });

      if (!user) {
        console.error("❌ [Auth] User not found for email:", email);
        return c.json(
          {
            success: false,
            message: "User not found",
          },
          404
        );
      }

      // Hash the new password
      const hashedPassword = await Bun.password.hash(password);

      // Find or create account for email/password
      const account = await db.account.findFirst({
        where: {
          userId: user.id,
          providerId: "email",
        },
      });

      if (account) {
        // Update existing account
        await db.account.update({
          where: { id: account.id },
          data: {
            password: hashedPassword,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new account
        await db.account.create({
          data: {
            id: crypto.randomUUID(),
            accountId: user.id,
            providerId: "email",
            userId: user.id,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      // Delete used verification token
      await db.verification.delete({
        where: { id: verification.id },
      });

      console.log("✅ [Auth] Password reset successfully for:", email);

      // Send confirmation email
      const contactResult = await createOrUpdateContact({
        email,
        name: user.name || "User",
        tags: ["password-reset-complete", "rejection-hero"],
      });

      if (contactResult.success && contactResult.contactId) {
        const confirmationHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; }
              .container { background: #f9f9f9; padding: 20px; border-radius: 10px; }
              .header { background: linear-gradient(135deg, #FF6B35 0%, #0099FF 100%); color: white; padding: 20px; border-radius: 5px; text-align: center; }
              .content { padding: 20px; background: white; margin-top: 20px; border-radius: 5px; }
              .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Password Reset Complete</h1>
              </div>
              <div class="content">
                <p>Hi ${user.name || "User"},</p>
                <p>Your password has been successfully reset. You can now log in to your Rejection Hero account with your new password.</p>
                <p>If you didn't make this change, please contact our support team immediately.</p>
                <p>Best regards,<br><strong>The Rejection Hero Team</strong></p>
              </div>
              <div class="footer">
                <p>© 2024 Rejection Hero. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail(
          contactResult.contactId,
          "Your Rejection Hero Password Has Been Reset",
          confirmationHTML,
          "noreply@rejectionhero.com"
        );
      }

      return c.json(
        {
          success: true,
          message: "Password has been reset successfully. You can now log in with your new password.",
        },
        200
      );
    } catch (error) {
      console.error("❌ [Auth] Error in reset-password:", error);
      return c.json(
        {
          success: false,
          message: "An error occurred. Please try again later.",
        },
        500
      );
    }
  }
);

export { app as authRouter };
