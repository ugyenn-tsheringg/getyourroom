# DATA_MODEL.md — Room Rental Website

## Supabase table: `rooms`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid, primary key | auto-generated |
| `district` | text | select-only from fixed list — used as a filter |
| `place` | text | select-only from fixed list (dependent on district) — used as a filter |
| `room_type` | text (enum-like: `studio`, `1bhk`, `2bhk`) | used as a filter |
| `price` | integer | monthly rent in Nu. — used for price range filter |
| `description` | text | free text |
| `amenities` | text or text[] | e.g., "Wi-Fi, Parking, Water 24/7" — simplest: comma-separated text for v1 |
| `images` | text[] | array of Cloudinary image URLs, can be empty (photos optional) |
| `vendor_name` | text | |
| `vendor_whatsapp` | text | number or ID |
| `vendor_phone` | text | |
| `created_at` | timestamp | default `now()` |

## Notes
- No `user_id` yet — no auth. When auth is added later, add `user_id` and replace vendor contact fields with a lookup to a `vendors` table if needed.
- `images` can be an empty array — form allows posting with zero photos.
- Keep `amenities` as a simple comma-separated text field for v1. Don't build a tags/checkbox system yet — that's a v2 nice-to-have, not required now.
- Price filter on the frontend should query `price >= min AND price <= max`.
- **Both `district` and `place` are select-only (dropdown) fields, everywhere — filters and the post form. No free text/typing allowed for either.** `place` options depend on the selected `district` (cascading dropdown).

## Reference data: districts & places (mock, hardcode for now)

Not a database table yet — just a hardcoded object/array in the frontend for v1. Real data can replace this later.

```js
const DISTRICTS_AND_PLACES = {
  "Thimphu": ["Motithang", "Changzamtog", "Babesa", "Olakha", "Chang Gidaphu"],
  "Paro": ["Paro Town", "Bondey", "Woochu"],
  "Punakha": ["Khuruthang", "Punakha Town"],
  "Wangdue Phodrang": ["Bajo Town", "Wangdue Town"],
  "Chukha (Phuentsholing)": ["Phuentsholing Town", "Pasakha"],
  "Samtse": ["Samtse Town", "Gomtu"],
  "Trongsa": ["Trongsa Town"],
  "Bumthang": ["Jakar", "Chamkhar"],
  "Mongar": ["Mongar Town"],
  "Trashigang": ["Trashigang Town", "Rangjung"],
};
```

This gives 10 districts with 2–5 mock places each — enough to build and test the cascading dropdown + filter UI. Expand or correct the list once real vendor data comes in.
