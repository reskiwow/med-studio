import { createCipheriv, createDecipheriv, randomBytes, createHash, scryptSync } from "crypto";

/**
 * Credential-at-rest encryption.
 *
 * SESSION_SECRET is used to derive a stable 32-byte key via scrypt. In
 * production, prefer a dedicated CREDENTIAL_ENCRYPTION_KEY env var so
 * rotating the session secret doesn't also rotate stored credentials.
 */
function getKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return scryptSync(secret, "med-studio-credential-salt", 32);
}

export function encryptCredential(plaintext: string): string {
  const iv = randomBytes(12);
  const key = getKey();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: base64(iv).base64(authTag).base64(ciphertext)
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptCredential(stored: string): string {
  const [ivB64, tagB64, dataB64] = stored.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed stored credential");
  }
  const key = getKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/** Never render full credentials in any API response. */
export function maskCredential(plaintext: string): string {
  const last4 = plaintext.slice(-4);
  return `••••••••${last4}`;
}

export function last4(plaintext: string): string {
  return plaintext.slice(-4);
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
