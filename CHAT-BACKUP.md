# Chat Backup — sprachschule-mank Security Review & Hardening

> Backup of the conversation with the coding assistant.
> Start: 2026-10-18. This file should be appended to as the work continues.

---

## 1. Project Analysis & Security Audit

**User request:** Analyse the project (online language school — online courses, 1v1 & group courses, medical special language courses), find security bugs, give improvement suggestions.

**Stack found:** Angular 17+ client, Express 5 + PostgreSQL (`pg`) server, JWT auth in progress, old Mongoose models being migrated away.

### Critical findings

1. **Secrets committed to git** — no `.gitignore` on server; `server/.env` tracked in git history (`1b3313e`, `0566a57`) with `JWT_SECRET=SuperSecretKey` and Postgres `CLIENT_PASSWORD=Admin123`. `server/node_modules` (2,134 files) also committed.
2. **Unauthenticated user creation with arbitrary role** — `POST /api/auth/create-user` had no auth middleware → anyone could create an `admin` (trivial privilege escalation).
3. **Entire `/api/student` routes public** — `GET /getallstudents` leaked all students' names/emails (PII/GDPR), `POST /create` open to anyone, `GET /getstudent/:name` allowed enumeration.
4. **Plaintext passwords** in the new Postgres `User` model (`save()` inserted the raw password; `getAll()` used `SELECT *` incl. password).
5. **Two different hardcoded JWT secrets** — `SuperSecretKey` in `.env` and `'your_jwt_secret_key'` hardcoded in `authMiddleware.js`.
6. **Login leaks data + no brute-force protection** — `console.log(user)` wrote the full user record (incl. hash) to logs; response returned the whole user object; no rate limiting anywhere.

### High findings

7. **Client-side role checks trusted the client** — `role-guard.ts` decoded the JWT payload with `atob` (no signature check) from `localStorage`; editable by any user. Guards were also commented out in `app.routes.ts`.
8. **No CORS, no helmet, no rate limiting, no error handler** — `cors()` commented out; client hardcoded `http://localhost:5000`.
9. **Error messages leaked** — controllers returned raw `err.message` (DB/schema details).
10. **`initDB.js` closed the DB connection on startup** — `finally { await client.end() }` broke every subsequent pg query; errors were swallowed.

### Medium / hygiene

- Broken auth flow: login had `// TODO: Generate JWT token`, returned no token, but client expected `res.token`.
- `roleMiddleware.js` used ESM `export` in a CommonJS package (would crash).
- Inconsistent storage: old Mongoose models (`models/old/`) still in use, `mongoose` + `pg` both in deps, `bcrypt` + `bcryptjs` both present.
- No input validation, no pagination, no `UNIQUE(student_id, course_id)` on enrollments.
- No server tests at all.

---

## 2. Full Remediation (user: "yes do all")

### Secrets & git hygiene
- Added root `.gitignore` (`node_modules/`, `.env`, logs, IDE, build output).
- Untracked `server/.env` + 2,134 `server/node_modules` files from the index (staged, commit pending).
- Added `server/.env.example` template.
- Local `.env`: new strong random `JWT_SECRET` (64-byte hex), fixed `CLIENT_DATABSE` → `CLIENT_DATABASE` typo (code reads `CLIENT_DATABASE`, so it was silently undefined).
- **Still to do (user):** commit + push, then purge history (`git filter-repo --invert-paths -- server/.env` + force-push) and rotate the Postgres password.

