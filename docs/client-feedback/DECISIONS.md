# Our decisions vs the client feedback

Source: [2026-11-20-revised-scope.md](2026-11-20-revised-scope.md). Full breakdown: [../CLIENT_SCOPE_GAP.md](../CLIENT_SCOPE_GAP.md). Meeting questions: [../CLIENT_MEETING_QUESTIONS.md](../CLIENT_MEETING_QUESTIONS.md).

**Status:** ✅ same as the client asked · ⚠️ different, confirm with the client · ⏸ on hold

| Client asked | Our decision | Status |
|---|---|---|
| One shared staff login, plus a name dropdown | Keep individual logins. Don't design the shared login or the dropdown until the client decides. | ⏸ |
| Separate admin and client logins | A Client role with a read-only view (Overview, Visits, Map). No users tab and no staff data. | ✅ |
| Targets vs achievement with progress bars, run-rate, required per day and projected finish | **A target per city**, with its own start and finish date (server: `Admin/target.php`). The overall target is their total. Admin dashboard: overall card plus a city table (progress, run-rate, needed per day, projected finish, status). | ✅ |
| Client: target vs achievement **by city** | Shown on the client overview: overall, plus each city with a progress bar and projected finish. Needs the server to let Clients read targets (403 today). | ✅ |
| Exports: Excel, CSV, **PDF**, one-click report or **PPT** | **Decided:** visit lists export to Excel and CSV; the campaign report is a **PDF built by the server** (no PPT) | ✅ decided |
| Campaign report with charts and sample photos | **Decided (25 Nov, replaces the link):** the admin picks visits and the **server builds a PDF** to download and share. By default all approved visits matching the filters, or only ticked visits. ★ Best photos first, photo count capped. The earlier report-link idea was dropped. | ✅ decided |
| Client: download the summary report (PDF or PPT) | **Decided:** only the admin generates the PDF and shares the file with the client. The client view has no report button. | ✅ decided |
| Separate client login | A **Client** role is created by the admin on the Users page (roles: Staff, Admin, Client) | ✅ |
| Only completed, verified visits for the client | The admin approves each visit. The client and reports see only approved visits. | ✅ |
| Photo gallery: selected best photos only | Client opens a visit to see its photos: all headcount photos + normal photos the admin set to "Show", ★ Best first. | ✅ |
| Filters on every screen, carried into exports | Date range, city, staff, AI and review filters. Exports follow the filters. | ✅ |
| Hidden from the client: users, staff data, drafts, sync, AI debugging | Hidden, and enforced on the server, not only in the UI | ✅ |
| "Last updated" for the client | Shown on the client overview and in reports | ✅ |
