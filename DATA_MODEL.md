# DATA_MODEL.md — Room Rental Website

Last synced: 2026-07-23 @ 371fdda

> Verified against the live Supabase project (`mwthdofvwjnaptvyxbvf`) and the
> TypeScript models in `lib/` (`types.ts`, `rooms.ts`, `saved-searches.ts`).
> There are no migration files in the repo — schema was applied directly to
> the remote project via the Supabase MCP, so the live database is the source
> of truth. All tables below have **row-level security enabled**.

## Supabase table: `rooms`

40 rows live. Primary key `id`. RLS enabled.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` | |
| `district` | text | NOT NULL | select-only from fixed list — used as a filter |
| `place` | text | NOT NULL | select-only from fixed list (dependent on district) — used as a filter |
| `room_type` | text | NOT NULL, CHECK in (`studio`, `1bhk`, `2bhk`, `3bhk`, `4bhk`, `shared`, `house`, `shophouse`, `commercial`) | used as a filter |
| `price` | integer | NOT NULL | monthly rent in Nu. — used for price range filter |
| `description` | text | nullable | free text |
| `amenities` | text | nullable | comma-separated string — now sourced from the post form's **Amenities** checklist (predefined items + custom free-text entries); custom items have commas stripped. Predefined labels map to specific icons on the detail page, custom ones to a tick |
| `utilities` | text | nullable | comma-separated string from the post form's **Utilities** checklist (same predefined-plus-custom model as `amenities`) |
| `furnishing` | text | nullable, CHECK null or in (`unfurnished`, `semi_furnished`, `fully_furnished`) | single choice (radio-style) — furnishing status |
| `landmark` | text | nullable | optional free text — a nearby landmark, shown as "Near to …" on the detail page |
| `images` | text[] | NOT NULL, default `'{}'` | array of Cloudinary image URLs, can be empty |
| `vendor_name` | text | NOT NULL | |
| `vendor_whatsapp` | text | nullable | number or ID |
| `vendor_phone` | text | nullable | |
| `user_id` | uuid | NOT NULL, default `auth.uid()`, FK → `auth.users.id` | owner of the listing |
| `status` | text | NOT NULL, default `'available'`, CHECK in (`available`, `rented`) | |
| `expires_at` | timestamptz | nullable | listing considered unavailable once past this (see `isRoomUnavailable`) |
| `view_count` | integer | NOT NULL, default `0` | incremented via `increment_room_view` RPC; shown only to the owner |
| `latitude` | double precision | nullable | optional map pin |
| `longitude` | double precision | nullable | optional map pin |
| `listing_type` | text | NOT NULL, default `'rental'`, CHECK in (`rental`, `exchange`) | rental vs. room-exchange listing |
| `exchange_want_district` | text | nullable | exchange only — district the poster wants in return |
| `exchange_want_place` | text | nullable | exchange only — area wanted (optional) |
| `exchange_want_room_types` | text[] | NOT NULL, default `'{}'` | exchange only — multi-select of wanted room types (same value set as `room_type`) |
| `exchange_budget_min` | integer | nullable | exchange only |
| `exchange_budget_max` | integer | nullable | exchange only |
| `created_at` | timestamptz | NOT NULL, default `now()` | |

**Relationships:** `user_id` → `auth.users.id`. Referenced by `reports.room_id`
and `saved_listings.room_id` (both FK → `rooms.id`).

**RLS policies:**
- `SELECT` — role `public`, `USING (true)`: anyone (incl. anon) can read every room.
- `INSERT` — `authenticated`, `WITH CHECK (auth.uid() = user_id)`: can only create rooms owned by self.
- `UPDATE` — `authenticated`, `USING`/`WITH CHECK (auth.uid() = user_id)`: own rooms only.
- `DELETE` — `authenticated`, `USING (auth.uid() = user_id)`: own rooms only.
- Admin edit/delete of *any* listing happens through server routes using the
  service-role key, which bypasses RLS (not a policy).

**Exchange fields note:** these were redesigned mid-project. An earlier shape
(`exchange_have` / `exchange_want` text / `exchange_budget` int) was dropped and
replaced by the structured `exchange_want_*` + `exchange_budget_min/max` columns
above. The one real exchange listing was migrated best-effort.

## Supabase table: `profiles`

5 rows live. Primary key `id`. RLS enabled. Holds each vendor's default contact
details, which the post form pre-fills / upserts from the latest listing.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | uuid | PK, FK → `auth.users.id` | one row per auth user |
| `contact_name` | text | nullable | default vendor name |
| `contact_whatsapp` | text | nullable | default WhatsApp |
| `contact_phone` | text | nullable | default phone |
| `created_at` | timestamptz | NOT NULL, default `now()` | |

Rows are created by the `handle_new_user` trigger on signup. There is **no
`is_admin` column** — admin access is env-based (`ADMIN_EMAIL`), not stored here.

**RLS policies** (all `authenticated`, all scoped to `auth.uid() = id`):
- `SELECT` — own profile only.
- `INSERT` — own profile only (`WITH CHECK`).
- `UPDATE` — own profile only (`USING` + `WITH CHECK`).
- No `DELETE` policy.

## Supabase table: `reports`

2 rows live. Primary key `id`. RLS enabled. Abuse reports filed against a listing.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` | |
| `room_id` | uuid | FK → `rooms.id` | listing being reported |
| `reason` | text | NOT NULL, CHECK length 1–1000 | |
| `status` | text | NOT NULL, default `'open'`, CHECK in (`open`, `resolved`) | |
| `created_at` | timestamptz | NOT NULL, default `now()` | |

