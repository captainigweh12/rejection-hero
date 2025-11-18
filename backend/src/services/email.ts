import { env } from "../env";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send email using Resend API
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, html, from = "noreply@rejectionhero.com" } = options;

  if (!env.RESEND_API_KEY) {
    console.warn("⚠️ [Email] RESEND_API_KEY not configured, skipping email send");
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ [Email] Resend API Error:", error);
      throw new Error(`Failed to send email: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log("✅ [Email] Email sent successfully:", data.id);
  } catch (error) {
    console.error("❌ [Email] Error sending email:", error);
    throw error;
  }
}

