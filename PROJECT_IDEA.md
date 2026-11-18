# Odisha School Activity AI Dashboard: Project Idea

> Status: **React frontend built and connected to the server API v1.2.0** (`docs/SERVER_API.md`): login, users, visits with photos + AI face count (Person Counter on the server). Visits are drafted offline on the phone and uploaded on Submit (auto-upload when back online). Open questions for the server are listed at the end of `docs/SERVER_API.md`. Awaiting client answers (§14) and the client's colours/assets.
> Design (Penpot, final UI v2, implemented 2026-11-16; PDF export in `design-export/`): https://design.penpot.app/?screen=workspace&team-id=cc32ce3d-bd54-8151-8007-eabd223f5fb7&file-id=b55064db-d93d-80f9-8008-de1fcbfe1940
> Owners: Client (React) is mine. Server, APIs and AI belong to a colleague (or me, not decided yet).

---

## 1. Overview

The client runs an activity programme in **6000 government schools across Odisha (18–20 districts)**. Field staff visit each school, carry out the activity and capture proof: they enter the date, city and school, then take photos (banner, leaflet, places and 5–6 classroom photos for the AI headcount). GPS + time are captured automatically.

We need:
- A **monitoring dashboard** that shows all of this by district, on a map and per school.
- **AI that counts the students** in the classroom photos.
- **Excel and PPT downloads** of the data and photos, with a summary.

**Scale:** 6000 schools × ~15–18 photos ≈ **90,000 – 1,08,000 photos**.

---

## 2. Client Requirements (as given)

- A dashboard that can **count the students in the classroom using AI**
- Login **lat/long, timestamp and picture**
- Activity pictures
- Collateral pictures
- Activity closing pictures
- Count of students
- Principal or teacher signed letter
- ~15–18 pictures per school, 6000 schools, state: Odisha
- **Map view**
- **Activity view**
- Districts: 18–20
- **Download Excel and PPT** of pictures and data, with a summary

---

## 3. Users & Roles

Only **two roles**: `admin` and `staff`.

| Role | Can do | Where |
|---|---|---|
| **Admin** | Dashboard, visits, map, reports. **Creates logins (username + password) for both admins and staff**, resets passwords, disables accounts | Web dashboard (responsive, works on phone too) |
| **Staff** | Sign in, create a visit, take/upload photos, pick headcount photos, submit, see own visits | Phone PWA **"My Workbench"** |

> District Coordinator and Viewer roles were dropped to keep it simple. Can be added later if the client needs district-level access.

---

## 4. Per-School Visit Record (what we capture)

| Field | Type | Notes |
|---|---|---|
| Date | Date | Typed/picked by staff (defaults to today) |
| City | From list | From the server's `VISIT_CITIES` (`config.php`), returned by `GET Staff/visit.php`; cached on the phone for offline drafts |
| School name | Text | Typed by staff |
| Lat / long | GPS | Captured **automatically** when the visit starts and with every photo. The user cannot type it in |
| Photos | ~10–18 | Two groups: **Normal** (banner, leaflet, marketing, other activity) and **Headcount** (5–6 class photos). Native camera or upload from the device |
| AI count per photo | Number | From the AI face-detection API, only for Headcount photos (**no manual count**) |
| Visit headcount | Number | **Highest** count across the headcount photos (the same children appear in several photos, so not the sum) |
| Status | Enum | `draft` (adding photos) → `processing` (AI counting) → `completed` |

---

## 5. Modules / Screens (Client side, React)

One React app, one login. After sign-in each role is sent to its own area.

### 5.1 Login (`/login`)
- Username + password. No selfie / face detection.
- Admin → `/admin`, Staff → `/staff`.