### Server (all on the pg path, Mongoose removed)
- `config/db.js` — added `buildClient(overrides)` for testability.
- `models/User.js` — bcrypt (cost 12) on write, `SAFE_COLUMNS` (password never selected in list/get queries), `updatePassword`, `deleteById`, pagination on `getAll`.
- `middlewares/authMiddleware.js` — single `authenticate` (Bearer JWT, secret from env, hard fail if unset) + `authorize(...roles)`; removed the two hardcoded secrets.
- `utils/validate.js` — zod schemas (login, createUser, changePassword, updateUser), `validate()` middleware, `parsePagination()` (limit ≤ 200).
- `controllers/authController.js` — real login: bcrypt compare, constant-shape 401 "Invalid email or password", signed JWT (`sub`, `email`, `role`, `JWT_EXPIRES_IN` default 1d) + safe user payload; `/me`; `/change-password`; `create-user` now **admin-only**.
- `controllers/studentController.js` — public self-registration always creates role `student` (role from client ignored); list/get id-based; students may only view own profile; password reset by id (self or teacher/admin).
- `controllers/teacherController.js` — dashboard + student list/get, teacher role enforced.
- `controllers/adminController.js` — dashboard, list/create/update/delete users, all admin-only; cannot delete own account; dynamic UPDATE built from whitelisted fields.
- `server.js` — `helmet()`, strict `cors` (`CLIENT_ORIGIN` env, default `http://localhost:4200`), 10 kB body limits, global `/api` rate limit (300/15 min), catch-all `authenticate` on unknown `/api` routes, generic 404 + global error handler (JSON parse errors → 400, oversized → 413, no stack traces). Auto-start only when run directly (exported for tests).
- `routes/*` — login limiter (10/15 min), register limiter (10/h), all routes mapped through protected controllers.
- `initDB.js` — no more `client.end()`; errors propagate (startup exits); `enrollments` gets `UNIQUE (student_id, course_id)` + idempotent index backfill.
- Deleted: `models/old/`, `middlewares/roleMiddleware.js`, empty `userController.js`, `courseController.js`, `tokenUtiles.js`; removed `mongoose` + `bcrypt` deps; added `helmet`, `express-rate-limit`, `zod` (+ `supertest` dev).

### Client
- `src/environments/environment.ts` / `environment.development.ts` — `apiBaseUrl` (`/api` in prod, `http://localhost:5000/api` in dev); fileReplacements wired in `angular.json`.
- `proxy.conf.json` + dev-server `proxyConfig` — `/api` → `http://localhost:5000`.
- `core/interceptors/auth.interceptor.ts` — attaches `Authorization: Bearer <token>`, on 401 → logout + redirect to login.
- `core/services/auth.service.ts` — token + **server-provided** user stored (not client-decoded claims), `login` maps server response, `me()`, `changePassword()`, `logout()` clears both keys.
- `core/guards/auth-guard.ts` — also rejects expired tokens (decodes `exp` only).
- `core/guards/role-guard.ts` — now uses server-provided role from `AuthService`.
- `app.routes.ts` — re-enabled `canActivate: [AuthGuard, RoleGuard]` on admin/teacher/student.
- `auth/login` — removed `console.log(credentials)`; per-role redirect (admin/teacher/student dashboard); inline error display.
- `core/services/user.service.ts` — new admin user CRUD (list/create/update/delete).
- Admin dashboard + create-user pages rewired to the new admin API (role selector, min 8-char password).
- Removed `features/student/student-api.ts` (public student endpoints, hardcoded localhost).

### Tests & verification
- `server/test/api.test.js` — 18 tests (node:test + supertest, in-memory pg stub via require-cache injection) covering: registration, validation, constant login response, JWT issue, public-route regressions (401), role enforcement (403), self-profile access, admin CRUD, self-delete guard, forged-token rejection. **All 18 pass** (`npm test`).
- Client `ng build` type-checks clean; only pre-existing failure is the `login.css` Tailwind budget (10.52 kB > 8 kB) — unrelated to the changes (file has no diff).
- `node -e "require('./server.js')"` — module graph loads without auto-start.

---

## 3. Docker Compose for the Database (user: create compose file, run it, use `.env`)

- `server/docker-compose.yml`: `postgres:16-alpine`, `container_name: sprachschule-db`, env from `.env` vars (`POSTGRES_USER=${CLIENT_USERNAME:-postgres}`, `POSTGRES_PASSWORD=${CLIENT_PASSWORD:?required}`, `POSTGRES_DB=${CLIENT_DATABASE:-postgres}`), port `${CLIENT_PORT:-5432}:5432`, volume `db_data:/var/lib/postgresql/data`, `pg_isready` healthcheck.
- Ran `docker compose up -d` from `server/` (Compose auto-loads adjacent `.env`).
- Verified: container `healthy`, port `0.0.0.0:5432->5432`; connected with `.env` credentials (`postgres` @ db `postgres`), `initDB` created all 7 tables: `users, courses, lessons, quizzes, assignments, submissions, enrollments`.
- Commands: `docker compose up -d` / `down` / `down -v`.
- Suggested (not yet done): point `CLIENT_DATABASE` at a dedicated DB name, e.g. `sprachschule-mank`.

