/**
 * Keyword guard that runs BEFORE the AI sees a recovery-mode message.
 * If any of these patterns match, we bypass the model entirely and return
 * a fixed, safety-first referral. We don't try to be clever with severe
 * symptoms — that's how people get hurt.
 */

const RED_FLAG_PATTERNS: RegExp[] = [
  /\b(sharp|stabbing|shooting)\s*pain/i,
  /\bnumbness|\bnumb\b/i,
  /\btingling\b/i,
  /\bswollen\b|\bswelling\b/i,
  /\bpopped\b|\bpopping\s*sound/i,
  /\btear|\btorn\b/i,
  /can'?t\s*(walk|stand|put\s*weight|move)/i,
  /\bgive\s*way\b|\bgave\s*way\b/i,
  /\bsevere\b/i,
  /\bbruis(ed|ing)\b/i,
  /\bvisible\s*deformity/i,
  /\bcrunching\s*sound/i,
];

export function hasRedFlag(text: string): boolean {
  return RED_FLAG_PATTERNS.some((rx) => rx.test(text));
}

/** Fixed reply for red-flag matches — no AI involvement. */
export const RED_FLAG_RESPONSE = `### Stop here — this isn't routine soreness

What you're describing — **sharp pain, swelling, numbness, or anything that popped** — isn't normal post-activity tightness. Self-treating could make it worse.

### What to do

1. **Stop training** on that body part until you've had it looked at.
2. **See a sports physio or your GP** today if possible, tomorrow at the latest.
3. While waiting: ice the area, keep it elevated, avoid stretching it.

I can suggest stretches once a professional has cleared the area. I'm not a doctor — please get this checked.`;
