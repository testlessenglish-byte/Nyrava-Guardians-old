# Repository safeguards

- Work only in `testlessenglish-byte/Nyrava-Guardians`.
- The source repository `testlessenglish-byte/nyrava-watchful-heart` is read-only.
- Never modify, link, migrate or reset the old Supabase project.
- Keep the source remote's push URL disabled and never force-push shared history.
- Keep `.env*` (except the empty `.env.example`) and Supabase CLI state out of Git.
- Never place service-role keys, private API keys or access tokens in browser variables.
- Use npm and `package-lock.json` for the maintained build. `bun.lock` is historical.
- Review migrations before remote operations; configuration alone is not permission to apply SQL.
- Preserve the app's React/TanStack/Three.js architecture and existing design.
- Consult `MIGRATION_STATUS.md` for known incomplete features before describing the app as production-ready.
