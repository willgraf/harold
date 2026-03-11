import { randomBytes } from "crypto";

export function generateVerificationToken(): string {
  return randomBytes(32).toString("base64url");
}

export function calculateTokenExpiry(hoursFromNow: number): string {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hoursFromNow);
  return expiry.toISOString();
}
