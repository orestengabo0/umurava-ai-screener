import { v2 as cloudinary } from "cloudinary";

let configured = false;

export function configureCloudinary(): void {
  if (configured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Missing Cloudinary env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  configured = true;
}

export async function uploadPdfBuffer(params: {
  buffer: Buffer;
  folder: string;
  filename: string;
}): Promise<{ publicId: string; url: string }> {
  configureCloudinary();

  const { buffer, folder, filename } = params;

  return await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        type: "upload",
        format: "pdf",
        folder,
        filename_override: filename,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          publicId: result.public_id,
          url: result.secure_url,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

export async function deleteRawAsset(publicId: string): Promise<void> {
  configureCloudinary();

  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
}
