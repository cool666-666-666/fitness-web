# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A fitness recording web app (健身记录网站) — a full-stack JavaScript application with a vanilla JS frontend, a Node.js/Express REST API backend, and MySQL persistence. The app supports recording workout exercises with sets, reps, and weights, and provides query/ranking features.

## Development commands

All backend commands run from `server/`:

```bash
cd server
npm install                     # Install dependencies (first time)
npm start                       # Production: node server.js
npm run dev                     # Development: nodemon server.js
```

No build step, no test framework, no linter. The frontend is plain HTML/CSS/JS served by Express's `express.static()` from the project root.

## Architecture

### Backend (`server/`)

- **`server.js`** — Express app. Middleware: CORS (allow all origins), JSON body parser, static file serving from project root. Defines six API routes:
  - `GET /api/health` — health check
  - `GET /api/records?days=&action=&latest_only=true` — list records; `latest_only=true` returns only the most recent training day
  - `GET /api/actions` — distinct action names
  - `GET /api/rankings?days=` — action counts grouped by name
  - `POST /api/records` — insert a new record
  - `DELETE /api/records/:id` — delete one record
  - `DELETE /api/records` — clear all records
- **`db.js`** — MySQL connection pool (`mysql2/promise`, 10-connection limit). Auto-creates the `fitness_records` table on startup. Columns: `id`, `action`, `sets`, `reps`, `reps_list` (JSON), `weight`, `weights_list` (JSON), `created_at`, `updated_at`.
- **`.env`** — Database credentials and port (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, PORT). Not committed to git.

### Frontend (root `*.html`, `*.js`, `*.css`)

- **`index.html`** — Two tabs: "训练记录" (record entry + latest-day list) and "训练统计" (query/filter view). Sets `window.FITNESS_API_BASE_URL` for GitHub Pages deployment override.
- **`app.js`** — Single IIFE. Key behaviors:
  - **API_BASE_URL resolution**: Uses `window.FITNESS_API_BASE_URL` if set, otherwise `/api` (same-origin) on localhost, otherwise `hostname:3000/api`. This means local dev with the Express server auto-resolves correctly.
  - **Offline fallback**: On startup, `GET /api/health` checks connectivity. If the backend is unreachable, the app falls back to `localStorage` (key: `fitness_records_web_v1`).
  - **Latest-only display**: The home tab only shows records from the most recent training date. New records trigger `GET /api/records?latest_only=true`, which replaces the entire local state.
  - **Stats tab**: Filters by action name and day range, queries `GET /api/records` without `latest_only`.
  - **localStorage sync**: Records are always written to `localStorage` as a backup, capped at 100 entries.

### Data flow

```
Browser (index.html + app.js) ──HTTP──> Express server (server.js) ──SQL──> MySQL (fitness_records)
       │                                                                       
       └── localStorage (offline fallback / backup)
```

The app is online-first: if the backend is reachable, all reads/writes go through the API. `localStorage` serves as a read-only fallback when offline and a write-through backup when online.

## Key conventions

- The `fitness_records` table uses snake_case columns (`reps_list`, `weights_list`, `created_at`). The frontend normalizes these to camelCase (`repsList`, `weightsList`, `createdAt`) after fetching.
- Record insertion requires `action` and `sets` at minimum. `repsList` and `weightsList` are JSON arrays stored as `reps_list`/`weights_list`.
- The `latest_only=true` query parameter filters to records whose `DATE(created_at)` equals the maximum date in the table — it shows only the most recent training day, not just the most recent N records.
- No authentication/authorization is implemented. CORS is wide open (`*`). This is a development-stage app per the README.

## Auto git commit

After every code change, automatically stage and commit the modified files with a descriptive commit message, then push to remote. No need to ask for confirmation.