**RLS policies:**
- `INSERT` — roles `anon` + `authenticated`, `WITH CHECK (status = 'open')`:
  anyone can file a report, but only in the `open` state.
- No `SELECT`, `UPDATE`, or `DELETE` policies exist. With RLS enabled and no read
  policy, anon/authenticated clients get zero rows. Admin reads and resolution
  happen through server routes using the service-role key, which bypasses RLS.

## Supabase table: `saved_listings`

4 rows live. Primary key `id`. RLS enabled (own-rows). A user's saved/favorited
listings.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` | |
| `user_id` | uuid | NOT NULL, default `auth.uid()`, FK → `auth.users.id` | |
| `room_id` | uuid | FK → `rooms.id` | |
| `created_at` | timestamptz | NOT NULL, default `now()` | |

**RLS policies** (all `authenticated`, all scoped to `auth.uid() = user_id`):
- `SELECT` — own saves only.
- `INSERT` — own saves only (`WITH CHECK`).
- `DELETE` — own saves only.
- No `UPDATE` policy (saves are create/delete only).

## Supabase table: `saved_searches`

2 rows live. Primary key `id`. RLS enabled (own-rows). Backs the "Save this
search" alert feature (daily Vercel cron emails new matches).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` | |
| `user_id` | uuid | NOT NULL, default `auth.uid()`, FK → `auth.users.id` | |
| `district` | text | nullable | filter snapshot |
| `place` | text | nullable | filter snapshot |
| `room_type` | text | nullable | filter snapshot — see note below |
| `price_min` | integer | nullable | |
| `price_max` | integer | nullable | |
| `last_notified_at` | timestamptz | NOT NULL, default `now()` | watermark for exactly-once alert dedup |
| `created_at` | timestamptz | NOT NULL, default `now()` | |

**`room_type` has no CHECK constraint — this is intentional.** Unlike
`rooms.room_type`, this column is a *snapshot of the browse filter* the user
saved, not a listing attribute. It is stored loosely (nullable, unconstrained) so
the saved search is decoupled from the `rooms` room-type enum: if that enum's
values ever change, existing saved searches remain valid rather than violating a
constraint. All of `district`, `place`, `room_type`, `price_min`, `price_max` are
nullable for the same reason — a saved search may pin only some filters.

