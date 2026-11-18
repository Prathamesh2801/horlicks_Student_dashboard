# Server API reference: Horlicks School Tribes API

> **Saved copy** of the server team's docs, taken **18 Nov 2026** (API **v1.5.0**).
> Live, always-current version: <http://192.168.1.88/long_term_project/Horlicks_School_Tribes/API/>
> (it also has a *Try it* console). If this copy and the live page differ, **the live page wins**: update this file.

---

## How this app uses it

| | |
|---|---|
| Base URL setting | `BASE_URL_SERVER` in [`src/config/config.js`](../src/config/config.js) |
| HTTP client | axios instance in [`src/services/api/client.js`](../src/services/api/client.js): adds `Authorization: Bearer <token>`, turns server errors into readable messages, sends the user back to login on `401` |
| Login / logout | [`src/services/api/auth.service.js`](../src/services/api/auth.service.js) → `auth.php` |
| Users (admin) | [`src/services/api/users.service.js`](../src/services/api/users.service.js) → `Admin/user.php` |
| Visits (staff + admin) | [`src/services/api/visits.service.js`](../src/services/api/visits.service.js) → `Staff/visit.php`: create (multipart), list (all pages), get one, cities |
| Admin dashboard | `getStats` in the same file → `Admin/dashboard.php` (one call per month; refreshed every 30 s) |
| Offline drafts + upload queue | [`src/services/drafts/`](../src/services/drafts): visits are built on the phone (IndexedDB) and uploaded in one request on **Submit**; without internet they wait and upload by themselves when back online |
| Proxy path | The app always calls **`/server-api/…`** on its own site (`API_PROXY` in `config.js`). `npm run dev` and `npm run preview` forward it to `BASE_URL_SERVER`; in production the web server must do the same, see [Deploying](#deploying-the-app-api-proxy). This avoids the browser blocking http API calls from an https page, and works for phones that aren't on the office LAN |

**Field names.** The server uses `Full_Name`, `Role: "Admin"`, `Status: "Active"`; the services convert to the app's
`{ username, name, role: 'admin' | 'staff', active, signedIn, createdAt }` and visits to `{ id, date, city, schoolName, staffName, lat, lng, photos: [{ type: 'normal' | 'headcount', url, ai }], headcount, aiFailed }`, so pages never see server field names. Photo links: `Storage: "s3"` → the server's signed `Url`; `Storage: "local"` → built from `Path` through the proxy (the local `Url` is plain http, which an https page can't load).

**First login.** `setup.php` creates two admins, **`EMP001`** and **`EMP002`**. Their passwords come from the server's `.env`
(`SEED_EMP001_PASSWORD`, `SEED_EMP002_PASSWORD`) and are **not** stored in this app. Ask the server owner. After the first
login, create everyone else from **Users** in the admin dashboard.

---

## Overview

A PHP + MySQL JSON API. Login returns a signed token (JWT, HS256) that is sent on later requests in the `Authorization` header. Every response is JSON.

| | |
|---|---|
| Base URL | `http://localhost/Long_Term_Project/Horlicks_School_Tribes/API/` on the server; on the LAN: `http://192.168.1.88/long_term_project/Horlicks_School_Tribes/API/` |
| Content type | Send `application/json` or `application/x-www-form-urlencoded`. Responses are `application/json` |
| Timezone | Asia/Kolkata (IST, +05:30), set in `.env` |
| CORS | `CORS_ALLOWED_ORIGIN` in `.env` (default `*`). `OPTIONS` preflight returns `200` |

## Authentication

Call **Login** to get a token, then send it on every protected request:

```
Authorization: Bearer <token>
```

- Tokens are valid for `TOKEN_TTL_SECONDS` (default **30 days**).
- **One active session per user.** Logging in again invalidates the previous token; logging out invalidates the current one.
- The user's `Role` (`Admin` / `Staff`) is always read from the database, not from the token.
- Tokens are accepted only in the header, not in the URL.

A protected endpoint returns `401` when authentication fails:

```json
{ "Authentication": false, "Message": "Invalid Credentials" }
```

