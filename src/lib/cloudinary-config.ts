/**
 * @fileOverview Konfigurasi Cloudinary Desa Digital.
 * Tersinkronisasi dengan variabel environment (.env).
 */

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || "mxgoux9z";
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "webdesa";
const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY || "768774742966241";

export const CLOUDINARY_CONFIG = {
  cloudName,
  uploadPreset,
  apiKey,
  baseUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
};

/**
 * Utilitas untuk mengoptimalkan URL Cloudinary secara otomatis.
 */
export const getOptimizedCloudinaryUrl = (url: string) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", "/upload/f_auto,q_auto/");
};
