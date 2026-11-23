# Revised client scope vs current build

This document goes through each statement in the client's revised scope. For each one it says what is already built, what is partly built, what is missing, and who has to act.

**Status:** ✅ Done · 🟡 Partly done · ❌ Not built · 🔁 Conflicts with how the app works today

**Owner:**
- **FE**: this React app
- **BE**: the PHP server
- **Design**: Penpot
- **Client**: we need a decision or data from the client

Related docs: [SERVER_API.md](SERVER_API.md), [SERVER-API-REMAINING.md](../design-export/SERVER-API-REMAINING.md)

---

## 1. Access and login

| # | Client statement | Status | What exists today | What's needed | Owner |
|---|---|---|---|---|---|
| 1.1 | One shared login ID and password for staff | 🔁 | Each staff member has their own username and password. Admin creates them on the Users page (`src/pages/admin/UsersPage.jsx` → `Admin/user.php`). The server writes `Staff_Name` on each visit from the logged-in user. | Create one "Staff" account that everyone uses, and have the app ask for the name on each visit (see 1.2). The server must accept a `staff_name` field on `POST Staff/visit.php` instead of taking the name from the token. Side effect: "My visits" on the phone would show the whole team's visits. | BE + FE |
| 1.2 | Staff pick their name from a dropdown at the start of each visit | ❌ | There is no name field, because the name comes from the login. | **Server:** a list of staff names that admin manages (e.g. `GET Staff/names.php`). **App:** a name dropdown in `src/features/visits/components/VisitDetailsForm.jsx` next to City, which the phone remembers for next time. **Admin:** a simple page to manage the names. | BE + FE |
| 1.3 | Separate admin and client logins | 🟡 | Admin login exists. The only roles are `Admin` and `Staff` (`src/constants/visit.js` ROLES, `src/features/auth/RequireRole.jsx`). | **Server:** a new `Client` role that can only read a client-dashboard endpoint. **App:** a `/client` route group with its own layout, and a "Client" option in the Users role list. | BE + FE |

> **Recommendation:** Logging in per person, as the app does today, gives stronger accountability than one shared login with a name dropdown, because nobody can pick someone else's name. Ask the client whether they will keep individual logins. Build 1.1 and 1.2 only if they say no.

---

## 2. Staff app

| # | Client statement | Status | Explanation |
|---|---|---|---|
| 2.1 | Visit details: date, city, school, staff name | ✅ (staff name 🟡) | Handled in `VisitDetailsForm.jsx`. **Date:** today or earlier. **City:** dropdown from the server list, cached on the phone so it works offline. **School:** free text, 2–150 characters. **GPS and time:** captured automatically and cannot be typed. **Staff name:** comes from the login today and becomes a dropdown if 1.1 goes ahead. |
| 2.2 | Offline mode: visits saved on the phone and synced later | ✅ | Drafts are stored in IndexedDB (`src/services/drafts/draftStore.js`). The automatic upload queue retries when the network returns (`src/services/drafts/uploadQueue.js`). Statuses: Draft → Waiting to upload → Needs a fix → Completed. The app installs as a PWA on Android and iOS. *Possible extra:* a "N waiting to sync" badge in the header. |

---

## 3. Admin dashboard

| # | Client statement | Status | What exists | What's needed | Owner |
|---|---|---|---|---|---|
| 3.1 | Targets vs achievement: progress bars, run-rate, required per day, projected finish date | ❌ | No target data exists anywhere. | **Server:** a targets table, per city: target students and/or schools and/or visits, plus campaign start and end dates. Admin needs a screen to edit it. **App:** progress bars per city and overall, using the formulas below. | BE + FE + Client (target numbers, dates) |
| 3.2 | Cards and charts: average students per visit and per school | 🟡 | The dashboard already has unique students (AI) and visits, so **per visit** = students ÷ visits is a small FE change. | **Per school** needs a count of distinct schools. The server should return `Schools`, which is already requested in SERVER-API-REMAINING.md. School names are free text, so "Govt School Patia" and "Govt. School, Patia" count as two schools. The long-term fix is a master list of schools with a dropdown. | FE (per visit), BE (per school) |
| 3.3 | Filters on every screen (date range, city, staff, status), carried into exports | 🟡 | **Visits page:** city, period (this month / last month / all time), AI status and search. The CSV export uses exactly the filtered rows ✅. **Dashboard:** month picker only. **Map:** no filters. | Add a custom from/to date range and a staff filter (the server already supports `username`). Put the same filter bar on the Dashboard and the Map. Keep filters in the URL, as the Visits page already does. Only completed visits reach the server, so the useful status filters are AI status and verified (see 5.3). | FE (+ BE for date-range params on the dashboard) |
| 3.4 | Exports: Excel, CSV, PDF, and a one-click campaign report or PPT with charts and sample photos | 🟡 | CSV only (`src/utils/downloadCsv.js`). | **Excel:** CSV already opens in Excel. A real `.xlsx` needs the SheetJS library. **PDF:** a print-friendly report page saved with the browser's "Save as PDF" needs no new library. A generated PDF needs jsPDF. **PPT:** `pptxgenjs` (new dependency), with slides for KPIs, the city chart, target bars and sample photos. To embed S3 photos, the bucket needs CORS enabled. | FE (+ BE for S3 CORS) |