| Message | Meaning |
|---|---|
| Authorization token is required in the Authorization header | No Bearer token was sent |
| Invalid token format | Malformed token or unsupported algorithm |
| This Session is Expired or Invalid Token | Signature mismatch, usually logged in elsewhere or logged out |
| Session has expired | The token's expiry time has passed |
| Invalid Credentials | User inactive, no active session, or the token isn't theirs |

## Errors & status codes

| Code | Meaning |
|---|---|
| 200 | Success (`201` on create) |
| 400 | Missing or invalid input |
| 401 | Wrong credentials, or missing/invalid/expired token |
| 403 | Forbidden (e.g. non-admin on `Admin/*`, or `setup.php` when disabled) |
| 404 | Not found |
| 405 | Unsupported method or action |
| 409 | Conflict (e.g. username already exists) |
| 429 | Too many login attempts |
| 500 | Server or database error (details in server `logs/`, never in the response) |

Error bodies look like `{ "Status": false, "Message": "..." }`.

## Rate limiting

Login is limited **per IP**: **3 failed attempts within 60 s blocks that IP for 120 s**. A successful login resets the counter. While blocked, login returns `429` with the seconds remaining. Behind a proxy you control, set `TRUST_PROXY=true`.

---

## Endpoints

### Login: `POST /auth.php`

Checks username + password and issues a new token. Any earlier session for the user is signed out.

| Field | Type | Required | Description |
|---|---|---|---|
| `username` | string | Yes | e.g. `EMP001` |
| `password` | string | Yes | |

```bash
curl -X POST "BASE/auth.php" -d "username=EMP001" -d "password=your-password"
```

**200**

```json
{
  "Status": true,
  "Message": "Logged in successfully for user EMP001",
  "Token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.…",
  "Username": "EMP001",
  "Full_Name": "Pratham Kamble",
  "Role": "Admin"
}
```

| Status | Message | When |
|---|---|---|
| 400 | `username is required` / `password is required` | Field missing or empty |
| 401 | `Invalid credentials` | Unknown user, inactive user or wrong password (counts toward the rate limit) |
| 429 | `Too many login attempts. Please try again in N seconds.` | IP blocked |
| 500 | `Login failed due to a server error` | Database/server problem |

### Logout: `POST /auth.php?do=logout`

Ends the current session (the stored secret key is cleared, so the token stops working immediately).

| Input | Where | Required |
|---|---|---|
| `Authorization: Bearer <token>` | Header | Yes (or `token` in the body if the header is absent) |

**200** `{ "Status": true, "Message": "Logout successful" }`

| Status | Response | When |
|---|---|---|
| 400 | `{ "Status": false, "Message": "Token is required" }` | No/unreadable token |
| 401 | `{ "Status": false, "Authentication": false, "Message": "Invalid Credentials" }` | Token invalid, expired or already logged out |
| 500 | `{ "Status": false, "Message": "Error occurred during logout" }` | Database/server problem |

Any other method or `do` value on `auth.php` returns `405` `"Invalid request method"`.

---

## Admin · Users: `/Admin/user.php`

**Admins only.** Otherwise `403` `"Access denied. Only Admins can perform this action."` Users are never deleted; disable them instead. Responses never include `Password` or `Secret_Key`.

User object:

```json
{
  "Username": "EMP003",
  "Full_Name": "Asha Patil",
  "Role": "Staff",
  "Status": "Active",
  "Has_Session": false,
  "Created_AT": "2026-11-17 11:20:05",
  "Updated_AT": "2026-11-17 11:20:05"
}
```

`Has_Session` is `true` while the user is logged in.

### Field rules

| Field | Rule |
|---|---|
| `username` | 3–30 characters: letters, numbers, `.` `_` `-`. Unique. **Cannot be changed** after creation |
| `full_name` | 1–20 characters |
| `password` | 8–72 characters (bcrypt) |
| `role` | `Admin` or `Staff` |
| `status` | `Active` (default) or `Inactive` |

Validation failures → `400`:

```json
{ "Status": false, "Message": "Validation failed", "Errors": { "password": "Must be 8-72 characters" } }
```

### List / get: `GET /Admin/user.php`

