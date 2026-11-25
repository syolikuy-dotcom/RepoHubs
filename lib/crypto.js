import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET belum diset atau kurang dari 32 karakter.");
  }
  return createHash("sha256").update(secret).digest();
}

/** Enkripsi objek -> string base64url (AES-256-GCM, iv + tag + ciphertext). */
export function seal(obj, ttlSeconds) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const payload = JSON.stringify({ d: obj, exp: Date.now() + ttlSeconds * 1000 });
  const enc = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64url");
}

/** Dekripsi + validasi expiry. Return null kalau rusak/kadaluarsa. */
export function unseal(str) {
  try {
    const buf = Buffer.from(str, "base64url");
    if (buf.length < 29) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    const out = Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]);
    const { d, exp } = JSON.parse(out.toString("utf8"));
    return exp > Date.now() ? d : null;
  } catch {
    return null;
  }
}
