import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const CIPHERTEXT_PREFIX = "enc:v1:";

function getEncryptionKey(): Buffer {
  const secret = process.env.FIELD_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("FIELD_ENCRYPTION_KEY environment variable is not set");
  }
  // Accept a 64-char hex string (32 raw bytes) directly, otherwise derive a
  // 32-byte key from whatever secret was provided.
  return /^[0-9a-fA-F]{64}$/.test(secret)
    ? Buffer.from(secret, "hex")
    : crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a field value for storage at rest (AES-256-GCM, random IV per call).
 * Non-deterministic by design — do not use the encrypted column directly in
 * WHERE clauses. Pair with hashForSearch() for lookups.
 */
export function encryptField(plainText: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return (
    CIPHERTEXT_PREFIX +
    Buffer.concat([iv, authTag, encrypted]).toString("base64")
  );
}

/**
 * Decrypts a value produced by encryptField(). Values that don't match our
 * ciphertext format (legacy plaintext from before encryption was added, or
 * anything unexpected) are returned unchanged rather than throwing, so
 * un-migrated rows don't break reads.
 */
export function decryptField(value: string): string {
  if (!value || !value.startsWith(CIPHERTEXT_PREFIX)) {
    return value;
  }
  try {
    const key = getEncryptionKey();
    const raw = Buffer.from(value.slice(CIPHERTEXT_PREFIX.length), "base64");
    const iv = raw.subarray(0, IV_LENGTH);
    const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return value;
  }
}

/**
 * Deterministic HMAC of a field value, for exact-match search/lookup on an
 * encrypted column (e.g. WHERE icnumberhash = hashForSearch(input)).
 * Not reversible — encryptField/decryptField hold the real value.
 */
export function hashForSearch(value: string): string {
  const key = getEncryptionKey();
  return crypto.createHmac("sha256", key).update(value).digest("hex");
}