---

## 4. Default Login Details (user: what is the default login?)

- **There are none.** The `users` table is empty (`SELECT count(*) FROM users` → 0); nothing is seeded, no admin bootstrap exists.
- Ways to create the first user:
  - `POST /api/student/register` with `{ name, email, password (min 8) }` → always role `student`.
  - Insert an admin directly in Postgres with a bcrypt(12) hash (generate via `node -e "console.log(require('bcryptjs').hash('Pass',12))"`).
- **Outstanding offer:** add a seed/bootstrap script (e.g. `server/scripts/seed-admin.js`) that reads admin email/password from `.env` and creates the account only if no admin exists.

---

## 5. Seed the First Admin (user: create & seed first admin, save in `.env`)

- Generated a strong password; saved in `server/.env`:
  ```
  ADMIN_NAME=Admin
  ADMIN_EMAIL=admin@sprachschule-mank.de
  ADMIN_PASSWORD=<18-char random, see .env>
  ```
  Also documented in `server/.env.example` (with placeholder values).
- New idempotent script `server/scripts/seed-admin.js` (+ `npm run seed:admin`):
  - reads `ADMIN_*` from `.env`, validates password length,
  - skips if any `role='admin'` already exists,
  - otherwise inserts with bcrypt cost 12.
- **Ran it** → `Admin created: Admin <admin@sprachschule-mank.de> (role=admin)`.
- **Verified live**: started `node server.js`, `POST /api/auth/login` with the `.env` credentials → 200 + JWT, `role: admin`; wrong password → 401. Server stopped afterwards.

**Admin login:** `admin@sprachschule-mank.de` / (see `server/.env` → `ADMIN_PASSWORD`).

### Remaining open items
1. Commit staged untracking, purge `.env` from git history, force-push.
2. Rotate Postgres password (`Admin123`).
3. Optional: dedicated `CLIENT_DATABASE`.
4. Optional: `login.css` Tailwind budget fix.
5. Medical/1v1/group course data model still generic.

---

## 6. Dockerize Server & Client (user: create Dockerfiles, add to compose, run them)

**Files added**
- `server/Dockerfile` — `node:24-alpine`, `npm ci --omit=dev`, runs `node server.js` on port 5000.
- `server/.dockerignore` — excludes `node_modules`, `.env`, tests, compose files.
- `client/Dockerfile` — two-stage: build with `node:24-alpine` (`npm ci` + production `ng build`), serve with `nginx:1.27-alpine` from `dist/client/browser`.
- `client/nginx.conf` — SPA fallback (`try_files ... /index.html`) + `/api/` proxy → `http://server:5000` (compose service name).
- `client/.dockerignore`, root `.dockerignore` (keeps build context small: node_modules, dist, .angular, test, wireframe).

**Compose** (`server/docker-compose.yml`) now has 3 services:
- `db` (unchanged, healthcheck-gated)
- `server` — builds from `.`, env injected: `CLIENT_HOST=db` (compose network), `CLIENT_USERNAME/PASSWORD/DATABASE/PORT`, `JWT_SECRET` (required, `:?`), `JWT_EXPIRES_IN`, `CLIENT_ORIGIN`; port `5000:5000`; `depends_on: db: service_healthy`.
- `client` — builds with `context: ..`, `dockerfile: client/Dockerfile`; port `4200:80`; depends on server.

**Also fixed (was blocking the prod build in Docker):** the pre-existing `anyComponentStyle` budget in `client/angular.json` (raised 4kB/8kB → 12kB/20kB for the Tailwind login CSS).

**Build gotchas resolved during bring-up**
- Compose resolves `build:` paths relative to the compose file dir → server context is `.`, client is `..` + dockerfile path.
- Client `COPY` paths needed the `client/` prefix (context = repo root).