| Query | Description |
|---|---|
| `username` | Return only this user (`404` if not found) → `{ "Status": true, "Data": { … } }` |
| `search` | Part of `Username` or `Full_Name` |
| `role` | `Admin` / `Staff` |
| `status` | `Active` / `Inactive` |
| `limit` | 1–200 (default 50) |
| `offset` | Rows to skip (default 0) |

**200** `{ "Status": true, "Total": 2, "Limit": 50, "Offset": 0, "Data": [ { …user } ] }`

### Create: `POST /Admin/user.php`

Body: `username`, `full_name`, `password`, `role` (all required), `status` (optional, default `Active`).

```bash
curl -X POST "BASE/Admin/user.php" -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"username":"EMP003","full_name":"Asha Patil","password":"Str0ngPass!","role":"Staff"}'
```

**201** `{ "Status": true, "Message": "User created successfully", "Data": { …user } }`. Errors: `400` validation, `409` `Username already exists`.

### Update: `PUT /Admin/user.php`

Send `username` to pick the user plus only the fields to change: `full_name`, `password`, `role`, `status` (at least one).

- Changing **another** user's password signs them out (`Session_Ended: true`).
- An admin **cannot disable their own account or change their own role**; they *can* change their own name and password (their session stays).

**200** `{ "Status": true, "Message": "User updated successfully", "Session_Ended": true, "Data": { …user } }`. Errors: `400` (missing username, validation, self-disable/self-demote, nothing to update), `404` `User not found`.

### Disable / enable: `PUT /Admin/user.php` with `status`

```bash
# Disable (user is signed out immediately; data kept)
curl -X PUT "BASE/Admin/user.php" -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"username":"EMP003","status":"Inactive"}'
# Enable
curl -X PUT "BASE/Admin/user.php" -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"username":"EMP003","status":"Active"}'
```

Same response as Update; `Session_Ended` is `true` when disabling.

---

## Staff · Visits: `/Staff/visit.php`

