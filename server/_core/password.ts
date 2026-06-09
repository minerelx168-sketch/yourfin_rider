import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const KEY_LEN = 64;
const SALT_LEN = 16;
const PREFIX = "scrypt";

/**
 * Hash a plaintext password using scrypt (built into Node — no extra deps).
 * Output format: `scrypt$<saltHex>$<hashHex>`
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN).toString("hex");
  const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  return `${PREFIX}$${salt}$${derived.toString("hex")}`;
}

/**
 * Verify a plaintext password against a stored `scrypt$salt$hash` string.
 * Uses a constant-time comparison to avoid timing attacks.
 */
export async function verifyPassword(
  password: string,
  stored: string | null | undefined
): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== PREFIX) return false;

  const [, salt, hashHex] = parts;
  const expected = Buffer.from(hashHex, "hex");
  const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;

  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}
