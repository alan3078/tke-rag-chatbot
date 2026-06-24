import { randomBytes, pbkdf2Sync } from "crypto";

const ITERATIONS = 100_000;
const KEY_LEN = 64; // bytes → 128 hex chars
const DIGEST = "sha256";

export function generateSalt(): string {
  return randomBytes(32).toString("hex");
}

export function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString("hex");
}

export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const hash = hashPassword(password, salt);
  // Constant-time comparison to prevent timing attacks
  if (hash.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) {
    diff |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
}
