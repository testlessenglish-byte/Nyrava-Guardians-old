# Nyrava Guardians

Interactive digital-safety academy built with React, TanStack Start, Three.js and Supabase.
The maintained repository is https://github.com/testlessenglish-byte/Nyrava-Guardians.

## Local development

Use Node.js 22.18+ (or Node.js 24) and npm. Copy the empty variable names from
`.env.example` into an ignored `.env` and configure the new Supabase project's
public URL and publishable key in both `SUPABASE_*` and `VITE_SUPABASE_*` variables.
Never put server credentials in `VITE_*` values. Public Vite values are compiled
into the browser build; server-only values must also be configured in hosting.

Run `npm install`, then `npm run dev`. The local URL is http://127.0.0.1:8080/.
Run `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build` separately.
The tests currently cover public Supabase configuration, not the complete app.
The Cloudflare-compatible deployment artifact is generated in `dist/` and Sites
metadata is maintained in `.openai/hosting.json`.

## Preview limitations

This is a migration preview, not a production-ready release. Supabase is configured
for the new project, but the app has no sign-in/onboarding UI yet. Progress remains
on this browser without a Supabase session. Classroom AI/voice still require the
old provider integration to be replaced, and some product screens use mock services.

See [MIGRATION_STATUS.md](MIGRATION_STATUS.md) for database verification, Auth/RLS
blockers, environment requirements, and remaining Lovable replacement work.
Do not change the old repository or its Supabase project. Do not reapply recorded
migrations or rewrite shared Git history to resolve application errors.
