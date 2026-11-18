# Server API: what is still needed

> For the server team · from the React app (frontend) · updated 18 Nov 2026 · based on API **v1.5.0**
> Current API reference: [`docs/SERVER_API.md`](../docs/SERVER_API.md) · live docs: <http://192.168.1.88/long_term_project/Horlicks_School_Tribes/API/>

The app is fully connected to v1.5.0 (login, users, visits with photos + AI count, S3/local photo links, admin dashboard). Nothing in the app uses mock data any more.
This list is what the server still needs so the app doesn't have to compute things in the browser, plus a few fixes found while connecting.

All shapes below follow the existing conventions: PascalCase fields, `{ "Status": true|false, "Message": "...", "Data": ... }`, Bearer token, `400` with `Errors` per field.

---

## Summary

| # | Item | Type | Priority | Why |
|---|---|---|---|---|
| 1 | Odisha city list (+ district) | Config change | **P1, before field use** | Docs example has Mumbai/Pune/Delhi |
| 2 | ~~`Total_Face_Count` = highest photo~~ ✅ solved by `Unique_Person_Count` | Docs only | P3 | App shows unique as the main number; please document `Unique_Person_Count` / `Total_Unique_Person_Count` |
| 3 | `client_ref` on create visit (no duplicate visits) | Small change | **P1** | The app retries uploads after a timeout; without this a retry can create the visit twice |
| 4 | PHP / Apache limits for uploads + AI time | Server config | **P1** | 10 AI photos × 60 s can exceed default `max_execution_time` (30 s) |
| 5 | ~~Dashboard stats endpoint~~ ✅ v1.5.0 · a few extra fields | Small change | P2 | `Admin/dashboard.php` is live and used; schools / photos / per-city counts still missing |
| 6 | `search` on visit list | Small change | P2 | Admin search by school / staff name |
| 7 | Photo metadata (GPS + time per photo) | Small change | P2 | Client asked for lat/long + timestamp per picture; app already records it |
| 8 | School master list | New endpoint + table | P2 | Pick school instead of typing; "x% of 6,000 schools"; GPS distance check |
| 9 | Admin review: verify / flag a visit | New endpoint | P2 | Admin can only view visits today |
| 10 | Fraud checks (GPS distance, duplicate photos) | Logic | P2 | Gallery uploads are allowed, so checks matter |
| 11 | Excel / PPT reports | New endpoint | P3 | Client requirement; too heavy for the browser |
| 12 | Production: HTTPS + domain | Infra | **Before go-live** | Install as app, camera, GPS and offline need HTTPS |

---

## P1

### 1. Odisha city list (+ district)

Replace `VISIT_CITIES` in `config.php` with the client's Odisha list (from their Excel). Please also return the **district** for each city so the dashboard can group by district.

`GET /Staff/visit.php` → `Cities`:

```json
"Cities": [
  { "City": "Bhubaneswar", "District": "Khordha", "This_Month_Visits": 4, "Total_Visits": 19 },
  { "City": "Cuttack",     "District": "Cuttack", "This_Month_Visits": 0, "Total_Visits": 7 }
]
```

