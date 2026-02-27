# Referral Loop Design

**Date:** 2026-02-27
**Status:** Approved

## Overview

A config-toggled referral system that gives each signup a unique shareable link. Sharing the link moves the referrer up the waitlist queue. Position is shown immediately after signup and persists via the referral link, which doubles as a passwordless dashboard.

## Mechanic

Queue position is the incentive. Each confirmed referral improves the referrer's rank. Position is computed dynamically at read time so it always reflects the true current state of the queue — not an approximation.

Operators enable the feature via `site/config.yaml`. The default operator experience (position-based queue) works out of the box; operators can override messaging to suit their own mechanic.

## Data Model

Four new fields on `SignupRecord`:

| Field | Type | Notes |
|-------|------|-------|
| `referralCode` | string | Cryptographically random short code. Bearer token — possession proves identity. |
| `referredBy` | string \| null | `referralCode` of the person whose link was clicked at signup. |
| `referralCount` | number | Denormalized counter. Atomically incremented when a referral is confirmed. |
| `referralScore` | number | **DynamoDB only.** `referralCount × 1_000_000 + (EPOCH_MAX − signedUpAtUnix)`. Higher = better rank. Used as GSI sort key. |

## Position Computation

Both backends compute accurate dynamic rank — no approximations.

**Postgres:**
```sql
SELECT COUNT(*) + 1 FROM signups
WHERE referral_count > $1
   OR (referral_count = $1 AND signed_up_at < $2)
```
Requires a composite index on `(referral_count DESC, signed_up_at ASC)`.

**DynamoDB:**
A `ReferralScoreIndex` GSI with:
- Partition key: static constant `WAITLIST`
- Sort key: `referralScore`

Position = `Query(pk=WAITLIST, referralScore > myScore, Select=COUNT) + 1`.

A single indexed query — no scan. Hot partition write load is negligible at waitlist scale (far below DynamoDB's per-partition limit even for viral launches).

## User Journeys

### New signup (no referral link)
1. User submits email
2. Backend creates signup record with a generated `referralCode`, `referralCount=0`, `referredBy=null`
3. Position computed, dashboard shown on page: position number, referral count, referral link, copy + social share buttons
4. Welcome email sent with position and referral link

### New signup via referral link (`?ref=abc123`)
1. `ref` param captured from URL on page load and held in client state
2. User submits email; `referredBy` sent in POST body
3. Backend creates signup, then atomically increments referrer's `referralCount` (and recomputes `referralScore` for DynamoDB)
4. Dashboard shown to the new signup; referrer's position silently improves

### Returning user re-submits email
- Backend recognises the email, **does not return referral code or position to the client**
- Page shows: "We've re-sent your dashboard link to your inbox."
- Link is emailed to the address — only someone with inbox access can retrieve it
- Nothing is revealed on screen; a bad actor who knows someone's email learns nothing

### Returning user visits their referral link
- Page loads with `?ref=abc123`
- `SignupForm` calls `GET /position?ref=<code>` on mount
- Valid code → dashboard shown immediately, form not shown
- Invalid code → signup form shown (ref param still captured for attribution if they sign up)

## Security

- `referralCode` is cryptographically random (same generator as verification tokens). It is a bearer token: possessing the link is sufficient to view the dashboard.
- Re-submitting an existing email never exposes the dashboard on screen. The server response for a known email is identical in shape to a normal success — only the email delivery path differs.
- Rate-limiting the re-send email is out of scope for v1 but noted as a follow-up.

## New API Surface

### `GET /position?ref=<code>`
Returns the dashboard data for a referral code.

**Response:**
```json
{ "position": 42, "referralCount": 7, "referralCode": "abc123" }
```

**Errors:**
- Invalid token format → `404`
- Code not found → `404`

### `POST /signup` (updated)
Accepts optional `referredBy` in request body. On duplicate email: sends re-send email, returns same 200 shape with no referral data in body.

## Repository Interface Changes

```typescript
interface SignupRecord {
  // existing fields...
  referralCode?: string;
  referredBy?: string;
  referralCount?: number;
}

interface SignupRepository {
  // existing methods...
  getPosition(referralCode: string): Promise<{ position: number; referralCount: number } | null>;
  incrementReferralCount(referralCode: string): Promise<void>;
}
```

## Frontend Changes

**`SignupForm`:**
- On mount: if `?ref=` param present, call `GET /position`. If valid, render dashboard directly. If not, render form with ref captured.
- On submit: include `referredBy` from captured ref param.
- New dashboard state: position number, referral count, share link with copy button and Twitter/X share intent.
- New re-sent state: "We've re-sent your dashboard link to your inbox."

**`site/config.yaml`:**
```yaml
referral:
  enabled: false
  # Optional overrides (defaults shown):
  # shareMessage: "I just joined the {brandName} waitlist. Join me: {url}"
```

## Email Changes

The welcome email (sent after signup, or after verification if email verification is enabled) gains a new section showing the user's current position and referral link.

If `emailVerification` is also enabled, the referral link and position are included in the verification confirmation email (sent after the user clicks the verify link), not the initial verification request email.

## Infrastructure Changes

**DynamoDB:** New `ReferralScoreIndex` GSI on the existing table:
- Partition key: `waitlistPartition` (STRING, static value `"WAITLIST"`)
- Sort key: `referralScore` (NUMBER)
- Projection: ALL

**CDK:** `api-stack.ts` adds the GSI when `referral.enabled` is true (same pattern as `VerificationTokenIndex`).

**No new AWS services required.**

## Out of Scope (v1)

- Rate limiting on dashboard link re-sends
- Referrer notification when they gain a referral
- Referral leaderboard (public ranking page)
- Fraud / duplicate referral detection beyond email de-duplication
