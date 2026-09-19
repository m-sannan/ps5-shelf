import { createHash, randomBytes, randomInt } from "node:crypto";

export function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function newId(prefix: string) {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export function newPublicId() {
  return randomBytes(8).toString("hex");
}

export function isPublicId(value: string) {
  return /^[A-Za-z0-9_-]{6,32}$/.test(value);
}

export function newPairingCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}
