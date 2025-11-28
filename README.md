# Big Harvest Farming

A simple browser-based farming game with a Flask backend.

## Features
- 20x20 grid farming with crops, buildings, inputs (windmill requires wheat)
- Seasons & dynamic weather (affects growth & production speeds)
- Energy system, tool durability & repairs (toolkit or coins)
- Inventory, quests, dynamic market pricing with periodic multiplier drift
- Per-profile saves under `saves/{profile}.json` (HUD selector)
- Visual polish: parallax horizon, day/night cycle (stars overlay), seasonal color grading filters
- Animated effects: crop bobbing (weather-adjusted), particle variants (season/weather aware), click ripple, building overlays (windmill blades, well ripple)
- Accessibility & UX: reduced-motion toggle, autosave indicator, auto-harvest & auto-collect toggles, bloom feedback on level-up / quest reward
- Performance: throttled grid rendering (≈1s) vs HUD/overlay refresh (500ms) to reduce DOM churn

## Quick Start (Windows PowerShell)

```powershell
# Create and activate virtual environment
python -m venv .venv; .\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run development server
$env:FLASK_APP = "web_app.py"; python web_app.py
# Open http://localhost:5000
```

## Production Run (Gunicorn)

```powershell
# Ensure venv active and deps installed
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Run via gunicorn (WSGI)
python -m gunicorn web_app:app --bind 0.0.0.0:8000
# Open http://localhost:8000
```

## Project Structure
- `web_app.py` — Flask app (APIs, state reset, static hosting)
- `static/` — Frontend (`index.html`, `style.css`, `game.js`, assets)
- `saves/` — Per-profile save files like `saves/alice.json` (created on demand)
- `game_state.json` — Default/legacy single save file (used by override)
- `requirements.txt` — Python dependencies

## API
- `GET /api/state[?profile=name]` — Load current state (optional `profile`)
- `POST /api/state[?profile=name]` — Save state
- `POST /api/reset[?profile=name]` — Reset to defaults for the profile
- `GET /api/health` — Health check

Examples:
```
GET /api/state?profile=alice
POST /api/reset?profile=dev
```

If `profile` is omitted, the backend uses its default behavior (see Environment below).

## Optional: Docker

Build and run with Docker:
```powershell
# Build
docker build -t big-harvest-farming .
# Run
docker run -p 8000:8000 -v ${PWD}\saves:/app/saves big-harvest-farming
# Open http://localhost:8000
```

## Notes
- Assets referenced in `game.js` under `static/assets/` must exist.
- Debug mode: edit `if __name__ == "__main__": app.run(debug=True)` in `web_app.py`.
- Save indicator and autosave are handled client-side (`💾 Opslaan...` then `Opgeslagen`).
- Auto actions: enable via toolbar buttons (Auto Oogst / Auto Verzamelen) — they harvest/collect when ready, respecting inventory capacity & resource inputs.
- Reduced motion: toggle disables non-essential animations (particle effects, bobbing, spins, ripples, bloom) for accessibility/performance.
- Seasonal filters: applied to `#farm-wrapper` (`season-spring|summer|autumn|winter` classes) adjusting hue/saturation.

## Environment
- `BHF_STATE_FILE` (optional): fully qualified JSON file path for single-save deployments. Used only when no `profile` is provided in the request.
- Saves directory: when using profiles, files are stored under `saves/{profile}.json`. The directory is created as needed.

## Accessibility
- Reduced Motion button: Disables animations & transitions while retaining gameplay feedback via toasts.
- Color grading preserved with sufficient contrast; planned High Contrast mode (toggle) will further enhance legibility.
- Toast (`#toast`) uses `aria-live="polite"` for screen reader announcements (harvests, level-ups, rewards).

## Planned Enhancements
- High contrast mode toggle
- Keyboard focus outlines & tile navigation
- Particle rate capping during large auto-harvest bursts
- Optional forecasting panel (upcoming weather probability)
