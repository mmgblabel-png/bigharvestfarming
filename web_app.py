from flask import Flask, send_from_directory, request, jsonify
import os
import json

app = Flask(
    __name__,
    static_folder="static",
    static_url_path=""
)

STATE_FILE = "game_state.json"


@app.route("/")
def index():
    # serveert static/index.html
    return send_from_directory("static", "index.html")


@app.route("/api/state", methods=["GET", "POST"])
def api_state():
    if request.method == "GET":
        if not os.path.exists(STATE_FILE):
            # eerste keer -> startstate
            return jsonify({
                "money": 500,
                "xp": 0,
                "tiles": []
            })
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return jsonify(data)

    # POST -> state opslaan
    data = request.get_json(force=True)
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f)
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True)