### 5.2 Staff: "My Workbench" (PWA, mobile-first)
1. **My visits** (`/staff`): staff dashboard, list of own visits with status, photo count and AI count.
2. **New visit** (`/staff/visits/new`): **Date**, **City** (from the Excel list), **School name**. GPS is captured here; the visit can't start without location.
3. **Photos** (`/staff/visits/:id/photos`): two tabs, **Normal photos** and **Headcount · AI**. **Take photo** (native camera) or **Upload**. Photos are compressed in the browser and uploaded straight away with GPS + time. Delete wrong photos (with confirm).
4. **Submit** (with confirm): needs at least one headcount photo. The backend sends headcount photos to the AI face API.
5. **Visit summary** (`/staff/visits/:id`): refreshes every 2 s while the AI is counting, then shows the count per photo and the visit headcount.

### 5.3 Admin dashboard (desktop-first, responsive)
- **Dashboard** (`/admin`): month picker, KPI tiles (students counted by AI + this week, schools covered + % of 6,000, visits completed, AI counting), students-by-city bar chart, recent visits. Refreshes every 30 s.
- **Visits** (`/admin/visits`): table with search (school/staff), city/status/period filters (kept in the URL), pagination, **Export** (CSV, opens in Excel).
- **Visit detail** (`/admin/visits/:id`): headcount, school/city/date/staff, GPS (opens OpenStreetMap), all photos with type and AI count.
- **Map** (`/admin/map`): visit pins coloured by status (Leaflet + OpenStreetMap, free). Add `leaflet.markercluster` when pins reach the thousands.
- **Users** (`/admin/users`): create **admin or staff** logins, reset password, enable/disable.
- Excel with photos / PPT reports: server-generated, add once the backend exists (the Visits **Export** button is the place for them).

### 5.4 Not in v1 (add when needed)
- Offline queue (IndexedDB) for poor network: today photos upload while online.
- Verify / Flag actions for Admin.
- Bounding boxes drawn on photos (the API contract already returns `boxes`).
- Charts (day-wise trend etc.).

---

## 6. AI Student Counting

**Approach**
- A **face / person-detection** model, e.g. **YOLOv8 / YOLO11** (COCO `person` class) or a face detector (RetinaFace / YOLO-face). Works out of the box, no training needed at the start.
- Wrap it in a small **Python FastAPI** service: it receives an image and returns `{ count, boxes[] }`.
- Runs **asynchronously** after the visit is submitted, through a job queue. Staff never wait for it; the app polls the visit.

**Counting logic**
- Run the model **only on the photos the staff ticked "Count heads"** (usually 5–6). The visit's AI count is the **max** across those photos.
- There is **no manual count**. Field staff never type a number.
- **Auto-flag** on photo quality: blurry / dark photos, too few activity photos, or zero people detected.

**Known limitations**
- Crowded classrooms where children block each other, kids sitting on the floor, low light and blurry photos.
- Mitigation: a photo guideline for field staff (take it from the front, cover the whole room), plus Admin verification (and an optional final-count override, see §14).
- If the rooms are very dense, try **crowd-counting models** (CSRNet / density maps) or fine-tune YOLO on a few hundred labelled classroom photos.

**Cost:** about 1 lakh images runs fine on CPU in batches. A GPU is optional and only speeds things up.

---

## 7. Validation / Fraud Checks

- **GPS distance check**: the photo location must be within N metres (e.g. 200 m) of the school's master lat/long, otherwise the visit is flagged
- **Timestamp window**: photos must be within the visit time window
- **EXIF check** where available (date, GPS)
- **Duplicate photo detection** (perceptual hash) to stop the same photo being reused across schools
- Gallery upload is **allowed** (user decision), so the EXIF + duplicate checks above matter more

---

## 8. Exports

| Export | Content | Library |
|---|---|---|
| **Excel** | Sheet 1: Summary (district-wise totals). Sheet 2: school-wise data (all fields + photo links) | `exceljs` (server) / `SheetJS` |
| **PPT** | Summary slides first (KPIs, district table), then **one slide per school** with photos + key data | `pptxgenjs` |

- Small exports (one school or block) can be generated directly.
- **Large exports** (a full district or the whole state, thousands of slides) run as a **background job on the server**. The user gets a download link when the job finishes.
- PPT size note: embed **compressed thumbnails** in slides, not full-size photos, otherwise the file will be GBs.

---

## 9. Proposed Architecture

