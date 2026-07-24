# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes, plus project-specific context below.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.
/btw
## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# Project: Room Rental Website (Bhutan)

## What this is
A website for people in Bhutan to find rooms/flats to rent, and for room owners to post listings — replacing the current Facebook/TikTok posting habit with a searchable, filterable list. Personal project, not monetized yet.

## Tech stack
- **Framework:** Next.js (App Router), TypeScript
- **UI:** shadcn/ui + Tailwind CSS — aim for a clean, modern, Apple-like feel (generous whitespace, restrained color palette, no default/templated look)
- **Database:** Supabase (Postgres) — stores all room listing data
- **Image storage:** Cloudinary — stores and serves uploaded room images (NOT Supabase Storage)
- **Hosting:** Vercel
- **Auth:** Supabase Auth (email OTP) for vendors who want to post a room. Renters can browse without an account.

## Current scope (MVP)
1. Browse page — list of room listings
2. Filters — location (text match) and room type (studio / 1BHK / 2BHK)
3. Room detail page — images, price, location, description, contact info
4. "Post a room" page — public form, no auth, writes directly to Supabase, uploads images to Cloudinary
5. Nothing else. No payments, no subscriptions, no messaging, no user accounts.
6. Admin/moderation dashboard


## Explicitly out of scope for now
- Vendor subscription tiers or payments
- Video uploads (images only)

## Data model (rooms table)
- `id`
- `location` (text)
- `room_type` (enum: studio, 1bhk, 2bhk)
- `price` (number, Nu./month)
- `description` (text)
- `images` (array of Cloudinary URLs)
- `contact_name` (text, placeholder for future user_id)
- `contact_phone` (text)
- `created_at`
 
## Auth notes
Vendor posts a room only after signing in (Supabase Auth). Store `user_id` on each room row and add row-level security so vendors can only edit/delete their own listings. Renters need no account to browse or view listings.