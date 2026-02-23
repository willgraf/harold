import { generateVerificationToken, calculateTokenExpiry } from "../tokenUtils";

describe("generateVerificationToken", () => {
  it("returns a 43-character base64url string", () => {
    const token = generateVerificationToken();
    expect(token).toHaveLength(43);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("generates unique tokens", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateVerificationToken()));
    expect(tokens.size).toBe(100);
  });
});

describe("calculateTokenExpiry", () => {
  it("returns an ISO string in the future", () => {
    const before = Date.now();
    const expiry = calculateTokenExpiry(24);
    const expiryMs = new Date(expiry).getTime();

    expect(expiryMs).toBeGreaterThan(before);
    expect(expiryMs).toBeLessThanOrEqual(before + 24 * 60 * 60 * 1000 + 1000);
  });

  it("respects the hours parameter", () => {
    const now = Date.now();
    const expiry1h = new Date(calculateTokenExpiry(1)).getTime();
    const expiry48h = new Date(calculateTokenExpiry(48)).getTime();

    expect(expiry1h - now).toBeLessThanOrEqual(1 * 60 * 60 * 1000 + 1000);
    expect(expiry48h - now).toBeGreaterThan(47 * 60 * 60 * 1000);
  });
});
