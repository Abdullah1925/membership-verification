import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/**
 * إعدادات التخزين السحابي — Supabase Storage
 * Project ID: dzzgcqiovfykjpdwakgq
 * Bucket: "Members Images"
 */

export const SUPABASE_URL = "https://dzzgcqiovfykjpdwakgq.supabase.co";

// ضع هنا مفتاح anon / public key الخاص بمشروعك من لوحة تحكم Supabase:
// Project Settings -> API -> Project API keys -> "anon public"
export const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

export const BUCKET_NAME = "Members Images";

export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * التحقق من حجم الصورة (أقل من أو يساوي 5 ميجابايت)
 */
export function validatePhotoSize(file) {
    if (!file) return true;
    return file.size <= MAX_PHOTO_SIZE_BYTES;
}

/**
 * رفع صورة العضو إلى مجلد Members Images في Supabase
 * @param {File} file ملف الصورة المرفوع
 * @param {string} serialNumber الرقم التسلسلي للعضو
 * @returns {Promise<string>} الرابط المباشر للصورة
 */
export async function uploadMemberPhoto(file, serialNumber) {
    if (!file) return "";

    if (!validatePhotoSize(file)) {
        throw new Error("PHOTO_TOO_LARGE");
    }

    if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY") {
        throw new Error("SUPABASE_KEY_MISSING");
    }

    // استخراج امتداد الملف (jpg, png, webp, etc.)
    const extension = file.name.split(".").pop().toLowerCase() || "jpg";
    const cleanSerial = String(serialNumber).trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    const filePath = `members/${cleanSerial}-${Date.now()}.${extension}`;

    // رفع الملف مع تفعيل upsert
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            upsert: true,
            cacheControl: "3600",
            contentType: file.type || "image/jpeg"
        });

    if (error) {
        console.error("Supabase Storage upload error:", error);
        throw error;
    }

    // الحصول على الرابط العام المباشر للصورة
    const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    return urlData?.publicUrl || "";
}
