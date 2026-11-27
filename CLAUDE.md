# Horlicks School Activity: project guide

A React PWA for a school-visit campaign in Odisha. The **Ground Team** visits schools and records each visit on their phone: details, geo-tagged photos and class photos. A server AI counts the unique students in the class photos. The **Admin** reviews and approves visits, corrects counts, sets district targets and makes PDF reports. The **Client** and **Auditor** see only approved results.

- Frontend: this repo.
- Backend: a PHP API built by a colleague. The frontend only calls it and never changes it.

Last full update: **27 Nov 2026**, server API **v1.27.0**.

## Commands

```bash
npm install
npm run dev       # vite dev server (host: true, so phones on the LAN can open it); proxies /server-api → PHP API
npm run build     # production build → dist/ AND dist.zip (postbuild: bestzip), dist.zip is what gets deployed
npm run preview   # serve dist/ (also proxies /server-api)
npm run lint      # eslint
```

There is no test framework. Check changes by lint, `npm run build`, and running the app.

## Config (no .env files)

Everything is in `src/config/config.js` and `src/config/brand.js`.

| Setting | Development (local PHP server) | Production |
|---|---|---|
| `BASE_URL_SERVER` | `http://192.168.1.88/long_term_project/Horlicks_School_Tribes/API` | `https://poshansepragati.theeventpics.com/API` |
| `API_PROXY` | `"/server-api"` (http API, so it goes through the vite proxy) | `''` (https API with CORS, called directly) |

- **Before a production build**, switch both values to the production column. Main currently points to the **production** API (since 27 Nov 2026).
- The `192.168.1.88` server is reachable only on the office LAN. At home, use the production API, or ask for access.
- `brand.js` sets the active brand: `{ id: 'horlicks', company: 'Horlicks', fullName: 'Horlicks School Activity' }`.
  - The app name, logo (`src/assets/brand/<id>-logo*.svg`), icons (`public/brand/<id>/`), PWA manifest name and `<title>` all follow it.
  - A `placeholder` brand also exists.
- `config.appName = brand.fullName`.

## Server API

- **Reference:** `docs/SERVER_API.md`.
  - The section "Connected in the app" maps every server feature or version to the app feature.
  - The section "Still needed from the server" is currently empty.
- **Live docs and changelog:** `http://192.168.1.88/long_term_project/Horlicks_School_Tribes/API/` (office LAN).
- **How we work:** the colleague adds a changelog line, then we read the docs and update the app carefully. After that we update `docs/SERVER_API.md`.

Main endpoints, all under `BASE_URL_SERVER`:

| Endpoint | Use |
|---|---|
| `POST auth.php` (login), `POST auth.php?do=logout` | Token login. The session is in localStorage `auth-v2` (`{token, user}`). A Bearer token is sent on every request. |
| `Staff/visit.php` | **GET** list or one visit. Filters: `district`, `status`, `audit`, `username`, dates, `school_type`; paging with `limit` / `offset`. The response also includes `Options.Districts`, `Districts` counts and `Upload_Button_Show`. |
| | **POST** (multipart) creates a visit. Fields: `visit_date`, `school_name`, `latitude`, `longitude`, `district`, `village`, `udise`, `school_type`, `class_category` (1/2/3 = classes 1–3/4–6/7–9), `poc_name`, `poc_contact`, `start_time` (HH:MM IST). Photos: `normal_photos[<category_key>][]` with `normal_photos_meta[<key>][]` (JSON `{lat,lng,accuracy,taken_at}`), and `ai_photos[]` with `ai_photos_meta[]`. |
| | **PUT, Admin:** `status` (Pending/Approved/Rejected), `approved_normal_photo_ids` (the "Show" toggle), `best_normal_photo_ids` (★), `retry_ai_count`. |
| | **PUT, Auditor only:** `is_audit_pass`, `auditor_comment`. |
| `Admin/user.php` | Users CRUD. Roles: Staff (UI label "Ground Team"), Admin, Client, Auditor. |
| `Admin/visit_form.php` | Form settings. **GET** returns `Fields[]` with `Show` / `Required`, plus `Upload_Button.Show`. **PUT** `{fields:{poc_name:{show,required}, poc_contact:{…}}, upload_button:{show}}`. |
| `Admin/visit_count.php` | **PUT** `unique_person_count` and/or `collateral_count`. **GET** `?visit_id=` returns the change history (with a `Count` field). |
| `Admin/target.php` | One visit target per **district**, each with its own start and finish date. GET / POST / PUT / DELETE. Clients and Auditors can only read. `Done` counts **Approved visits only** (v1.27). `Waiting` (pending visits) is sent to Admins only. |
| `Report/report.php` | **POST** `{visit_ids (max 50), as_role:'Client'}` queues a PDF. **GET** polls the status: Pending / Working / Done / Failed, plus `Pdf_Url`. **PUT** retries. |

