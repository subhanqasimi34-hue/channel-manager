# Channel Manager Dashboard (Vercel)

## Setup
- Node 18 on Vercel, `package.json` uses `"type": "module"`.
- Copy `.env.example` to `.env` and fill:
  - `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`
  - `JWT_SECRET`
  - `BOT_TOKEN`, `OPENAI_API_KEY` (for bot/vision), `OWNER_IDS` (comma-separated), `POST_LOGIN_REDIRECT` (optional)

## Deploy
- Push to Vercel with included `vercel.json`.
- API routes live under `/api/*`, static under `/public/*`.

## API Routes (serverless, no Express)
- `GET /api/auth` → Redirect to Discord OAuth.
- `GET /api/auth/callback` → Exchange code, set session cookie, redirect to dashboard.
- `GET /api/user` → Current user/session info.
- `GET /api/guilds` → Guilds from session.
- `POST /api/analyzeImage` → Analyze screenshot (placeholder returns stub).
- `POST /api/analyzeText` → Parse text to structure.
- `POST /api/cloneServer` → Queue clone (stub).
- `POST /api/applyTemplate` → Queue apply template.
- `GET /api/getTemplates` / `POST /api/saveTemplate` → Template store (in-memory demo).
- `GET /api/admin/logs` / `POST /api/admin/restart` → Owner-only.

## Frontend
- `public/index.html` landing/login.
- `public/dashboard.html` main UI (calls `/api/*`).
- `public/dashboard.js` and `public/scripts/ui.js` handle navigation and API calls.
- `public/style.css` + `public/styles.css` share the theme.

## Security
- JWT session signed with `JWT_SECRET`, stored as HttpOnly cookie `cm_session`.
- Owner gates use `OWNER_IDS`.
- Secrets never exposed to frontend; bot/OpenAI calls must stay server-side.

## Development
- Uses native `fetch` (Node 18).
- Templates stored in-memory for demo; replace with DB/cache in production.
- Add your bot/OpenAI integrations where marked TODOs.
