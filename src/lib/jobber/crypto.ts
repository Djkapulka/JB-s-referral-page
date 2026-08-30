import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

/**
 * AES-256-GCM at-rest encryption for Jobber OAuth tokens. TOKEN_ENCRYPTION_KEY
 * must be set before Jobber is connected — this throws rather than silently
 * storing tokens in plaintext.
 */

function getKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY is missing or too short — required before storing Jobber tokens.",
    );
  }
  return scryptSync(secret, "jbs-referral-jobber-tokens", 32);
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(
    ".",
  );
}

export function decryptToken(payload: string): string {
  const key = getKey();
  const [ivB64, authTagB64, dataB64] = payload.split(".");
  if (!ivB64 || !authTagB64 || !dataB64) {
    throw new Error("Malformed encrypted token payload.");
  }
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