Server field names are PascalCase (`Visit_ID`, `District`, …). They are mapped to camelCase in `src/services/api/*.service.js`. A component never reads server fields directly.

## Architecture

```
src/
  config/          config.js (API URL, proxy), brand.js
  constants/visit.js  ROLES, PHOTO_CATEGORIES, MAX_PHOTOS (normal 20, headcount 10), SCHOOL_TYPES,
                      CLASS_CATEGORIES ('1'..'3'), DISTRICTS (offline fallback list), AUDIT, REVIEW, PERIODS
  services/api/    client.js (axios instance, auth store, error → readable message, fileUrl)
                   visits / users / targets / reports / settings / auth .service.js (server ↔ app mapping)
                   pending.service.js (pendingEvents + notifyChange: screens reload after a change)
  services/drafts/ draftStore.js (IndexedDB drafts + photo blobs, db "my-workbench"), uploadQueue.js (offline queue, retry every 60 s)
  features/        auth (AuthProvider, RequireRole, useAuth), visits (form, photo grid, detail cards), monitoring
                   (KPIs, charts, map, TargetCard, exportRows, useCampaign), users, pwa (install prompt, iOS steps)
  pages/           staff/ (Ground Team phone app), admin/, client/ (Client + Auditor), LoginPage
  layouts/         StaffLayout (phone), AdminLayout + ClientLayout (sidebar)
  routes/index.jsx hash router: /login, /staff/*, /admin/*, /client/* (client, auditor, admin-preview)
  components/      ui/ (Button, Input with `error` prop, Select, Card, Modal, Badge…), table/ (useTableState, filters,
                   pagination), common/ (ExportMenu, TopBar, BottomBar, Logo)
  hooks/           useAsync, useGeolocation, usePendingChanges
  utils/           compressImage (resize + geo-stamp strip under the photo), downloadXlsx (multi-sheet, HYPERLINK cells),
                   downloadCsv, format, idb
```

Patterns to keep:
- **Data loading:** `useAsync(loadFn)`, `useTableState` for lists (filters in the URL), and `usePendingChanges(reload)` so a screen refreshes after a save elsewhere.
- **Services** throw `Error`s with a user-readable message (`client.js` `toError`). Show `err.message` as is.
- **Styling:** Tailwind 4 with the brand colours (`brand-*`, `accent-*`). Icons come from `react-icons/md`. Motion uses `framer-motion`.
- **Libraries:** keep them few. The current ones are axios, leaflet / react-leaflet, write-excel-file and framer-motion.
- **Admin form settings** are read with `getFormSettings()`. They are cached for offline use, and every setting defaults to on.

## Roles and what each sees

**Ground Team** (server role `Staff`), on the phone, works offline:
1. **Visit details form** (`VisitDetailsForm.jsx`), in this field order:
   - Date
   - District (required; list from the server)
   - Village
   - UDISE (digits only, **max 15**; there is no exact-length rule)
   - School name
   - School type and Class category
   - POC name and Contact number. These are shown, and required, only when the Admin turns them on. Contact is 10 digits starting 6–9.
   - GPS and start time are captured automatically.
   - Red field errors appear, and a "missing" list sits above Continue.
