import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./_core/password";

describe("password hashing", () => {
  it("hashes and verifies a correct password", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).toMatch(/^scrypt\$/);
    expect(await verifyPassword("secret123", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("uses a random salt (same password → different hashes)", async () => {
    const a = await hashPassword("samePass");
    const b = await hashPassword("samePass");
    expect(a).not.toBe(b);
    expect(await verifyPassword("samePass", a)).toBe(true);
    expect(await verifyPassword("samePass", b)).toBe(true);
  });

  it("returns false for empty or malformed stored hashes", async () => {
    expect(await verifyPassword("x", null)).toBe(false);
    expect(await verifyPassword("x", undefined)).toBe(false);
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "not-a-valid-hash")).toBe(false);
  });
});