A visit = date, city, school name, GPS location and photos. Available to **Staff and Admin**.
**Staff only ever see their own visits; Admin sees all** (and can narrow with `username`).
The city drop-down is the `VISIT_CITIES` array in the server's `config.php`; the same list comes back on every GET.
Photos come in two lists: **normal** (stored only) and **AI** (stored and sent to the Person Counter service; the number it returns is saved as that photo's `Face_Count`).

### Create visit: `POST /Staff/visit.php` (`multipart/form-data`)

| Field | Type | Required | Rules |
|---|---|---|---|
| `visit_date` | text | Yes | `YYYY-MM-DD`, a real date, not in the future |
| `city` | text | Yes | Must exactly match one of the cities in `Cities` |
| `school_name` | text | Yes | 2–150 characters |
| `latitude` | number | Yes | −90 to 90 |
| `longitude` | number | Yes | −180 to 180 |
| `normal_photos[]` | files | * | Stored only |
| `ai_photos[]` | files | * | Stored and counted by the AI service |

\* At least one photo in total. Each photo JPG/PNG/WEBP/BMP, up to `MAX_PHOTO_MB` MB; each list up to `MAX_PHOTOS_PER_TYPE` photos.

```bash
curl -X POST "BASE/Staff/visit.php" -H "Authorization: Bearer <token>" \
  -F "visit_date=2026-11-17" -F "city=Mumbai" -F "school_name=Sunrise Public School" \
  -F "latitude=19.0760" -F "longitude=72.8777" \
  -F "normal_photos[]=@gate.jpg" -F "ai_photos[]=@assembly.jpg"
```

**201 Created**

```json
{
  "Status": true,
  "Message": "Visit created successfully",
  "Data": {
    "Visit_ID": 12, "Username": "EMP003", "Staff_Name": "Asha Patil",
    "Visit_Date": "2026-11-17", "City": "Mumbai", "School_Name": "Sunrise Public School",
    "Latitude": 19.076, "Longitude": 72.8777,
    "Normal_Photos": [ { "Photo_ID": 31, "Storage": "s3", "Path": "prod/visits/12/9f2c….jpg", "Url": "https://…signed link…" } ],
    "AI_Photos": [ { "Photo_ID": 33, "Storage": "local", "Path": "uploads/visits/12/c41a….jpg", "Url": "http://…", "Face_Count": 27, "AI_Status": "Done" } ],
    "Total_Face_Count": 27,
    "Created_AT": "2026-11-17 11:45:10"
  }
}
```

If the AI service fails for a photo, the visit and photo are still saved: that photo gets `"Face_Count": null`, `"AI_Status": "Failed"`, and a `Warnings` array explains why. The count is the number of people the service detects (`total_persons`).

| Status | When |
|---|---|
| 400 | `Validation failed` + `Errors` keyed by field (`visit_date`, `city`, `school_name`, `latitude`, `longitude`, `photos`, `normal_photos`, `ai_photos`) |
| 413 | Upload bigger than PHP's `post_max_size` |
| 500 | Server error; nothing is saved (visit row and files rolled back) |

### List / get visits: `GET /Staff/visit.php`

| Query | Description |
|---|---|
| `visit_id` | Only this visit (`404` if it doesn't exist or isn't yours); `Data` is then one object |
| `city` | Only this city |
| `date_from`, `date_to` | `YYYY-MM-DD`, inclusive |
| `username` | Admin only: one user's visits |
| `limit`, `offset` | Paging; `limit` 1–100 (default 20) |

**200**

```json
{
  "Status": true,
  "Month": "2026-11",
  "Cities": [ { "City": "Mumbai", "This_Month_Visits": 4, "Total_Visits": 19 } ],
  "Totals": { "This_Month_Visits": 4, "Total_Visits": 26 },
  "Total": 4, "Limit": 20, "Offset": 0,
  "Data": [ { "Visit_ID": 12, "…": "same visit object as in Create visit" } ]
}
```

`Cities` lists every configured city (including zero-visit ones) for the caller's scope, unaffected by the `city`/date filters, so it doubles as the drop-down source. `Total` = visits matching the filters (for paging). Photo `Url`s: local photos are public links with random file names; S3 photos are **temporary signed links** (see [Photo storage](#photo-storage-s3-or-local)).

## Admin · Dashboard: `GET /Admin/dashboard.php`

One call with the numbers for the admin home screen. Admins only (Staff get `403`). GET only.

| Query | Description |
|---|---|
| `month` | Optional, `YYYY-MM`. Empty = current month. Any other format → `400`. A month with no visits returns zeros. |

**200** (fields are at the top level, no `Data`)

```json
{
  "Status": true,
  "Month": "2026-11",
  "Total_Face_Count": 28,
  "Total_Visits": 7,
  "Cities": [
    { "City": "Mumbai", "This_Month_Visits": 4, "Total_Visits": 5 },
    { "City": "Pune",   "This_Month_Visits": 2, "Total_Visits": 3 },
    { "City": "Delhi",  "This_Month_Visits": 1, "Total_Visits": 1 }
  ],
  "Recent_Visits": [ { "Visit_ID": 7, "…": "same visit object as Create visit" } ]
}
```

| Field | Meaning |
|---|---|
| `Month` | The month the numbers are for |
| `Total_Visits` | Visits in that month, all staff |
| `Total_Face_Count` | **Sum** of the AI photos' face counts of that month's visits (failed counts skipped) |
| `Cities` | Every configured city, including 0-visit ones. `This_Month_Visits` follows `month`; `Total_Visits` is all time. `This_Month_Visits` add up to the top `Total_Visits` |
| `Recent_Visits` | The 5 newest visits of that month, full visit objects with photos (S3 links are temporary) |

How the app shows it: **Students counted (AI)** = `Total_Face_Count` (+ average per visit), **Visits completed** = `Total_Visits`,
**Cities with visits** = cities with `This_Month_Visits > 0`, **Visits all time** = sum of `Cities[].Total_Visits`,
**Visits by city** chart = `This_Month_Visits`, **Recent visits** table = `Recent_Visits`.

## Photo storage (S3 or local)

| Situation | What happens |
|---|---|
| S3 keys set in `.env` | Photos go to the bucket as `[S3_PREFIX/]visits/<Visit_ID>/<random>.<ext>`; `Storage: "s3"` |
| S3 keys empty | Saved in `uploads/visits/<Visit_ID>/`; `Storage: "local"` |
| S3 set but an upload fails | That photo is saved locally (`Storage: "local"`) and the response has a `Warnings` entry |
| Visit fails after some photos were saved | Rows rolled back and every saved photo (S3 or local) deleted |

The bucket stays private and the API returns **temporary signed links**, unless `S3_PUBLIC_URL` (CDN / public bucket) is set.
Existing local photos keep working; they are not copied to S3. `.env` keys: `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`,
`S3_REGION` (default `us-east-1`, e.g. `ap-south-1`), `S3_ENDPOINT` (MinIO / Spaces / R2 only), `S3_PREFIX`, `S3_PUBLIC_URL`.
`visit_photo_tbl` has a new `Storage` column (run `setup.php` again). Admins also have a log viewer at `/logs/` (v1.4.0).

---

## Deploying the app (API proxy)

The built app (`npm run build` → `dist/`) calls `/server-api/...` on the **same site** it is served from. The web server that hosts `dist/` must forward that path to the PHP API (keep the `Authorization` header, allow uploads up to ~64 MB).

**Apache** (needs `mod_proxy` + `mod_proxy_http`), in the app's VirtualHost:

```apache
ProxyPass        /server-api/ http://192.168.1.88/long_term_project/Horlicks_School_Tribes/API/
ProxyPassReverse /server-api/ http://192.168.1.88/long_term_project/Horlicks_School_Tribes/API/
ProxyTimeout 900
```

**nginx**:

```nginx
location /server-api/ {
    proxy_pass http://192.168.1.88/long_term_project/Horlicks_School_Tribes/API/;
    client_max_body_size 64m;
    proxy_read_timeout 900s;
}
```

If the app and the API end up on the same domain (e.g. app at `/`, API at `/api/`), set `API_PROXY: '/api'` in `config.js` instead. If the API gets its own **https** domain with CORS for the app, set `API_PROXY: ''` and `BASE_URL_SERVER` to that https URL.

The app is built with `base: './'` and a hash router, so `dist/` can be served from any folder; `/server-api` is resolved from the site root.

## Server setup & configuration (server side)

### `GET /setup.php`

One-time installer: creates the database and `login_tbl`, and inserts the default users **`EMP001`** and **`EMP002`** (both `Admin`) with passwords from `.env`. Safe to re-run (existing users aren't overwritten). Set `SETUP_ENABLED=false` afterwards (then it returns `403`).

### `.env` (next to `config.php`, blocked from web access)

| Key | Default | Description |
|---|---|---|
| `APP_DEBUG` | `false` | Show PHP/database error details |
| `TIMEZONE` | `Asia/Kolkata` | PHP timezone |
| `MYSQL_TIME_ZONE` | `+05:30` | MySQL session timezone |
| `DB_HOST` / `DB_USER` / `DB_PASS` / `DB_NAME` | `localhost` / `root` / *(empty)* / `horlicks_school_tribes` | Database |
| `CORS_ALLOWED_ORIGIN` | `*` | `*` or comma-separated origins |
| `TOKEN_TTL_SECONDS` | `2592000` | Token lifetime (30 days) |
| `TRUST_PROXY` | `false` | Trust `X-Forwarded-For` for the client IP |
| `PERSON_COUNTER_API_URL` | `http://192.168.1.16:8000` | External **Person Counter** (AI headcount) service; its docs are at `/docs` |
| `PERSON_COUNTER_TIMEOUT` | `60` | Seconds to wait for the Person Counter, per AI photo |
| `MAX_PHOTOS_PER_TYPE` | `10` | Max photos in each of `normal_photos` and `ai_photos` |
| `MAX_PHOTO_MB` | `10` | Max size of one photo (PHP `upload_max_filesize` / `post_max_size` must be at least as large) |
| `SETUP_ENABLED` | `true` | Allow `setup.php` |
| `SEED_EMP001_PASSWORD`, `SEED_EMP002_PASSWORD` | - | Initial admin passwords used by `setup.php` |

### Database: `login_tbl`

| Column | Type | Notes |
|---|---|---|
| `Username` | VARCHAR(30) | Primary key, the only login identifier |
| `Full_Name` | VARCHAR(20) | |
| `Password` | VARCHAR(200) | bcrypt hash |
| `Secret_Key` | VARCHAR(100) | Per-session signing key; `NULL` when logged out |
| `Role` | ENUM | `Admin` / `Staff` |
| `Status` | ENUM | `Active` (default) / `Inactive` (cannot log in) |
| `Updated_AT`, `Created_AT` | DATETIME | Automatic |

### `visit_tbl` / `visit_photo_tbl`

| Table | Columns |
|---|---|
| `visit_tbl` | `Visit_ID` (PK), `Username` (FK `login_tbl`), `Visit_Date`, `City` VARCHAR(50), `School_Name` VARCHAR(150), `Latitude`/`Longitude` DECIMAL(10,7), `Created_AT` |
| `visit_photo_tbl` | `Photo_ID` (PK), `Visit_ID` (FK, deleted with the visit), `Photo_Type` `Normal`/`AI`, `File_Path` (e.g. `uploads/visits/12/<random>.jpg`), `Face_Count` (AI only, `NULL` if failed), `AI_Status` `Done`/`Failed` |

Existing installs: run `setup.php` again to create the new tables (safe to repeat). Photos are saved in `uploads/`.

New protected endpoints include `function.php` and call `verifyTokenAndGetData()` (returns `['username' => …, 'role' => …]` or sends the `401` itself).

## Changelog (server)

| Date | Version | Change |
|---|---|---|
| 2026-11-18 | 1.5.0 | Added `GET Admin/dashboard.php` (Admins only): month totals (visits, face count), `Cities`, 5 most recent visits. Visit read helpers moved to `visit_helpers.php` (no behaviour change) |
| 2026-11-17 | 1.4.0 | Admin-only web log viewer at `/logs/`; `logs/.htaccess` blocks every other file |
| 2026-11-17 | 1.3.0 | Visit photos go to S3 when `S3_BUCKET`/`S3_ACCESS_KEY`/`S3_SECRET_KEY` are set, else `uploads/`. New `storage.php`, `S3_*` `.env` keys, `Storage` column + field on every photo, signed links unless `S3_PUBLIC_URL` |
| 2026-11-17 | 1.2.0 | Added `Staff/visit.php`: create a visit (multipart, normal + AI photos with face count from the Person Counter) and list/get visits (Staff own, Admin all) with a `Cities` array of this-month/total counts. City list in `config.php` (`VISIT_CITIES`). New tables `visit_tbl`, `visit_photo_tbl`, `uploads/` folder, `.env` keys `PERSON_COUNTER_TIMEOUT`, `MAX_PHOTOS_PER_TYPE`, `MAX_PHOTO_MB` |
| 2026-11-17 | 1.1.1 | Added `PERSON_COUNTER_API_URL` to `.env` (external Person Counter service) |
| 2026-11-17 | 1.1.0 | Added `Admin/user.php` (list/get, create, update, enable/disable; Admins only), Try-it console, PUT body support, Authorization header pass-through |
| 2026-11-17 | 1.0.0 | Initial docs: login/logout by `Username`, config in `.env`, header-only tokens, logout at `POST auth.php?do=logout`, proper status codes, log redaction |

## Questions / still needed from the server (for this app)

- [ ] **`VISIT_CITIES`**: the docs' example shows Mumbai/Pune/Delhi; it needs the client's **Odisha** city list.
- [ ] **`Total_Face_Count`**: v1.5.0 docs confirm it's the **sum** of the AI photos. The same children appear in several class photos, so a sum over-counts; it should be the **highest** single photo. The app shows the server's value as-is.
- [x] ~~Dashboard stats endpoint~~: `Admin/dashboard.php` (v1.5.0). Still missing from it: schools covered, photos, AI-failed visits, last-7-days count, face count per city.
- [ ] **`search`** param on `GET visit.php` (school / staff name): today the admin list filters in the browser.
- [ ] Optional: a `District` per city, and visit **edit/delete** for admins.
- [ ] Excel / PPT export (server-side).
- [ ] Production: **HTTPS** + public domain for the API (needed for installing the app and for phones on mobile data).
