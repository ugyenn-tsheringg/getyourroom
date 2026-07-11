# PRD.md — Room Rental Website (Bhutan)

## Purpose
Let people in Bhutan search for rooms to rent with real filters (district, place, room type, price) — replacing unstructured Facebook/TikTok posts. Let room owners (vendors) post a listing with photos, details, and contact info, with no login required.

## Users
- **Renter** — browses listings, filters, views a listing, contacts the vendor directly via WhatsApp/phone.
- **Vendor** — posts a room listing via a public form. No account needed.

## Pages

### 1. Browse page (home)
- Grid/list of room cards (thumbnail image, price, room type, place, district)
- Filters at top:
  - District (dropdown — select only, no typing)
  - Place / area (dropdown — select only, no typing; options depend on selected district)
  - Room type (studio / 1BHK / 2BHK)
  - Price range (min–max)
- Clicking a card goes to the listing detail page

### 2. Listing detail page
- Top: image gallery/carousel (all uploaded photos)
- Below: 
  - Price, room type, district, place
  - Description
  - Amenities/extra services (e.g., Wi-Fi, parking — free text or tags)
  - Vendor contact section: name, WhatsApp ID/number, phone number

### 3. Post a room page
- Public form, no login
- Fields:
  - Photos (optional, multiple, uploaded to Cloudinary)
  - Room type (studio / 1BHK / 2BHK)
  - District (dropdown — select only)
  - Place / area (dropdown — select only, options depend on selected district)
  - Rent (price)
  - Description
  - Amenities / extra services
  - Vendor name
  - WhatsApp ID or number
  - Phone number
- On submit → writes a new row to Supabase `rooms` table, images go to Cloudinary, URLs saved with the row

## Out of scope (for now)
- Login/accounts for vendors or renters
- Payments or subscriptions
- In-app messaging (contact happens via WhatsApp/phone outside the app)
- Admin/moderation panel
- Map view (can be added later)

## Success criteria for v1
- A vendor can post a listing with photos and all details in under 2 minutes
- A renter can filter by district + room type + price and find relevant listings
- A renter can view a listing and immediately see how to contact the vendor
