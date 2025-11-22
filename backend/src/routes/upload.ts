import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { type AppType } from "../types";
import { zValidator } from "@hono/zod-validator";
import { uploadImageRequestSchema, type UploadImageResponse } from "@/shared/contracts";
import { uploadToR2 } from "../services/r2";

const uploadRouter = new Hono<AppType>();

// ============================================
// POST /api/upload/image - Upload an image or video
// ============================================
// Accepts multipart/form-data with "file" or "image" field (both supported)
// Validates file type and size before saving
// Uploads to R2 and returns public URL (https://storage.rejectionhero.com/stories/...)
uploadRouter.post("/image", zValidator("form", uploadImageRequestSchema), async (c) => {
  const { file, image } = c.req.valid("form");
  // Support both "file" and "image" field names for backward compatibility
  const uploadedFile = file || image;
  console.log("📤 [Upload] File upload request received");

  try {
    // Check if file exists in request
    if (!uploadedFile) {
      console.log("❌ [Upload] No file provided in request");
      return c.json({ error: "No file provided" }, 400);
    }
    console.log(
      `📄 [Upload] File received: ${uploadedFile.name} (${uploadedFile.type}, ${(uploadedFile.size / 1024).toFixed(2)} KB)`,
    );

    // Validate file type - support both images and videos
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const allowedVideoTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm"];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
    
    if (!allowedTypes.includes(uploadedFile.type)) {
      console.log(`❌ [Upload] Invalid file type: ${uploadedFile.type}`);
      return c.json(
        { error: "Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, MOV, AVI, MKV, WebM) are allowed" },
        400,
      );
    }
    console.log(`✅ [Upload] File type validated: ${uploadedFile.type}`);

    // Validate file size (50MB limit for videos, 10MB for images)
    const isVideo = allowedVideoTypes.includes(uploadedFile.type);
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for videos, 10MB for images
    if (uploadedFile.size > maxSize) {
      console.log(
        `❌ [Upload] File too large: ${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB (max: ${maxSize / 1024 / 1024} MB)`,
      );
      return c.json({ error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` }, 400);
    }
    console.log(`✅ [Upload] File size validated: ${(uploadedFile.size / 1024).toFixed(2)} KB`);

    // Generate unique filename for R2
    const fileExtension = uploadedFile.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
    const uniqueFilename = `${randomUUID()}.${fileExtension}`;
    // Use "stories" folder for story uploads, "uploads" for general uploads
    const r2Key = `stories/${uniqueFilename}`;
    console.log(`🔑 [Upload] Generated unique filename: ${uniqueFilename}`);

    // Convert to buffer
    const arrayBuffer = await uploadedFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2 (Cloudflare R2 storage)
    console.log(`📤 [Upload] Uploading to R2: ${r2Key}`);
    const fileUrl = await uploadToR2(buffer, r2Key, uploadedFile.type);
    console.log(`🎉 [Upload] Upload complete! File URL: ${fileUrl}`);

    // Return relative path for backward compatibility, but the full URL is what should be used
    const relativePath = fileUrl.replace(/^https?:\/\/[^\/]+/, "");
    return c.json({
      success: true,
      message: "File uploaded successfully",
      url: relativePath, // Relative path for backward compatibility
      fullUrl: fileUrl, // Full R2 URL (use this in the app)
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
