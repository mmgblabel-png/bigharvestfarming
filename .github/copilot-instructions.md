# Big Harvest Copilot Instructions

You are an AI coding agent working in this repository. Your goal is to make pragmatic, incremental improvements without breaking existing behavior.

## Architecture Overview
- Backend: `Flask` in `web_app.py` serving static frontend and JSON APIs.
- Frontend: `static/` with `index.html`, `style.css`, and `game.js` (core logic, rendering, autosave).
- Saves: Per-profile JSON files under `saves/<profile>.json` (created on demand). Legacy single file `game_state.json` can be forced via `BHF_STATE_FILE`.
- Tests: `tests/test_api.py` for API basics (pytest).

## HTTP API
- `GET /api/state[?profile=name]`: Returns current game state JSON. Profile also accepted via `X-Profile` header.
- `POST /api/state[?profile=name]`: Saves posted JSON verbatim to the profile file.
- `POST /api/reset[?profile=name]`: Resets the profile to default state.
- `GET /api/health`: Simple health check.

Profiles vs single-file saves:
- If `profile` is provided (query or `X-Profile`), state is read/written under `saves/<profile>.json`.
- If no profile is provided and `BHF_STATE_FILE` is set, that file is used instead of per-profile saves.
- Use distinct profiles for browser and external clients to avoid stomping saves.

## Game State Shape (do not break)
Frontend expands minimally provided states. Preserve keys and types:
- `money:number`, `xp:number`
- `tiles:Array[20][20]` of objects: `{ crop, cropPlantedAt, building, buildingStartedAt, lastProductCollectedAt, plowed, fertilizedBonus }`
- `quests:Array`
- Frontend will ensure/infer: `inventory`, `tools`, `energy`, `market`, `timeOfDay`, `season`, `weather`, `stats`, `settings`, `version`, `lastActiveTs`.

Examples: see `static/game.js` functions `ensureStateShape`, `renderGrid`, and `applyIdleEarnings` for expectations and derived behavior.

## Frontend Patterns
- Rendering cadence: `renderAll()` every 500ms; heavy grid DOM throttled to ~1000ms (`GRID_RENDER_THROTTLE_MS`). Avoid adding frequent reflows.
- Autosave: client schedules POST 500ms after changes (`scheduleSaveState`). Don’t remove or block it.
- Accessibility/UX: reduced-motion, high-contrast toggles, auto-harvest/collect toggles, keyboard shortcuts (H/C/P/W/F, Shift+H/C, digits 1–9 selection).
- Assets: referenced under `static/assets/...`; keep paths consistent with `SPRITES` in `game.js`.

## Developer Workflows
- Dev run (Windows PowerShell):
  - `python -m venv .venv; .\.venv\Scripts\Activate.ps1`
  - `pip install -r requirements.txt`
  - `$env:FLASK_APP = "web_app.py"; python web_app.py` → `http://127.0.0.1:5000`
- Production (Docker/gunicorn): see `README.md` for commands. Mount `saves/` for persistence.
- Tests: `pytest` in repo root (simple API tests).

## Conventions
- No heavy frontend frameworks (no React/Vue/Angular). Keep vanilla JS + CSS.
- Preserve the state contract; the web client relies on timestamps in ms and 20×20 grid dimensions.
- Economy and progression: crop/building configs in `game.js` (`CROPS`, `BUILDINGS`), level curve via `getLevelInfo`. When tuning, adjust values cohesively and update button/tooltips.
- Performance: favor batched DOM updates and throttled operations; particle effects and animations are disabled when reduced-motion is on.

## Integration Points
- Unreal/Unity/other clients should use the HTTP API and unique `profile` values (e.g., `?profile=ue`). See `integration/unreal/` for a UE5 C++ component and VaRest Blueprint recipe, plus JSON parse/build helpers.
- Idle earnings: backend does not compute; clients should set `lastActiveTs` on save to keep idle gains accurate.

## Safe Changes You Can Make
- UI polish: styles, tooltips, HUD readability, accessibility toggles.
- Rendering: throttle/heavy DOM reductions, sprite layering, overlays (windmill blades, well ripple).
- Systems: quest card UX, shop, inventory rows, autos, keyboard shortcuts.
- Balancing: adjust `CROPS`/`BUILDINGS` values with coherent XP/money scaling.
- Testing: add focused pytest for API parameters (profiles, reset), minimal JS helpers if needed.

## Things Not To Do
- Don’t change the core state shape or 20×20 grid semantics.
- Don’t introduce heavy frameworks or rewrite to SPA.
- Don’t remove autosave/debounce or accessibility toggles.

## Examples & References
- State enrichment: `ensureStateShape` in `static/game.js`.
- Readiness checks: `tileCropReady`, `tileBuildingReady`.
- Economy tuning: `CROPS`/`BUILDINGS` constants and `getSellPriceMap()` logic in `game.js`.
- Integration: see `integration/unreal/` for UE5 C++ component and Blueprint recipe.

## Extended Guidance
- For a broader, aspirational playbook covering 2D/3D goals and art/style direction, see `.github/copilot-instructions2.md`. Use this alongside the current doc; prioritize the contract and constraints documented here when implementing.

## Quick Commands
- Reset a dev profile: `POST /api/reset?profile=dev`
- Health check: `GET /api/health`
- Run server: see “Developer Workflows”.

If any section is unclear (e.g., exact inventory rules or market multipliers), tell me what you need and I’ll refine this doc with concrete code references.
