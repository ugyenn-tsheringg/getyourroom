# PRD.md — Room Rental Website (Bhutan)

_Last synced: 2026-07-23 @ e8642f3_

> This doc has been reconciled against the live code. Each feature is tagged
> **done** / **partial** / **stubbed** / **not built**. Where the original plan
> changed during build (most notably: posting a room now requires a free
> sign-in), the change is called out inline. Database schema lives in
> `DATA_MODEL.md`, not here.

## Purpose
Let people in Bhutan search for rooms to rent with real filters (district, place, room type, price) — replacing unstructured Facebook/TikTok posts. Let room owners (vendors) post a listing with photos, details, and contact info.

**Correction vs. original plan:** posting a room now requires a free one-time
sign-in (email code). Browsing, filtering, and viewing listings still need no
account. See _Auth & accounts_ below. The site also now supports **room
exchange** listings (swap your room for someone else's), not just rentals.

## Users
- **Renter** — browses listings, filters, views a listing, contacts the vendor directly via WhatsApp/phone. No account needed to browse. _(Signing in unlocks saving listings and saving searches — optional.)_
- **Vendor** — posts a room listing. **Now requires a free sign-in** (was "no account needed" in the original plan). Manages their own listings (edit, mark rented, delete).
- **Admin** — a single operator (matched by email) who reviews reported listings, can edit/delete any listing, and reads feedback. Not in the original plan; added with the moderation tooling. **State: done.**

## Auth & accounts _(new section — not in original plan)_
- **State: done.**
- Sign-in is **email one-time code (OTP)** via Supabase Auth — enter email, receive an 8-digit code, verify. New accounts are created automatically on first sign-in. No passwords. (No phone OTP despite the original stack note.)
- Required for: posting a room, editing/managing your listings, saving rooms, saving searches, admin.
- Not required for: browsing, filtering, viewing a listing, contacting a vendor, leaving feedback.
- Route: `/login` (accepts `?next=` to return the user where they came from).

## Pages

### 1. Browse page (home) — **State: done**
Route: `/`
- Grid of room cards (thumbnail, price, room type, place, district) with a save (heart) button on each card.
- Hero banner at top; filters sit in a raised card below it.
- Filters:
  - District (searchable dropdown — select only, no free typing) — **done**
  - Place / area (searchable dropdown, options depend on selected district) — **done**
  - Room type — **done**, but now **9 types**, not 3: Studio/1 RK, 1 BHK, 2 BHK, 3 BHK, 4+ BHK, Shared Room, Independent House, Shophouse, Commercial Space.
  - Price range (min–max, Nu.) — **done**
  - **Listing kind** (All / Exchange only / Rentals only) — **done** (added with exchange feature; not in original plan).
- **Pagination** — 15 listings per page, page state in the URL. **Done** (not in original plan).
- **Save this search** — button on results; saves current filters for email alerts. **Done** (not in original plan). Prompts sign-in if signed out.
- Loading skeletons, empty state with "Clear filters", and an error state. **Done.**
- Browse results **exclude** rooms marked rented and listings past their expiry date.
- Clicking a card opens the listing detail page. **Done.**

### 2. Listing detail page — **State: done**
Route: `/rooms/[id]`
- Image gallery/carousel of all uploaded photos (with counter; graceful "no photos" state). **Done.**
- Price, room type, district, place. **Done.**
- Description. **Done.**
- Utilities & Amenities — two icon checklists of predefined items plus custom free-text entries, shown together as a "What's included" icon + label grid (predefined = specific icon, custom = tick). **Done.** (Superseded the earlier comma-separated tag/badge rendering.)
- Furnishing status — Unfurnished / Semi-furnished / Fully Furnished, shown as a badge. **Done.**
- Landmark — optional "Near to …" line shown right after the map / location section. **Done.**
- Vendor contact section: name, WhatsApp button (`wa.me`), call button (`tel:`). Bhutan 8-digit numbers get the `975` country code automatically. **Done.** (WhatsApp _and_ phone are each optional individually; at least one is required at post time.)
- **Map** — embedded Google Map + "Open in Google Maps", shown only when the listing has a pinned location (lat/lng). **Done** (partial location feature; see note in _Out of scope_).
- **Exchange section** — for exchange listings, a "Looking for in return" block (wanted district/place, room types, budget). **Done** (not in original plan).
- **Save (heart) button** over the gallery. **Done.**
- **Report listing** dialog for renters to flag a listing. **Done.**
- **View count** — shown to the listing owner only; incremented once per visit via an RPC. **Done** (not in original plan).
- "This room is no longer available" banner for rented/expired listings. **Done.**

### 3. Post a room page — **State: done (materially expanded)**
Route: `/post` — **now behind sign-in** (redirects to `/login?next=/post`).
Uses the shared room form (also used for editing).
- **Correction:** the original plan said "public form, no login." Posting now
  requires a signed-in account.
- Listing type toggle: **Renting out a room** vs **Looking to exchange**. **Done** (not in original plan).
- Photos — **5 fixed, labeled slots**: Bedroom, Kitchen, Bathroom (required), Hall, One more (optional). Each photo is uploaded to Cloudinary immediately and **automatically screened for explicit content (Sightengine)** before it's accepted. **Done** (original plan: "photos optional, multiple" — now min 3 required, capped at 5, and moderated).
- Room type (9 options, see Browse). **Done.**
- District + Area (dependent searchable dropdowns). **Done.**
- Rent (price, Nu./month). **Done.**
- Description. **Done.**
- **Utilities** and **Amenities** — checkbox grids of predefined items (each with its own icon) plus an "add your own" free-text entry. **Done.**
- **Furnishing status** — single choice: Unfurnished / Semi-furnished / Fully Furnished. **Done.**
- **Landmark** — optional "Near to …" free text. **Done.**
- **Listing expiry** — optional: auto-hide after 30/60/90 days, or no expiry. **Done** (not in original plan).
- **Location picker** — optional map pin (lat/lng). **Done** (not in original plan).
- Exchange sub-fields (only when "Looking to exchange"): wanted district (required), wanted area, wanted room types (multi-select), budget min–max. **Done.**
- Contact: name (required), WhatsApp and/or phone (at least one required). Contact details are saved to the user's profile and **prefilled** on the next post. **Done.**
- Per-field validation with scroll-to-first-error. **Done.**
- On submit → writes a row to Supabase `rooms` (with `user_id`), images already on Cloudinary; redirects to the new listing. **Done.**

### 4. Edit listing — **State: done** _(new)_
Route: `/rooms/[id]/edit`. Same form as posting, pre-filled. Owners edit via RLS; the admin edits anyone's listing through a privileged API route.
- Note: the bedroom/kitchen/bathroom photo-required validation **also applies on edit**, so older listings with fewer than those three photos can't be saved without adding them.

### 5. My listings — **State: done** _(new)_
Route: `/my-listings` (signed-in). Lists the user's own rooms (including rented/expired) with status badges; actions: mark rented/available, edit, delete (with confirm dialog).

### 6. Saved rooms — **State: done** _(new)_
Route: `/saved` (signed-in). Rooms the user hearted; unsave from here. Unavailable saved rooms are still shown, marked as such.

### 7. Saved searches & email alerts — **State: done** _(new)_
Route: `/saved-searches` (signed-in). Lists saved filter sets with a human-readable summary; delete from here.
- A **daily cron** (`/api/cron/alerts`, `0 11 * * *` = 11:00 UTC / 17:00 Bhutan time via `vercel.json`) finds listings created since each search was last notified and emails the owner via **Resend**. A per-search watermark ensures each match alerts once. **Done.** (Daily cadence is forced by Vercel Hobby's once-per-day cron limit.)
- Prod dependency: the cron only runs if `RESEND_API_KEY` and `CRON_SECRET` are set in the Vercel environment — otherwise saved-search alerts don't fire in production.
- Note: saved searches capture district/place/room type/price — **not** the rental-vs-exchange kind.

### 8. Admin — **State: done** _(new)_
Route: `/admin`. Access limited to the single `ADMIN_EMAIL`; enforced server-side on the `/api/admin/*` routes and reflected in the nav. Three tabs:
- **Reports** — listings flagged by visitors; dismiss a report or delete the listing.
- **Listings** — every listing (incl. rented/expired), searchable by id; edit or delete any.
- **Feedback** — average rating + all submitted feedback.

### 9. Feedback — **State: done** _(new)_
Route: `/feedback` (public, linked in the footer). Star rating + message + optional category/name/email; hidden honeypot field for spam. Writes to a `feedback` table.

### 10. Get the app (PWA) — **State: done** _(new)_
Route: `/get-app`. Instructions for "Add to Home Screen" on iOS/Android. The site ships a web app manifest (`/manifest.webmanifest`) and Apple web-app meta tags for a standalone, installable experience. No native app / app store.

## Out of scope (for now)
- ~~Login/accounts for vendors or renters~~ — **now built** for vendors (email OTP; required to post) and optional for renters (saving). Renters can still browse fully without an account.
- Payments or subscriptions — **still out of scope.**
- In-app messaging — **still out of scope**; contact happens via WhatsApp/phone outside the app.
- ~~Admin/moderation panel~~ — **now built** (see Admin above), plus automated explicit-image screening on upload.
- **Map view** — **partial.** Per-listing map embed and a location picker exist; a browse-level map view (rooms plotted on a map) is **not built.**

## Success criteria for v1
- A vendor can post a listing with photos and all details in a couple of minutes _(now includes a one-time sign-in and required bedroom/kitchen/bathroom photos)_.
- A renter can filter by district + room type + price and find relevant listings. **Met.**
- A renter can view a listing and immediately see how to contact the vendor. **Met.**
