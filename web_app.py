from flask import Flask, jsonify, request, send_from_directory
import json
import os

app = Flask(__name__, static_folder="static", static_url_path="/static")

STATE_FILE = "game_state.json"
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


def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return default_state()
    else:
        return default_state()


def save_state(state):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
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


if __name__ == "__main__":
    app.run(debug=True)