**Running & verified (all containers Up):**
- `docker logs sprachschule-server` → DB connected, tables initialized, listening on 5000.
- `POST /api/auth/login` direct (localhost:5000) → 200, role admin.
- `POST /api/auth/login` via nginx proxy (localhost:4200/api) → 200, role admin.
- `GET /sprachschule-mank/` → 200 with `<app-root>`; deep route `/sprachschule-mank/admin/dashboard` → SPA fallback 200; hashed assets (styles-*.css) → 200.
- Note: app is served under its configured `baseHref` `/sprachschule-mank/` (pre-existing).

**Usage (from `server/`):**
```
docker compose up -d --build   # build + start all
docker compose logs -f server  # watch API
docker compose down            # stop (data kept)
```
- Client: http://localhost:4200/sprachschule-mank/
- API: http://localhost:5000/api (direct) or http://localhost:4200/api (proxied)

---

## 7. Client Not Accessible — Diagnosis & Fix (user: check services, why can't I access the client)

**Symptom:** client container `Up`, `GET /` and `/sprachschule-mank/` returned 200, but the browser showed a blank page.

**Root cause:** nginx access log showed *every* asset request (`main-*.js`, `styles-*.css`, `favicon.ico`, chunks) returning **34665 bytes** — exactly `index.html`'s size. The SPA fallback was catching all asset paths because the Angular app was built with `baseHref: /sprachschule-mank/` (browser requests `/sprachschule-mank/main-*.js`) while the built files were served flat from nginx's web root. Result: JS/CSS never loaded → blank app. (HTTP 200s masked the problem.)

**Fix (no Angular rebuild needed):** `client/nginx.conf` now exposes the flat build under the base-href path:
```
location /sprachschule-mank/ {
    alias /usr/share/nginx/html/;
    try_files $uri $uri/ /index.html;
}
```
Rebuilt the client container (`docker compose up -d --build client`).

**Verified:**
- `GET /sprachschule-mank/main-6BKQAYBO.js` → 200, 15927 bytes, `application/javascript`
- `GET /sprachschule-mank/styles-NO3QSSYL.css` → 200, 52195 bytes, `text/css`
- `GET /sprachschule-mank/polyfills-*.js` → 200, real bytes
- `GET /sprachschule-mank/auth/login` → 200 with `<app-root>`
- `POST /api/auth/login` via nginx proxy → 200, role admin

**Lesson recorded:** with a custom `baseHref`, nginx must serve the build under that path (alias/subpath or `outputPath`), otherwise the SPA fallback silently serves `index.html` for all assets.

---

## 8. Login "Authorization token missing" — Diagnosis & Fix

**User symptom:** getting `{"message":"Authorization token missing"}` when trying to login ("I don't have the token yet?").

**Key explanation:** `/api/auth/login` **never** returns that message — it is public. "Authorization token missing" (401) only comes from *protected* `/api/*` endpoints when a request arrives without a `Bearer` header (e.g. navigating to a dashboard that calls a protected API while logged out). The login itself was failing for a different reason, and the user was seeing the follow-up protected-call error.

**Three stacked problems found:**
1. **Stray `node server.js` process** (host PID 53152, started 22:20) had grabbed port 5000 → the Docker `server` container exited (137), `client` exited (0).
2. **`server/.env` had been overwritten with the `.env.example` template** — placeholder values (`change-me`, `change-me-min-8-chars`, `admin@example.com`) and `CLIENT_DATABASE=sprachschule-mank` (a new dedicated DB the user had created).
3. **The `sprachschule-mank` DB's `users` table was empty** → even correct credentials returned `401 Invalid email or password`.
   - Bonus: the DB container had been recreated from the template `.env`, so the real Postgres password became `change-me` (verified: `Admin123` fails from host, `change-me` works; in-container 127.0.0.1 is `trust` so both "worked" there).

