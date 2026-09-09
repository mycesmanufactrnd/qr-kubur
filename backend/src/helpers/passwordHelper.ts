import bcrypt from "bcrypt";
import crypto from "crypto";

const BCRYPT_ROUNDS = 12;

// Pre-bcrypt accounts were hashed with unsalted SHA-256. Kept only so
// verifyPassword can still recognize those old hashes during the
// migrate-on-login upgrade in authRouter.
function legacySha256(plainPassword: string): string {
  return crypto.createHash("sha256").update(plainPassword).digest("hex");
}

export function isBcryptHash(value: string): boolean {
  return /^\$2[aby]?\$/.test(value);
}

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plainPassword: string,
  storedHash: string,
): Promise<boolean> {
  if (isBcryptHash(storedHash)) {
    return bcrypt.compare(plainPassword, storedHash);
  }
  return legacySha256(plainPassword) === storedHash;
}
