import { Hono } from "hono";
import { type AppType } from "../types";
import { db } from "../db";
import { env } from "../env";
import * as fs from "fs";
import * as path from "path";
import { sendEmail } from "../services/email";
import { createOrUpdateContact, sendEmail as sendGoHighLevelEmail } from "../services/gohighlevel";

const policiesRouter = new Hono<AppType>();

// Add __dirname for ES modules (Bun support)
const __filename = new URL(import.meta.url).pathname;
const __dirname = __filename.substring(0, __filename.lastIndexOf("/"));

console.log(`📜 [Policies] Router initialized. __dirname: ${__dirname}`);

// Policy types
const POLICY_TYPES = [
  "terms-of-service",
  "privacy-policy",
  "content-guidelines",
  "dmca",
  "recording-consent",
  "liability-waiver",
  "age-policy",
  "safety-policy",
  "payment-policy",
] as const;

type PolicyType = (typeof POLICY_TYPES)[number];

// ============================================
// GET /api/policies/:policyType - Get policy content
// ============================================
policiesRouter.get("/:policyType", async (c) => {
  const policyType = c.req.param("policyType") as PolicyType;

  if (!POLICY_TYPES.includes(policyType)) {
    return c.json({ message: "Invalid policy type" }, 400);
  }

  try {
    const filePath = path.join(__dirname, "../legal", `${policyType}.md`);
    console.log(`📄 [Policies] Loading policy: ${policyType}, path: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ [Policies] File not found at: ${filePath}`);
      return c.json({ message: "Policy not found" }, 404);
    }

    const content = fs.readFileSync(filePath, "utf-8");
    console.log(`✅ [Policies] Successfully read policy: ${policyType}`);

    return c.json({
      policyType,
      content,
      version: "1.0",
    });
  } catch (error) {
    console.error("❌ [Policies] Error reading policy:", error);
    return c.json({ message: "Failed to read policy" }, 500);
  }
});

// ============================================
// GET /api/policies - Get all policies list
// ============================================
policiesRouter.get("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    // Get user's accepted policies
    const acceptances = await db.policy_acceptance.findMany({
      where: { userId: user.id },
    });

    const acceptedMap = new Map(
      acceptances.map((a) => [a.policyType, a.acceptedAt])
    );

    const policies = POLICY_TYPES.map((type) => ({
      type,
      name: getPolicyName(type),
      accepted: acceptedMap.has(type),
      acceptedAt: acceptedMap.get(type)?.toISOString() || null,
      version: "1.0",
    }));

    return c.json({ policies });
  } catch (error) {
    console.error("Error fetching policies:", error);
    return c.json({ message: "Failed to fetch policies" }, 500);
  }
});

// ============================================
// POST /api/policies/:policyType/accept - Accept a policy
// ============================================
policiesRouter.post("/:policyType/accept", async (c) => {
  const user = c.get("user");
  const policyType = c.req.param("policyType") as PolicyType;

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  if (!POLICY_TYPES.includes(policyType)) {
    return c.json({ message: "Invalid policy type" }, 400);
  }

  try {
    const ipAddress = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
    const userAgent = c.req.header("user-agent") || "unknown";

    // Upsert policy acceptance
    const acceptance = await db.policy_acceptance.upsert({
      where: {
        userId_policyType: {
          userId: user.id,
          policyType,
        },
      },
      create: {
        userId: user.id,
        policyType,
        version: "1.0",
        ipAddress,
        userAgent,
        emailSent: false,
      },
      update: {
        acceptedAt: new Date(),
        ipAddress,
        userAgent,
        version: "1.0",
      },
    });

    // Send email confirmation
    try {
      const policyName = getPolicyName(policyType);
      const policyContent = await getPolicyContent(policyType);
      
      await sendPolicyAcceptanceEmail(user.email, user.name || "User", policyType, policyName, policyContent);
      
      // Update email sent status
      await db.policy_acceptance.update({
        where: { id: acceptance.id },
        data: {
          emailSent: true,
          emailSentAt: new Date(),
        },
      });
    } catch (emailError) {
      console.error("Error sending policy acceptance email:", emailError);
      // Don't fail the acceptance if email fails
    }

    return c.json({
      success: true,
      message: "Policy accepted",
      acceptance: {
        policyType,
        acceptedAt: acceptance.acceptedAt.toISOString(),
        emailSent: acceptance.emailSent,
      },
    });
  } catch (error) {
    console.error("Error accepting policy:", error);
    return c.json({ message: "Failed to accept policy" }, 500);
  }
});

