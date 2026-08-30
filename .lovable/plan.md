# Nyrava Guardians — Page Build Plan

## Current state (verified)
Foundation already exists:
- Design system in `src/styles.css` (dark navy + per-guardian neon tokens)
- Guardian portraits, robot, and logo cropped into `src/assets/guardians/`
- Types (`src/types/index.ts`), data (`guardians.ts`, `world.ts`), mock services (`src/services/mock/index.ts`)
- `GuardianProvider` (XP/level/progress persisted in localStorage), `AppShell`, `ProgressBar`
- Routes: only `__root.tsx` and a placeholder `index.tsx` — no pages yet

## What will be built

Seven routes, all wired through the existing mock-service boundary and Guardian context:

1. **Welcome / Guardian Selection (`/`)** — rewrite placeholder. Hero with logo, the five guardian cards (Lex, Nova, Tess, Byte, Echo) with portraits and personality blurbs, plus the AI robot. Selecting a guardian stores the choice in context and routes to `/personalize`.

2. **Personalization (`/personalize`)** — name the guardian, pick color accent (from guardian token palette), choose a starter value (Protect / Think / Respect). "Enter Nyrava" CTA goes to `/home`.

3. **Guardian Home / HQ (`/home`)** — dashboard: level + XP progress bar, current objective (from `NEXT_OBJECTIVE`), quick links to World / Academy / Missions / Builder, recent achievements.

4. **World Map (`/world`)** — stylized map of zones (AI Academy, Future Lab, etc. from `WORLD_AREAS`); each zone card shows lock/unlock state and links into Academy or Missions.

5. **Academy (`/academy`)** — list of learning labs from `ACADEMY_LABS` with difficulty, XP reward, and mastery tags.

6. **Mission Hub (`/missions`)** — mission list plus one playable interactive scenario: the "Stranger in DMs" chat simulation — a fake DM thread where the child picks safe responses, earns XP, and gets feedback per choice. Completing it updates XP/level via context.

7. **AI Builder (`/builder`)** — mock AI creation pipeline: child describes a creation, picks a guardian helper, the mock `BuilderService` simulates generation steps and returns a result card.

8. **Intelligence Core (`/core`)** — mastery/skill view from `MASTERIES` with per-skill progress and guardian values.

## Shared work
- Wrap `__root.tsx` content in `AppShell` (nav with logo + guardian XP chip) and `GuardianProvider` if not already mounted there.
- Every route gets its own `head()` with unique title/description/og tags; favicon from `src/assets/guardians/logo.png`.
- Update `roadmap.md` checkboxes as pages land.

## Technical notes
- TanStack Router file routes; `createFileRoute` strings match filenames exactly.
- All data flows through `src/services/mock/` (Antigravity swaps in real APIs later); no backend, no auth in this phase.
- Progress/state stays in `GuardianProvider` + localStorage.
- Build order: selection → personalize → home → missions (the core interactive piece) → world → academy → builder → core → metadata/polish.

## Out of scope (this phase)
- Real AI, backend, accounts, or multiplayer — the mock service boundary is the contract for later integration.