**Target formulas for 3.1** (agree these with the client):
- **Run-rate** = achieved ÷ days elapsed
- **Required per day** = (target − achieved) ÷ days left
- **Projected finish** = today + (target − achieved) ÷ run-rate

---

## 4. Client dashboard (read-only)

None of this exists yet, because there is no Client role (see 1.3). Most screens can reuse admin components.

| # | Client statement | Reuse from admin | Still missing |
|---|---|---|---|
| 4.1 | Top KPIs: students reached, schools covered, visits completed, % of target | `KpiTiles.jsx` (students, visits) | Schools count (BE); % of target (needs 3.1) |
| 4.2 | Target vs achievement by city, with progress bar and projected finish | — | All of 3.1 |
| 4.3 | Trend chart over time and city-wise bar chart | `CityChart.jsx` (city bars) | Trend chart: needs per-day or per-week counts from the server, or can be computed from the visit list |
| 4.4 | Average students per visit and per school | Same as 3.2 | Per school (BE) |
| 4.5 | Map of covered schools | `VisitsMap.jsx` | Hide staff names in pin popups for the client |
| 4.6 | Photo gallery of selected best activity photos only | `PhotoGrid.jsx` | **Server:** an `Is_Featured` flag on photos, and the client endpoint returns featured photos only. **App:** an admin "star" button on visit detail to choose them |
| 4.7 | Date and city filters, and download of the summary report (PDF or PPT) | Filter bar from 3.3, report from 3.4 | Comes with 3.3 and 3.4 |
| 4.8 | Hidden from the client: user management, staff-level data, drafts, sync issues, AI debugging | — | Must be enforced **on the server**: the client endpoint never returns these fields. Hiding them only in the UI is not enough, because anyone can read the network response. Drafts and sync issues never reach the server anyway ✅ |

---

## 5. Things to watch

| # | Client statement | Status | Explanation |
|---|---|---|---|
| 5.1 | With a shared login, accountability depends on the staff name: keep the dropdown plus GPS and time stamps | 🟡 | GPS and time stamps ✅: they are automatic and staff cannot edit them. The dropdown depends on 1.2. **Risk:** anyone can pick anyone's name. **Mitigation:** the phone remembers the last name chosen, and the server logs the device and IP for each visit. |
| 5.2 | Show the client a "last updated" time | 🟡 | Admin pages already show "updated HH:MM". The client dashboard should show the same, ideally the server time of the last completed visit. |
| 5.3 | Show only Completed, verified visits so numbers don't change under the client | 🟡 | Only completed uploads reach the server ✅. **No "verified" step exists.** The server needs a `Verified` flag, the app needs an admin Approve/Reject button on visit detail, and the client endpoint must return verified visits only. **Client decision:** do visits where the AI count failed still count? |
| 5.4 | Share the revised UI by tomorrow with the brand logo and city list | 🟡 | Logo ✅ (`src/components/common/Logo.jsx`). The city list comes from `VISIT_CITIES` in the server's `config.php`, so the client must send the final list and the server must update it. The revised UI for the client dashboard, targets and gallery is a **Design** task in Penpot. |

---

## 6. Summary

### Already built
- Individual staff login, plus admin user management (create, edit, disable)
- Visit form: date, city dropdown, school, automatic GPS and time
- Normal photos and headcount photos, with the AI count (unique students and faces including repeats)
- Offline drafts, an automatic sync queue, and PWA install on Android and iOS
- Admin dashboard: unique students, visits, active cities, all-time visits, city chart, recent visits, month picker, auto-refresh, "updated" time
- Visits table with search, city, period and AI filters, sorting and paging, plus a CSV export of the filtered rows
- Map of visits with GPS
- Visit detail page with photos and headcount summary

### Frontend only (can start now)
- Average students per visit
- Custom date range and staff filter
- The same filter bar on the Dashboard and the Map
- Print-to-PDF report page
- `.xlsx` export

### Needs the server first
- Shared login with `staff_name`, and the list of staff names
- `Client` role and a client-dashboard endpoint (read-only, verified visits only, no staff data)
- Targets table and admin editing
- `Schools` count and trend data (per day or per week)
- `Is_Featured` flag on photos and `Verified` flag on visits
- Final city list in `VISIT_CITIES`
- CORS on the S3 bucket, so photos can go into the PPT

### Needs client input
- Shared login or individual logins?
- Target numbers per city, and campaign start and end dates
- Final city list
- Do visits where the AI count failed count toward targets?
- Who chooses the "best" photos for the gallery?

### Suggested order
1. Get the client's decisions (list above)
2. Server: Client role, targets, Verified and Featured flags, Schools count
3. Frontend: targets UI, filters everywhere, average per visit
4. Client dashboard (mostly reused admin components)
5. Exports: PDF report, then PPT