```
 ┌──────────────────────┐      ┌──────────────────────┐
 │  React Dashboard     │      │  Field PWA (React)   │
 │  (Vite, Map, Charts) │      │  camera + GPS        │
 └──────────┬───────────┘      └──────────┬───────────┘
            │  REST (JWT)                 │  upload via pre-signed URL
            ▼                             ▼
 ┌──────────────────────┐      ┌──────────────────────┐
 │  Node.js / Express   │─────▶│  Object Storage      │
 │  API                 │      │  (S3 / DO Spaces)    │
 └───┬─────────┬────────┘      └──────────▲───────────┘
     │         │ job queue (BullMQ+Redis)  │ read image
     ▼         ▼                           │
 ┌────────┐ ┌──────────────────────┐       │
 │MongoDB │ │ Python FastAPI       │───────┘
 │        │ │ YOLO person counter  │
 └────────┘ └──────────────────────┘
            Export worker (Excel / PPT) → storage → download link
```

**Likely stack (not final):** MERN + Python AI service
- Frontend (**built**, see §15): React + Vite (JS), React Router (`createHashRouter`), Tailwind CSS v4, Framer Motion, React Icons, react-leaflet, vite-plugin-pwa
- Backend: Node.js + Express, MongoDB (Mongoose), JWT auth, BullMQ + Redis
- AI: Python, FastAPI, Ultralytics YOLO
- Storage: AWS S3 / DigitalOcean Spaces (+ CDN for thumbnails)

---

## 10. Data Model Sketch

```js
cities:    { _id, name, district }                       // imported from the client's Excel
users:     { _id, name, username, passwordHash, role: 'admin'|'staff', active, createdBy, createdAt }
visits:    { _id, date, cityId, schoolName, staffId,
             lat, lng, accuracy,
             submittedAt, createdAt }                    // status + headcount derived from photos
photos:    { _id, visitId, type: 'normal'|'headcount',
             url, thumbUrl, hash, lat, lng, takenAt, needsHeadcount,
             ai: { status: 'pending'|'processing'|'done'|'failed', count, boxes[] } }
```
> Put a `2dsphere` index on visit location if map/distance queries are needed server-side.

**API contract (live, v1.2.0).** Full reference: **`docs/SERVER_API.md`**. Server field names (`Full_Name`, `Visit_Date`, `AI_Photos`…) are mapped to app shapes inside `src/services/api/*.service.js`.

```text
POST   /auth.php                 { username, password } → { Token, Username, Full_Name, Role }
POST   /auth.php?do=logout
GET|POST|PUT /Admin/user.php     (admin) list / create / update / enable-disable users
POST   /Staff/visit.php          multipart: visit_date, city, school_name, latitude, longitude, normal_photos[], ai_photos[]
                                 → visit with photos, Face_Count per AI photo, Total_Face_Count (AI runs during the request)
GET    /Staff/visit.php          ?visit_id | city, date_from, date_to, username(admin), limit/offset
                                 → { Cities[], Totals, Total, Data[] }  (staff: own visits, admin: all)
Auth: Bearer token. A 401 sends the user back to /login.
```

How the app uses it: visits are **drafted on the phone** (IndexedDB) and the whole visit is uploaded in one request on **Submit**. No signal → it waits ("Waiting to upload") and uploads by itself when back online. The admin dashboard reads `Admin/dashboard.php` (one call per month, server v1.5.0); photos come from S3 signed links or local `uploads/`.

---

## 11. Scale & Storage Estimate

| Item | Estimate |
|---|---|
| Schools | 6,000 |
| Photos | ~90k – 1.08 lakh |
| Size per photo (compressed) | ~300–500 KB |
| **Total storage** | **~40–55 GB** (+ thumbnails ~3–5 GB) |
| AI inference | ~1 lakh images, batch on CPU is fine |

- Always serve **thumbnails** in lists, the map and the gallery. Load the full image only when clicked.
- Use pagination / server-side filtering everywhere. Never load 6000 rows with photos at once.

---

## 12. Work Split