(If districts aren't known yet, just the Odisha city names are enough for now.)

### 2. `Total_Face_Count` = highest single AI photo

Staff take 5–6 photos of the **same class**. Adding the counts counts the same children 5–6 times. Please make `Total_Face_Count` the **maximum** `Face_Count` among the visit's AI photos with `AI_Status = "Done"` (`null` if none succeeded).

> If you'd rather keep the sum too, add a separate `Sum_Face_Count`. The app shows `Total_Face_Count` as "Students counted".

### 3. `client_ref`: create visit only once

The app builds visits offline and uploads them later. If the connection drops **after** the server saved the visit but **before** the app got the reply, the app retries, and today that creates a **duplicate** visit.

Add an optional field to `POST /Staff/visit.php`:

| Field | Type | Rules |
|---|---|---|
| `client_ref` | text | Optional, max 64 chars (the app sends a UUID). **Unique per user** |

- New column `visit_tbl.Client_Ref VARCHAR(64) NULL`, unique index on `(Username, Client_Ref)`.
- If a visit with the same `Username` + `client_ref` already exists: **don't save again**, return **`200`** with the existing visit (same `Data` shape as `201`) and `"Duplicate": true`.

```json
{ "Status": true, "Message": "Visit already uploaded", "Duplicate": true, "Data": { "Visit_ID": 12, "…": "…" } }
```

The app will start sending `client_ref` as soon as this is live (one line in `src/services/api/visits.service.js`).

### 4. PHP / Apache limits

One visit = up to 10 normal + 10 AI photos (the app compresses each to ~150–300 KB, max 1600 px JPEG), and the AI count runs **inside** the request (up to `PERSON_COUNTER_TIMEOUT` = 60 s per AI photo).

| Setting | Suggested | Why |
|---|---|---|
| `upload_max_filesize` | `10M` (= `MAX_PHOTO_MB`) | One photo |
| `post_max_size` | `64M` | 20 photos + fields |
| `max_file_uploads` | `25` | Default 20 is exactly the limit; leave headroom |
| `max_execution_time` | `900` (for `Staff/visit.php`) | 10 AI photos × 60 s = 600 s worst case |
| `max_input_time` | `300` | Slow mobile uploads |
| Apache `Timeout` / proxy timeout | `900` | Same as above |

> Optional improvement: count AI photos in parallel, or return `201` right away with `AI_Status: "Pending"` and count in the background. The app can show "counting…" again if you do this; tell us the shape.

### 5. Dashboard: extra fields on `Admin/dashboard.php`

✅ **Done in v1.5.0**: the admin dashboard now makes one call to `GET /Admin/dashboard.php?month=YYYY-MM` and shows
students counted, visits, cities with visits, all-time visits, visits by city, and the 5 recent visits.

The original design also had these tiles, which the endpoint doesn't return yet (so the app hides them for now). Please add when possible:

```json
{
  "Schools": 4212,
  "Photos": 61320,
  "AI_Failed_Visits": 26,
  "Face_Count_Last_7_Days": 8420,
  "Cities": [ { "City": "Bhubaneswar", "This_Month_Visits": 4, "Total_Visits": 19, "Face_Count": 1240 } ]
}
```

| Field | How to compute |
|---|---|
| `Schools` | Distinct schools visited in the month (`City` + trimmed, lower-case `School_Name` until there's a school master list, item 8) → "x% of 6,000 schools" tile |
| `Photos` | Photos (normal + AI) of the month's visits |
| `AI_Failed_Visits` | Visits in the month with at least one `AI_Status = "Failed"` photo |
| `Face_Count_Last_7_Days` | Same face count, visits dated in the last 7 days → "+N this week" |
| `Cities[].Face_Count` | Face count per city for the month → "Students counted by city" chart (today it charts visits) |

---

## P2

### 6. `search` on the visit list

`GET /Staff/visit.php?search=patia`: matches part of `School_Name` or `Staff_Name` (and `Username`). Works with the existing `city`, `date_from`, `date_to`, `limit`, `offset`; `Total` counts the filtered rows.
(Today the admin Visits page downloads the whole period and filters in the browser.)

### 7. Photo metadata (GPS + time per photo)

The client asked for lat/long + timestamp with every picture. The app already records them per photo but has nowhere to send them. Add an optional JSON field to `POST /Staff/visit.php`:

| Field | Type | Description |
|---|---|---|
| `photo_meta` | JSON text | Array in the **same order** as the files: normal photos first, then AI photos |
| `gps_accuracy_m` | number | Optional: accuracy of the visit location in metres |

```json
[
  { "type": "normal", "index": 0, "latitude": 20.29612, "longitude": 85.82450, "taken_at": "2026-11-17T10:42:05+05:30" },
  { "type": "ai",     "index": 0, "latitude": 20.29615, "longitude": 85.82447, "taken_at": "2026-11-17T10:45:30+05:30" }
]
```

New columns `visit_photo_tbl.Latitude`, `Longitude` (DECIMAL(10,7) NULL), `Taken_AT` (DATETIME NULL), and return them in each photo object.

### 8. School master list

Today staff **type** the school name, so the same school can be spelled differently and coverage ("x% of 6,000") can't be exact. Please add a schools table (imported from the client's Excel) and:

`GET /Staff/school.php` (Staff + Admin)

| Query | Description |
|---|---|
| `city` | Schools in this city |
| `search` | Part of school name or UDISE code |
| `limit`, `offset` | Paging (limit 1–200) |

```json
{
  "Status": true,
  "Total": 812,
  "Data": [
    { "School_ID": 501, "UDISE_Code": "21150100101", "School_Name": "Govt. UP School, Patia", "City": "Bhubaneswar", "District": "Khordha",
      "Latitude": 20.3534, "Longitude": 85.8240, "Visited": true }
  ]
}
```

- `POST /Staff/visit.php` then accepts `school_id` (and keeps `school_name` for schools not in the list).
- Optional `POST /Admin/school.php` (multipart `.xlsx`/`.csv`) to import or update the list.
- The app will cache the list on the phone so staff can pick a school offline.

### 9. Admin review: verify / flag a visit

`PUT /Admin/visit.php` (Admin only)

```json
{ "visit_id": 12, "review_status": "Verified", "note": "Count checked" }
```

| Field | Rules |
|---|---|
| `visit_id` | Required |
| `review_status` | `Pending` (default) · `Verified` · `Flagged` |
| `note` | Optional, max 255 |
| `final_count` | Optional integer: admin's corrected student count (only if the client wants admins to override the AI) |

Add to every visit object: `"Review_Status"`, `"Review_Note"`, `"Reviewed_By"`, `"Reviewed_AT"`, `"Final_Count"`. List filter: `GET /Staff/visit.php?review_status=Flagged`.
Visits are never hard-deleted (same rule as users); if needed add `review_status = "Rejected"`.

### 10. Fraud checks (on create)

Return them in the visit object; the app will show them as badges for admins:

```json
"Checks": {
  "Distance_From_School_M": 85,
  "Too_Far": false,
  "Duplicate_Photo_IDs": [],
  "Photo_Date_Mismatch": false
}
```

| Check | Rule |
|---|---|
| GPS distance | Visit (and photo) location vs the school's master lat/long (#8); `Too_Far` if > 200 m (configurable) |
| Duplicate photos | Perceptual hash per photo; flag if the same image was used in another visit |
| Photo date | EXIF date (when present) or `taken_at` (#7) not on `Visit_Date` |

---

## P3

### 11. Excel / PPT reports

Reports with thousands of photos are too heavy for a phone/browser, so they should be built on the server.

`POST /Admin/report.php` (Admin only) → starts a report

```json
{ "type": "excel", "month": "2026-11", "city": "" }
```

`type`: `excel` (Sheet 1: summary by city/district; Sheet 2: one row per visit with photo links) or `ppt` (summary slides, then one slide per school with compressed photos + counts).

**202** `{ "Status": true, "Report_ID": 7, "Report_Status": "Processing" }`

`GET /Admin/report.php?report_id=7` → `{ "Status": true, "Report_Status": "Ready", "Url": "…/reports/visits-2026-11.xlsx" }` (`Processing` / `Ready` / `Failed`).

Small exports could also be returned directly as a file; the app's **Export** button on the Visits page will call this (today it makes a CSV in the browser).

### Small extras (nice to have)

- `GET /Admin/user.php`: fine as is (the app loads up to 200 users).
- Self-service "change my password" for staff: `PUT /auth.php?do=password` `{ current_password, new_password }`.
- `Staff_Name` on old visits if a user is renamed: keep as is (snapshot) or join live; either is fine, just document it.

---

## Before go-live (infrastructure)

- **HTTPS + public domain** for the API (and the app). Browsers only allow install-as-app, service workers (offline), camera and GPS on HTTPS, and phones in schools are on mobile data, not the office LAN.
- **`CORS_ALLOWED_ORIGIN`** set to the app's domain instead of `*`.
- `SETUP_ENABLED=false`, `APP_DEBUG=false`, strong `SEED_*` passwords changed after first login.
- Backups of the database **and** the `uploads/` folder (~40–55 GB expected for 6,000 schools).
- Thumbnails for photos (e.g. 480 px) next to the originals, returned as `Thumb_Url`: lists and the map will load much faster.

---

## How the app will pick these up

Each item is a small change in one service file. Pages don't change:

| Server item | App file |
|---|---|
| 1, 6 | `src/services/api/visits.service.js` (`getCities`, `listVisits`) |
| 2 | nothing (app already shows `Total_Face_Count`) |
| 3, 7 | `createVisit` in `visits.service.js` (send `client_ref`, `photo_meta`) |
| 5 | ✅ `getStats` in `visits.service.js` already calls `Admin/dashboard.php`; extra fields → `KpiTiles` / `CityChart` |
| 8 | new `schools.service.js` + school picker in the New visit form |
| 9, 10 | `visits.service.js` + admin Visit detail page (review buttons, check badges) |
| 11 | Visits page **Export** button |

Please add each change to the API docs changelog as you go. We'll update the app against it.
