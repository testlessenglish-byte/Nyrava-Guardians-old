# Nyrava Guardians — Build Roadmap

Frontend foundation per starter package (visual/interactive layer; backend handoff to Antigravity).

- [x] Visual system: dark neon design tokens in src/styles.css (per-guardian colors)
- [x] Brand assets: crop Guardian portraits + logo + AI robot from reference image
- [x] Types + mock services (Guardian/World/Mission/Mastery/Builder/Intelligence contracts)
- [x] App shell with in-world navigation
- [x] Welcome / Guardian selection (/)
- [x] Guardian personalization (/personalize)
- [x] Guardian Home / HQ (/home)
- [x] Guardian World map (/world)
- [x] Academy (/academy)
- [x] Mission Hub with interactive scenario (/missions)
- [x] Intelligence Core (/core)
- [x] AI Builder with mock pipeline (/builder)
- [x] Head metadata per route + favicon
- [ ] Visual pass on mobile viewports
- [ ] Backend handoff: swap mock services for real providers (Antigravity)

- [ ] Replace robot avatar with humanoid armored guardian model (walk/idle animations, per-guardian armor tint)

## World 1 — Isla Central (big spec, staged)
- [ ] Humanoid armored avatar with working idle/walk/run animations (in progress)
- [ ] Isla Central island world: Central City, Forest of Wisdom, Knowledge Mountains, History Valley, Desert Zone, Emerald Beach, Infinite Ocean, Space Port, Academy interior
- [ ] Walkable spatial travel between regions (no click-to-teleport-only), paths/bridges/hidden areas
- [ ] Class 1 "Discover Isla Central": 5 Knowledge Crystals, clue system, 3-level hints
- [ ] Challenges: logic, memory, observation, safety, build, exploration
- [ ] Discovery system: celebration, collection log, XP, guardian reaction
- [ ] Locked areas unlocked by mastery/keys/puzzles (never by time)
- [ ] World map showing discovered/unexplored/locked, no collectible spoilers
- [ ] Class completion requires return to Academy + report
- [ ] Mastery evidence feeds Intelligence Core
- [ ] Keep service-boundary architecture (world data / mission data / progress / AI / mastery separated)

## Isla Central polish pass (Aug 30)
- [ ] Bigger island world (scale terrain + regions), denser props
- [ ] Immersive fullscreen layout for 3D routes (no site chrome overlap)
- [ ] Fix avatar walking backwards (camera-relative input)
- [ ] Camera modes: third-person / first-person (eyes), wheel zoom
- [ ] Click-to-walk to a spot, jump (Space), sprint (Shift)
