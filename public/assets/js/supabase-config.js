import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/**
 * إعدادات التخزين السحابي — Supabase Storage
 * Project ID: dzzgcqiovfykjpdwakgq
 * Bucket: "Members Images"
 */

export const SUPABASE_URL = "https://dzzgcqiovfykjpdwakgq.supabase.co";

// ضع هنا مفتاح anon / public key الخاص بمشروعك من لوحة تحكم Supabase:
// Project Settings -> API -> Project API keys -> "anon public"
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6emdjcWlvdmZ5a2pwZHdha2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwOTc2NDgsImV4cCI6MjEwNTY3MzY0OH0.oHjFJ8DgYrGTesHWxveCX0Yj0khuHJUeTyHghwqwSIQ";

export const BUCKET_NAME = "Members Images";

export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * التحقق من حجم الصورة (أقل من أو يساوي 5 ميجابايت)
 */
export function validatePhotoSize(fileOrBlob) {
    if (!fileOrBlob) return true;
    return fileOrBlob.size <= MAX_PHOTO_SIZE_BYTES;
}

/**
 * رفع صورة العضو إلى مجلد Members Images في Supabase
 * يدعم كلاً من File (من input[type=file]) و Blob (من Cropper.js)
 *
 * @param {File|Blob} fileOrBlob ملف الصورة أو Blob المقتص
 * @param {string} serialNumber الرقم التسلسلي للعضو
 * @returns {Promise<string>} الرابط المباشر للصورة
 */
export async function uploadMemberPhoto(fileOrBlob, serialNumber) {
    if (!fileOrBlob) return "";

    if (!validatePhotoSize(fileOrBlob)) {
        throw new Error("PHOTO_TOO_LARGE");
    }

    if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")) {
        throw new Error("SUPABASE_KEY_MISSING");
    }

    // Derive file extension: prefer File.name, fall back to MIME type map
    let extension = "";
    if (fileOrBlob.name) {
        extension = fileOrBlob.name.split(".").pop().toLowerCase();
    }
    if (!extension) {
        const mimeMap = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
            "image/gif": "gif"
        };
        extension = mimeMap[fileOrBlob.type] || "jpg";
    }

    const contentType = fileOrBlob.type || "image/jpeg";
    const cleanSerial = String(serialNumber).trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    const filePath = `members/${cleanSerial}-${Date.now()}.${extension}`;

    console.log(
        `[Supabase Upload] Starting upload…\n` +
        `  Bucket : "${BUCKET_NAME}"\n` +
        `  Path   : "${filePath}"\n` +
        `  Size   : ${(fileOrBlob.size / 1024).toFixed(1)} KB\n` +
        `  Type   : ${contentType}\n` +
        `  Source  : ${fileOrBlob.name ? "File" : "Blob (cropped)"}`
    );

    // رفع الملف مع تفعيل upsert
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileOrBlob, {
            upsert: true,
            cacheControl: "3600",
            contentType: contentType
        });

    if (error) {
        console.error(
            `[Supabase Upload] ❌ FAILED\n` +
            `  message    : ${error.message}\n` +
            `  statusCode : ${error.statusCode || "N/A"}\n` +
            `  error      : ${error.error || "N/A"}\n` +
            `  Full error :`, error
        );
        throw error;
    }

    console.log("[Supabase Upload] ✅ Success:", data?.path || filePath);

    // الحصول على الرابط العام المباشر للصورة
    const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    return urlData?.publicUrl || "";
}