**RLS policies** (all `authenticated`, all scoped to `auth.uid() = user_id`):
- `SELECT` — own searches only.
- `INSERT` — own searches only (`WITH CHECK`).
- `DELETE` — own searches only.
- No `UPDATE` policy. (`last_notified_at` is advanced by the cron job, which runs
  with the service-role key and bypasses RLS.)

## Supabase table: `feedback`

2 rows live. Primary key `id`. RLS enabled (insert-only via public API). Site
feedback form submissions. No user/room relationship.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` | |
| `rating` | integer | NOT NULL, CHECK 1–5 | |
| `name` | text | nullable, CHECK length ≤ 200 | |
| `email` | text | nullable, CHECK length ≤ 320 | |
| `message` | text | NOT NULL, CHECK length 1–2000 | |
| `category` | text | nullable, CHECK in (`bug`, `feature`, `general`) | |
| `created_at` | timestamptz | NOT NULL, default `now()` | |

**RLS policies:**
- `INSERT` — roles `anon` + `authenticated`, `WITH CHECK (true)`: anyone can
  submit feedback.
- No `SELECT`, `UPDATE`, or `DELETE` policies. Admin reads the feedback list
  through server routes using the service-role key, which bypasses RLS.

## Database functions

- `increment_room_view(...)` → `void` — bumps `rooms.view_count`; called publicly
  (SECURITY DEFINER RPC).
- `handle_new_user()` → `trigger` — creates a `profiles` row on new auth user.

## Notes
- **Auth exists.** Vendors sign in (email OTP) to post; each `rooms` row carries
  `user_id` (default `auth.uid()`) with an FK to `auth.users` and own-rows RLS.
  Renters browse without an account. (The earlier "no `user_id` yet" note is
  obsolete.)
- `images` can be an empty array — the form allows posting with zero photos at
  the DB level, though the current post form enforces required photo slots in the
  UI.
- `amenities` and `utilities` are comma-separated text fields, but the post form
  now drives them via **checklists** of predefined items (each with its own icon)
  plus custom free-text entries. `lib/features.ts` holds the predefined
  `UTILITIES`/`AMENITIES` lists, the `featureIcon()` label→icon lookup (custom =
  tick), the `FURNISHING_OPTIONS`, and the parse/serialize helpers. Existing rows'
  amenities keep working — unmatched labels just render with the tick icon.
- Price filter on the frontend queries `price >= min AND price <= max`.
- **Both `district` and `place` are select-only (dropdown/combobox) fields,
  everywhere — filters and the post form. No free text/typing.** `place` options
  depend on the selected `district` (cascading).
- `latitude`/`longitude` are `double precision` (not integer).

## Reference data: districts & places (real data, hardcoded in frontend)

Not a database table — a hardcoded object (`DISTRICTS_AND_PLACES`) in
`lib/districts.ts`. It holds all **20 Bhutanese districts (Dzongkhags)** with
their actual rental areas (source: `bhutan-districts.md` in the project root).
`DISTRICTS` is the derived key list; `ROOM_TYPES` (value/label pairs matching the
`room_type` CHECK constraint) also lives here via `roomTypeLabel()`.

The 20 districts: Thimphu, Paro, Haa, Chukha, Samtse, Punakha, Wangdue Phodrang,
Gasa, Trongsa, Bumthang, Zhemgang, Sarpang, Tsirang, Dagana, Mongar, Lhuentse,
Trashigang, Trashiyangtse, Pemagatshel, Samdrup Jongkhar.

The earlier 10-district mock (`Thimphu`, `Paro`, `Punakha`, `Wangdue Phodrang`,
`Chukha (Phuentsholing)`, `Samtse`, `Trongsa`, `Bumthang`, `Mongar`,
`Trashigang`) has been replaced — see `lib/districts.ts` for the authoritative
current list. Note some pre-real-data listings still store district/place strings
that no longer appear in the current list (e.g. "Trongsa Town",
"Chukha (Phuentsholing)", "Bajo Town"); they display but won't match new filters.
Many of the 40 live rows are also mock/seed listings (~33 owned by the
`test.vendor` account) kept for pagination testing, not real inventory.
