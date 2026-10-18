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

*(Append further conversation turns below this line.)*