2. **Photos** (`VisitPhotosPage.jsx`):
   - **Normal photos:** choose a category first, then take the photo.
     - The categories are Reporting, Collateral, Activity, Gratification, Sample Distribution and Closing.
     - Each photo is stamped with location, time, school and category, and its GPS meta is sent.
   - **Headcount · AI:** 5–6 class photos.
   - **Upload button:** when the Admin's Settings switch is on, both tabs show **Take photo + Upload** (gallery). Off means camera only.
   - The Ground Team never enters a manual student count.
3. **Saving and upload:** drafts are saved on the phone, then the upload queue sends them. The AI count runs on the server in the background.

**Admin** (desktop):
- **Dashboard:** KPIs, district target card, visits by district chart, recent visits.
- **Visits:** filters, Approve, and Excel/CSV export.
- **Visit detail:**
  - HeadcountSummary
  - **Admin controls:** Unique students and Collateral Count, with change history and no reason field
  - Review (Approve/Reject, "Set by …")
  - Audit result (read only)
  - Per photo: Show / ★ Best
- **Other pages:** Map, Users, Target (per district), Reports (PDF, "Client version" by default, or "Internal"), Settings (3 switches: POC name, Contact number, Upload button).

**Client:** read only, **approved visits only**, with no POC and no Ground Team data. Pages: Overview (KPIs, target by district, trend, charts), Visits (with Audit column and filter), Map, and Visit detail.

**Auditor:** the client view, plus Approve / Reject on each visit's audit.
- A remark is required to reject.
- The audit can be changed at any time.
- Admin and Client can see the audit result; the Ground Team never does.

Admins can open the client view as "Preview client view".

## Key business rules (client decisions, 26–27 Nov 2026)

**Visit form**
- District replaced City everywhere. The UI says "District". In the code the property is still called `city`, so `city = District`.
- Class category: 1–3 / 4–6 / 7–9, sent as server codes 1/2/3.

**Counts**
- Unique students: the AI count, which the Admin may correct.
- Collateral Count: entered by the Admin, below Unique students.

**Targets**
- Only **Approved** visits count, for every role, so every role sees the same number.
- When a visit is approved, the target goes up. If it is rejected later, it goes back down.
- The admin also sees "+ N waiting for review".

**Exports and reports**
- Excel export has two sheets: Visits, and Photos (photo link, lat/lng, accuracy, time). This is available on Visits and Reports.
- Reports are server-built PDFs (max 50 visits). There are no shareable report pages and no PPT.

**Other**
- Visits by district chart: the dark bar marks the district (or districts, on a tie) with the most visits.
- Bulk approve is not needed.
- History of decisions: `docs/client-feedback/DECISIONS.md`, `docs/CLIENT_SCOPE_GAP.md`, `docs/UPDATED_REVISED_PROJECT_SCOPE_CHANGES_v2.pdf`.

## Design files for the client

- `design-export/Horlicks-School-Activity-App-UI-Draft-4.pdf` is the latest client deck, with 30 slides of real app screenshots.
  - The Ground Team form is shown with POC hidden.
  - The footer still says "UI Draft 3".
  - Slides P2 and P5–P7 (native Chrome / Safari install screens) still show the old name "My Workbench". They need fresh phone screenshots.
- Penpot holds the page "★ Horlicks — App UI v3 (for client)", edited through the Penpot MCP plugin. Screenshot and PDF scripts were temporary (not in the repo). To redo them, use puppeteer-core with a request-intercepting mock of the API, then render the slides as HTML to a PDF.

## Working rules

- **Commits:** commit or push only when the user asks. Pushes go to `main`. Commit messages are short, one line plus details if needed.
- **Secrets:** never commit or type real credentials or tokens. `raw-assets/` is not for git. `dist/`, `dist.zip` and `dev-dist/` are git-ignored.
- **Client-facing wording:** plain and simple English. Say "Ground Team", not "Staff". The client view never says "approved". Say "District", not "City".
- **Scope:** do client feedback in small parts, one at a time. Frontend-only parts go first, then parts that need the server.
- **Keep it simple:** reuse what exists and add no new libraries without a reason.
- **After a server changelog update:**
  1. Read the docs.
  2. Update the matching `*.service.js` mapping first, then the UI.
  3. Update `docs/SERVER_API.md` ("Connected in the app" table and version).
  4. Run lint and build.
