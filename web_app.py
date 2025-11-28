from flask import Flask, jsonify, request, send_from_directory
import json
import os
from pathlib import Path

app = Flask(__name__, static_folder="static", static_url_path="/static")

STATE_FILE = os.getenv("BHF_STATE_FILE", "game_state.json")
SAVES_DIR = os.getenv("BHF_SAVES_DIR", "saves")
Path(SAVES_DIR).mkdir(parents=True, exist_ok=True)
GRID_SIZE = 20


def default_state():
    """Maak een standaard start-state."""
    tiles = []
    for y in range(GRID_SIZE):
        row = []
        for x in range(GRID_SIZE):
            row.append(
                {
                    "crop": None,
                    "cropPlantedAt": None,
                    "building": None,
                    "buildingStartedAt": None,
                    "lastProductCollectedAt": None,
                }
            )
        tiles.append(row)

    return {"money": 500, "xp": 0, "tiles": tiles, "quests": []}


def _state_path(profile: str | None):
    if profile:
        safe = "".join(c for c in profile if c.isalnum() or c in ("_","-")) or "default"
        return os.path.join(SAVES_DIR, f"{safe}.json")
    return STATE_FILE


def load_state():
    profile = request.args.get("profile") or request.headers.get("X-Profile")
    path = _state_path(profile)
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return default_state()
    else:
        return default_state()


def save_state(state):
    profile = request.args.get("profile") or request.headers.get("X-Profile")
    path = _state_path(profile)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.get("/api/state")
def api_get_state():
    state = load_state()
    return jsonify(state)


@app.post("/api/state")
def api_post_state():
    state = request.get_json(force=True, silent=True)
    if not isinstance(state, dict):
        return jsonify({"status": "error", "message": "Invalid state"}), 400

    save_state(state)
    return jsonify({"status": "ok"})


@app.get("/api/health")
def api_health():
    try:
        _ = load_state()
        return jsonify({"status": "ok"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.post("/api/reset")
def api_reset():
    state = default_state()
    save_state(state)
    return jsonify({"status": "ok", "state": state}), 200


if __name__ == "__main__":
    app.run(debug=True)