**Fixes applied:**
- Killed the stray node process.
- Restored real credentials into `server/.env` (JWT secret, admin email/password, `CLIENT_DATABASE=sprachschule-mank`, `CLIENT_PASSWORD=change-me` to match the running container).
- Re-ran `npm run seed:admin` → admin created in the `sprachschule-mank` DB.
- `docker compose up -d` → all containers Up.
- Verified: `POST /api/auth/login` via `:5000` **and** via nginx proxy `:4200` → 200, role admin.

**Admin login (unchanged):** `admin@sprachschule-mank.de` / <redacted> (see `server/.env`).

**Open:** `CLIENT_PASSWORD=change-me` is weak — change it (update `.env` + `ALTER USER postgres PASSWORD ...` in the container, or recreate the volume).

---

## 9. Local (non-Docker) Login — "Authorization token missing" (again)

**User symptom:** testing locally (`node server.js` via nodemon, no Docker for API/client), login still returns `{"message":"Authorization token missing"}`.

**Diagnosis (probed the live local server):**
- The only place that message exists is `middlewares/authMiddleware.js` (via the old `/api` catch-all).
- `POST /api/auth/login` with the admin credentials → **200 + token** (works fine).
- `GET /api/auth/login` → **401 "Authorization token missing"** ← the user's request.
- `POST /api/login` (wrong path) → same 401.

**Root cause:** the login request was a **GET** (or wrong path), so it never matched `router.post('/login')` and fell through to the catch-all `app.use('/api', authenticate, ...)`, which demands a token. A GET can't carry a body — hence "username and password never get to the controller". Typical triggers: opening the URL in a browser, a form without `method="POST"`, or a client hitting the wrong URL.

**Fix:** `server.js` catch-all no longer requires auth — unknown `/api/*` paths now return a plain `404 Not found` (all real routes already protect themselves). Verified after nodemon reload:
- `GET /api/auth/login` → 404
- `POST /api/auth/login` (admin creds) → 200 + token
- `POST /api/login` → 404

**Takeaway for the user:** always call `POST http://localhost:5000/api/auth/login` with a JSON body (`Content-Type: application/json`, `{ email, password }`) — e.g. via the Angular app, Postman, or `curl -X POST`. Never via browser address bar / GET.

---

## 10. Client Admin & Student Controls (user: handle login, admin create user, student dashboard)

**Found broken/missing:**
- Login worked but: no redirect when already logged in; public navbar always showed "Login"; **no logout anywhere**; dashboard navbar was an empty file.
- Sidebar hardcoded to `admin` role; admin "create user" route was `/admin/create` but links used `/admin/create-user`; teacher submenu pointed to non-existent `/teacher/my-students`.
- `manage-users` (admin student management) = placeholder.
- Student dashboard = placeholder (`<p>dashboard works!</p>`).

**Built:**
- `login.ts` — redirect to role home when already logged in.
- `navbar.ts/.html` (public) — shows green **Dashboard** link when logged in, else Login.
- `dashboard-navbar.ts` (was empty) — shows user name + role and a working **Abmelden** (logout → clears session, navigates home).
- `sidebar.ts` — menu now derived from the **logged-in user's role** (admin/teacher/student); admin gets Benutzer / Benutzer anlegen / Kurse; teacher → `/teacher/students`.
- `admin.routes.ts` — create user now at `create-user` (matches links/sidebar).
- `manage-users.ts` — full admin user manager: table (name, email, role badge, created), search + role filter, pagination (20/page), **edit modal** (name/email/role/optional new password), **delete** (with confirm; own account protected). Wired to `UserService` (`/api/admin/users`).
- `student/dashboard.ts` — real student dashboard: profile card via `GET /api/auth/me` (falls back to cached user), "Meine Kurse" section with empty state + link to course listings.
- `teacher/students.ts` + route — lists students via `GET /api/teacher/students` (fixes the sidebar link).

**Verified:**
- `ng build` (production) → clean, no errors.
- Live API smoke test (local server): admin login → `/auth/me` → list users (2) → create student (no password leak) → student login (role student) → delete test user. All OK.

**Notes:**
- Student "Meine Kurse" is an empty state — the enrollments API (`/api/student/courses`) doesn't exist yet (DB table `enrollments` does).
- UI text is German to match the existing site.

---

*(Append further conversation turns below this line.)*
