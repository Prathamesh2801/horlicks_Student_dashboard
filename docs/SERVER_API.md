# Server API reference: Horlicks School Tribes API

> **Saved copy** of the server team's docs, taken **17 Nov 2026** (API **v1.1.1**).
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
| Not on the server yet | Visits, photos, AI headcount, dashboard stats, cities: [`visits.service.js`](../src/services/api/visits.service.js) / [`cities.service.js`](../src/services/api/cities.service.js) use in-browser sample data until the endpoints exist |
| Dev proxy | In `npm run dev`, calls go to `/server-api/…`, which Vite forwards to `BASE_URL_SERVER` (so phones on an https tunnel work). Production builds call `BASE_URL_SERVER` directly |

**Field names.** The server uses `Full_Name`, `Role: "Admin"`, `Status: "Active"`; the services convert to the app's
`{ username, name, role: 'admin' | 'staff', active, signedIn, createdAt }` so pages never see server field names.

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

New protected endpoints include `function.php` and call `verifyTokenAndGetData()` (returns `['username' => …, 'role' => …]` or sends the `401` itself).

## Changelog (server)

| Date | Version | Change |
|---|---|---|
| 2026-11-17 | 1.1.1 | Added `PERSON_COUNTER_API_URL` to `.env` (external Person Counter service) |
| 2026-11-17 | 1.1.0 | Added `Admin/user.php` (list/get, create, update, enable/disable; Admins only), Try-it console, PUT body support, Authorization header pass-through |
| 2026-11-17 | 1.0.0 | Initial docs: login/logout by `Username`, config in `.env`, header-only tokens, logout at `POST auth.php?do=logout`, proper status codes, log redaction |

## Still needed from the server (for this app)

These screens run on sample data until the endpoints exist (shapes the frontend expects are in `PROJECT_IDEA.md` §10):

- [ ] Cities list (from the client's Excel)
- [ ] Visits: create, list (filters: mine, city, status, search, month), get one
- [ ] Photos: upload (`normal` / `headcount`, GPS + time), delete
- [ ] Submit visit → send headcount photos to the Person Counter service (`PERSON_COUNTER_API_URL`) → store counts
- [ ] Dashboard stats (by month)
- [ ] Excel / PPT export
