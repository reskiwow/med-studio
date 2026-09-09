import { z } from "zod";

export const audioProcessingSettingsSchema = z.object({
  speed: z.number().min(0.5).max(4),
  amplifyDb: z.number().min(-24).max(24),
  maxDurationSecs: z.number().int().min(1).max(600),
});

export const DEFAULT_PRESET = {
  speed: 2.3,
  amplifyDb: -4,
  maxDurationSecs: 350,
};

export const robloxConnectionSchema = z.discriminatedUnion("targetType", [
  z.object({
    targetType: z.literal("CREATOR"),
    robloxUserId: z.string().regex(/^\d+$/, "Roblox User ID harus berupa angka saja."),
    apiKey: z.string().min(10, "API Key terlalu pendek (minimal 10 karakter). Pastikan kamu copy key lengkap dari Roblox Creator Dashboard.").max(512),
  }),
  z.object({
    targetType: z.literal("GROUP"),
    robloxGroupId: z.string().regex(/^\d+$/, "Roblox Group ID harus berupa angka saja."),
    apiKey: z.string().min(10, "API Key terlalu pendek (minimal 10 karakter). Pastikan kamu copy key lengkap dari Roblox Creator Dashboard.").max(512),
  }),
]);

export const ALLOWED_AUDIO_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
]);

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

export function validateAudioFile(file: { type: string; size: number }) {
  const errors: string[] = [];
  if (!ALLOWED_AUDIO_MIME_TYPES.has(file.type)) {
    errors.push("Format file tidak didukung. Gunakan MP3, WAV, M4A, atau OGG.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    errors.push(`Ukuran file melebihi batas ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`);
  }
  return errors;
}