// ============================================
// GET /api/policies/check-required - Check which policies user needs to accept
// ============================================
policiesRouter.get("/check-required", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const acceptances = await db.policy_acceptance.findMany({
      where: { userId: user.id },
    });

    const acceptedTypes = new Set(acceptances.map((a) => a.policyType));
    const required = POLICY_TYPES.filter((type) => !acceptedTypes.has(type));

    return c.json({
      required,
      allAccepted: required.length === 0,
      acceptedCount: acceptances.length,
      totalCount: POLICY_TYPES.length,
    });
  } catch (error) {
    console.error("Error checking required policies:", error);
    return c.json({ message: "Failed to check required policies" }, 500);
  }
});

// Helper functions
function getPolicyName(policyType: PolicyType): string {
  const names: Record<PolicyType, string> = {
    "terms-of-service": "Terms of Service",
    "privacy-policy": "Privacy Policy",
    "content-guidelines": "Content & Community Guidelines",
    "dmca": "DMCA Policy & Copyright Notice",
    "recording-consent": "Recording Consent & Release",
    "liability-waiver": "Liability Waiver & Risk Disclosure",
    "age-policy": "Age Verification Policy",
    "safety-policy": "Safety & Misconduct Reporting Policy",
    "payment-policy": "Payment Policy",
  };
  return names[policyType] || policyType;
}

async function getPolicyContent(policyType: PolicyType): Promise<string> {
  const filePath = path.join(__dirname, "../legal", `${policyType}.md`);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, "utf-8");
  }
  return "";
}

async function sendPolicyAcceptanceEmail(
  email: string,
  name: string,
  policyType: PolicyType,
  policyName: string,
  policyContent: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Policy Acceptance Confirmation - Rejection Hero</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Rejection Hero</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #667eea;">Policy Acceptance Confirmation</h2>
        
        <p>Dear ${name},</p>
        
        <p>This email confirms that you have accepted the <strong>${policyName}</strong> for Rejection Hero.</p>
        
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #667eea;">Accepted Policy:</h3>
          <p><strong>${policyName}</strong></p>
          <p><strong>Accepted on:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Policy Type:</strong> ${policyType}</p>
        </div>
        
        <h3 style="color: #667eea;">Policy Content:</h3>
        <div style="background: white; padding: 20px; border-radius: 5px; max-height: 400px; overflow-y: auto; border: 1px solid #ddd;">
          <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5;">${policyContent.substring(0, 5000)}${policyContent.length > 5000 ? "\n\n[... Policy content truncated in email. Full policy available in app ...]" : ""}</pre>
        </div>
        
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
          This email serves as a record of your acceptance. Please keep this email for your records.
        </p>
        
        <p style="color: #666; font-size: 14px;">
          If you have any questions, please contact us at <a href="mailto:support@rejectionhero.com" style="color: #667eea;">support@rejectionhero.com</a>
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Best regards,<br>
          The Rejection Hero Team
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    // Try Resend first
    await sendEmail({
      to: email,
      subject: `Policy Acceptance Confirmation: ${policyName}`,
      html,
    });
  } catch (error) {
    console.error("Resend email failed, trying GoHighLevel:", error);
    // Fallback to GoHighLevel if Resend fails
    try {
      const contactResult = await createOrUpdateContact({
        email,
        name,
        tags: ["policy-acceptance", policyType],
      });
      
      if (contactResult.success && contactResult.contactId) {
        await sendGoHighLevelEmail(
          contactResult.contactId,
          `Policy Acceptance Confirmation: ${policyName}`,
          html,
          "legal@rejectionhero.com"
        );
      }
    } catch (ghlError) {
      console.error("GoHighLevel email also failed:", ghlError);
      // Don't throw - email is best effort
    }
  }
}

export default policiesRouter;