| Area | Owner |
|---|---|
| Dashboard, Map view, Activity view, charts | **Me (Client)** |
| Field capture PWA (camera, GPS, compression, offline) | **Me (Client)** |
| Export buttons / download UI | **Me (Client)** |
| Auth, APIs, DB, master data import | Colleague (Server) |
| Storage, pre-signed uploads, queue | Colleague (Server) |
| Python AI counting service | Colleague / me, TBD |
| Excel / PPT generation (background jobs) | Colleague (Server) |

**First thing to agree on:** the API contract (endpoints + JSON shapes), so both sides can build in parallel. I can use mock data until the APIs are ready.

---

## 13. Phased Roadmap

| Phase | Scope |
|---|---|
| **0. UX (done)** | Penpot: foundations, IA, wireframes, hi-fi desktop + mobile, clickable flows |
| **0.5 Frontend (done; auth + users on the real API)** | Login, staff visit flow (details → photos → headcount → AI summary), admin dashboard, visits, detail, map, users |
| **1. Foundation** | Backend: auth + 2 roles, users, cities import (Excel → DB), visit + photo upload API, storage |
| **2. Monitoring** | Dashboard KPIs, charts, **Map view**, **Activity view** with filters |
| **3. AI** | YOLO counting service, queue, bounding-box overlay, auto-flagging, verify/flag flow |
| **4. Reports** | Excel + PPT exports with summary, background jobs, polish, performance |

---

## 14. Open Questions for the Client

Asked in the Penpot file ("★ Start here" page and page 01):

1. Do they have a **school master list** (UDISE code, name, district, block, **lat/long**)?
2. Does the Admin only **verify** the AI count, or also set a **final count**?
3. Is the AI count used for **billing/payments**? (This decides how strict verification must be.)
4. Language: **English only, or Odia too**?
5. PPT format: **one slide per school** or per district? Should we use a branded template?
6. Exact **district list** (18 or 20? Is it a programme-specific grouping?)
7. **Programme name and logo** for the app and reports.
8. **Data retention** period for the photos?

Also still to confirm:
- The client asked for a **login picture**. We dropped it (GPS + time come from the photos instead). Confirm this is OK.
- Hosting: our cloud or **government cloud / NIC**? Any data-residency rules?
- **Timeline**, and when does the field activity start?
- The **city Excel**: which columns (city, district, …)? Does it also list schools? (If yes, school name becomes a pick list.)
- **Colours, logo and assets** for the app.
- The client also asked for **collateral / closing photos** and a **principal-signed letter**. The design has only Normal / Headcount photos. Add a "Letter" group if still needed (`PHOTO_TYPES` in `src/constants/visit.js`).

---

## 15. Frontend (React) — how it is built

**Run:** `npm install` → `npm run dev` (open the URL, app uses `#/` routes). `npm run build` → static files in `dist/` (host anywhere). `npm run lint`.

