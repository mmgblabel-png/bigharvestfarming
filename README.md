# Big Harvest Farming

An educational, extensible farming simulation written in Python. It includes:
- Core game logic (`game_core.py`) with plants, animals, production buildings, market orders, and player trading.
- A playable CLI loop (run `python game_core.py` or `python big_harvest.py`).
- A demo simulation (`main.py`) that auto-runs a short showcase.
- A web prototype (`web_app.py` + `index.html`) exposing a JSON API and a simple UI.
- Rich example scenarios in `examples.py`.
- Unit tests in `test_game_core.py` (all passing).

## Features
- Plant crops with growth timers and harvest yields.
- Animals that produce products after being fed.
- Production buildings that process inputs into higher value goods.
- Boost mechanics (speed up plant growth).
- Market orders & player trading.
- Queue-based production.

## Quick Start (CLI Game)
```powershell
python -m venv .venv; .\.venv\Scripts\activate
pip install -r requirements.txt
python big_harvest.py  # launches interactive CLI
```

Type `help` inside the prompt to see available commands. Examples:
```
status
plant 0 wheat
addanimal chicken egg 6 2
feed 0
wait 5
harvestall
quit
```

## Demo Script
Run the scripted 30‑second showcase:
```powershell
python main.py
```

## Web UI Prototype
Launch a local Flask server with JSON endpoints and a basic HTML interface:
```powershell
python web_app.py
```
Then open http://127.0.0.1:5000/ in your browser.

## Examples
Run all curated example scenarios:
```powershell
python examples.py
```

## Tests
```powershell
python -m unittest -v test_game_core.py
```

## Project Layout
```
game_core.py          # Core systems and CLI Game class
main.py               # Short automated demo loop
big_harvest.py        # Convenience launcher
web_app.py            # Flask API + static UI
index.html            # Web UI (served by Flask)
examples.py           # Individual feature examples
test_game_core.py     # Unit tests
requirements.txt      # Dependencies
visual/               # (future Pygame/animation assets)
```

## Extending
Ideas for next steps:
- Weather & seasons affecting growth times.
- Player leveling & skill bonuses.
- Persistent save/load (JSON or SQLite).
- More crop types with distinct recipes.
- NPC market price fluctuations.
- Graphical Pygame implementation using `visual/` components.

Contributions & experimentation encouraged. Have fun harvesting!
