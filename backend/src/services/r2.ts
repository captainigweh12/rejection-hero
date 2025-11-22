import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../env";

/**
 * R2 Client Configuration
 * Cloudflare R2 is S3-compatible, so we use AWS SDK
 */
const r2Endpoint = process.env.R2_ENDPOINT || env.R2_ENDPOINT;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID || env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || env.R2_SECRET_ACCESS_KEY;
const r2Bucket = process.env.R2_BUCKET || env.R2_BUCKET;

// Log configuration status (without exposing secrets)
console.log("🔧 [R2] Configuration check:");
console.log(`  R2_ENDPOINT: ${r2Endpoint ? "✅ Set" : "❌ Missing"}`);
console.log(`  R2_ACCESS_KEY_ID: ${r2AccessKeyId ? "✅ Set" : "❌ Missing"}`);
console.log(`  R2_SECRET_ACCESS_KEY: ${r2SecretAccessKey ? "✅ Set" : "❌ Missing"}`);
console.log(`  R2_BUCKET: ${r2Bucket ? `✅ ${r2Bucket}` : "❌ Missing"}`);

export const r2 = new S3Client({
  region: "auto",
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: r2AccessKeyId || "",
    secretAccessKey: r2SecretAccessKey || "",
  },
});

export const R2_BUCKET = r2Bucket || "";
export const R2_PUBLIC_BASE_URL = env.STORAGE_URL || "https://storage.rejectionhero.com";

/**
 * Upload a file buffer to R2
 * @param buffer - File buffer to upload
 * @param key - R2 object key (path in bucket)
 * @param contentType - MIME type of the file
 * @returns Public URL to access the file
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  if (!R2_BUCKET) {
    console.error("❌ [R2] R2_BUCKET is not configured");
    throw new Error("R2_BUCKET is not configured. Please set R2_BUCKET environment variable.");
  }

  if (!r2AccessKeyId || !r2SecretAccessKey) {
    console.error("❌ [R2] R2 credentials are not configured");
    throw new Error("R2 credentials are not configured. Please set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.");
  }

  try {
    console.log(`📤 [R2] Uploading to bucket: ${R2_BUCKET}, key: ${key}, size: ${(buffer.length / 1024).toFixed(2)} KB`);
    
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    const publicUrl = `${R2_PUBLIC_BASE_URL}/${key}`;
    console.log(`✅ [R2] File uploaded successfully: ${key}`);
    console.log(`🌐 [R2] Public URL: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("❌ [R2] Upload failed:", error);
    if (error instanceof Error) {
      console.error("❌ [R2] Error details:", error.message);
      console.error("❌ [R2] Error stack:", error.stack);
    }
    throw new Error(`Failed to upload to R2: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