**Login:** real accounts from the server. The first admins are `EMP001` / `EMP002` (created by the server's `setup.php`; passwords from the server `.env`, ask the server owner). Create everyone else under **Users**. No demo logins exist in the app. Uploaded visits come from the server. Drafts (not yet uploaded) live on the phone in IndexedDB (`my-workbench`: `drafts`, `photos`).

**Settings:** everything is in `src/config/config.js` (no `.env` files):
- `BASE_URL_SERVER`: the PHP API (`http://192.168.1.88/long_term_project/Horlicks_School_Tribes/API`). The app always calls `API_PROXY` (`/server-api/…`) on its own site; `npm run dev` / `npm run preview` forward it to `BASE_URL_SERVER`, and in production the web server must do the same (Apache/nginx snippets in `docs/SERVER_API.md` → Deploying). This avoids mixed-content blocking on https and works for phones off the LAN.
- `appName`, `totalSchools`.

**Client branding:** Horlicks palette from the Penpot design as Tailwind tokens in `src/index.css` (`brand-*` navy, `accent-*` red, `sun-400`, `cream`, `page`); logo is the client's Horlicks wordmark + orange chevron, rebuilt as SVG from their envelope PDF (`raw-assets/`): `src/assets/horlicks-logo.svg` (navy, for light backgrounds) and `horlicks-logo-white.svg` (for navy backgrounds); app icon `public/icon.svg`. Client creatives are reviewed in `design-export/CLIENT-CREATIVES.md`.

```text
src/
├── components/ui/        Button, Input, Select, Card, Badge, Avatar, Modal, Spinner, EmptyState
├── components/common/    PageHeader (admin), TopBar + BottomBar (staff phone), Logo
├── config/config.js      all app settings
├── constants/visit.js    photo types, visit statuses, roles
├── features/
│   ├── auth/             AuthProvider, useAuth, RequireRole
│   ├── visits/           VisitDetailsForm, PhotoGrid, HeadcountSummary, VisitDetail, VisitCard, useVisit
│   ├── monitoring/       KpiTiles, CityChart, VisitsTable, Filters, VisitsMap
│   └── users/            UserForm, UserTable
├── hooks/useGeolocation.js
├── layouts/              AdminLayout (sidebar), StaffLayout (mobile header)
├── pages/                LoginPage, NotFoundPage, admin/*, staff/*
├── routes/index.jsx      createHashRouter + role guards
├── services/api/         client.js (axios + token + errors), auth.service, users.service, visits.service (all server)
├── services/drafts/      draftStore.js (offline drafts in IndexedDB), uploadQueue.js (submit + auto-upload when online)
└── utils/                compressImage.js (canvas → JPEG), format.js, downloadCsv.js
```

Pages only import from `*.service.js`. When the server adds visit endpoints, replace the exports in `visits.service.js` with axios calls (same pattern as `users.service.js`); no page changes needed.

**PWA (install + offline):** `src/features/pwa/`, configured in `vite.config.js`.
- Installable on Android, iOS and desktop (manifest, PNG + maskable icons, `apple-touch-icon`, iOS meta tags). Icons are the client logo on navy (`#002F85`).
- **Install sheet** opens by itself on a first visit, or from **Install app** on the login page, the staff header and the admin sidebar; closing it with ✕ keeps it closed for 7 days. Hidden once installed. Flow per device:
  - **Android / desktop Chrome, Edge, Samsung:** waits for the browser's install event, then shows only **Install app** + ✕ (one tap opens the native install dialog; an "Installed!" notice follows). Falls back to ⋮ → Install app steps if the event never comes (e.g. Firefox).
  - **iPhone / iPad:** 4 illustrated steps (Share → Add to Home Screen → keep "Open as Web App" on → Add → open from Home Screen), a bouncing arrow pointing at Safari's Share button (card moves to the top on iPhone so the toolbar stays visible), and a note that drafts live in the Home Screen app, not Safari (iOS keeps their storage separate).
  - **In-app browsers** (WhatsApp, Instagram, Facebook): open in Safari/Chrome first + copy link. **Mac Safari:** File → Add to Dock.
- **Offline:** the app shell is pre-cached; Google Fonts and OpenStreetMap tiles are cached as viewed; real-API `GET`s use network-first with a 7-day offline copy (cache `api`, cleared on logout). An offline / back-online notice is shown.
- **Drafts on the device:** visits and full-quality photos are stored in **IndexedDB** (`src/utils/idb.js`), not localStorage (~5 MB), so a whole day of visits fits. Persistent storage is requested on the first visit so the phone doesn't clear it. The photo screen says "Saved on this phone". Signing in needs internet once (clear message when offline); after that staff can work fully offline. Drafts are kept on logout.
- **Updates** use `registerType: 'prompt'`: a "new version, Reload" toast, so a visit in progress is never reloaded. Open tabs check for updates hourly.
- **Upload queue:** Submit uploads the whole visit (progress %, then "AI is counting…"). Without internet the visit is queued ("N waiting to upload") and sent automatically when back online, on app start and every minute while open (Android and iPhone both upload while the app is open). A server validation error marks the draft "Needs a fix" with the reason. Uploaded drafts are removed from the phone.
