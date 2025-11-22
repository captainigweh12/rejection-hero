import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { type AppType } from "../types";
import { zValidator } from "@hono/zod-validator";
import { uploadImageRequestSchema, type UploadImageResponse } from "@/shared/contracts";
import { uploadToR2 } from "../services/r2";

const uploadRouter = new Hono<AppType>();

// ============================================
// POST /api/upload/image - Upload an image
// ============================================
// Accepts multipart/form-data with "image" field
// Validates file type and size before saving
// Returns URL to access the uploaded image
uploadRouter.post("/image", zValidator("form", uploadImageRequestSchema), async (c) => {
  const { image } = c.req.valid("form");
  console.log("📤 [Upload] Image upload request received");

  try {
    // Check if file exists in request
    if (!image) {
      console.log("❌ [Upload] No image file provided in request");
      return c.json({ error: "No image file provided" }, 400);
    }
    console.log(
      `📄 [Upload] File received: ${image.name} (${image.type}, ${(image.size / 1024).toFixed(2)} KB)`,
    );

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(image.type)) {
      console.log(`❌ [Upload] Invalid file type: ${image.type}`);
      return c.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed" },
        400,
      );
    }
    console.log(`✅ [Upload] File type validated: ${image.type}`);

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (image.size > maxSize) {
      console.log(
        `❌ [Upload] File too large: ${(image.size / 1024 / 1024).toFixed(2)} MB (max: 10 MB)`,
      );
      return c.json({ error: "File too large. Maximum size is 10MB" }, 400);
    }
    console.log(`✅ [Upload] File size validated: ${(image.size / 1024).toFixed(2)} KB`);

    // Generate unique filename for R2
    const fileExtension = image.name.split(".").pop() || "jpg";
    const uniqueFilename = `${randomUUID()}.${fileExtension}`;
    const r2Key = `uploads/${uniqueFilename}`;
    console.log(`🔑 [Upload] Generated unique filename: ${uniqueFilename}`);

    // Convert to buffer
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2 (Cloudflare R2 storage)
    console.log(`📤 [Upload] Uploading to R2: ${r2Key}`);
    const imageUrl = await uploadToR2(buffer, r2Key, image.type);
    console.log(`🎉 [Upload] Upload complete! Image URL: ${imageUrl}`);

    // Return relative path for backward compatibility, but the full URL is what should be used
    const relativePath = imageUrl.replace(/^https?:\/\/[^\/]+/, "");
    return c.json({
      success: true,
      message: "Image uploaded successfully",
      url: relativePath, // Relative path for backward compatibility
      fullUrl: imageUrl, // Full R2 URL (use this in the app)
      filename: uniqueFilename,
    } satisfies UploadImageResponse);
  } catch (error) {
    console.error("💥 [Upload] Upload error:", error);
    console.error(
      "Stack trace:",
      error instanceof Error ? error.stack : "No stack trace available",
    );
    return c.json({ error: "Failed to upload image" }, 500);
  }
});

export { uploadRouter };
