import importlib


def test_health_and_reset(tmp_path, monkeypatch):
    # Use a temporary game_state.json
    state_file = tmp_path / "game_state.json"
    monkeypatch.setenv("BHF_STATE_FILE", str(state_file))

    # Import app after env set so it reads the overridden path if supported
    app_module = importlib.import_module("web_app")
    app = app_module.app
    client = app.test_client()

    # Health endpoint works
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json.get("status") == "ok"

    # Reset returns a fresh state and writes file
    r = client.post("/api/reset?profile=testuser")
    assert r.status_code == 200
    js = r.json
    assert js["status"] == "ok"
    state = js["state"]
    assert isinstance(state, dict)
    assert "tiles" in state and len(state["tiles"]) == 20

    # Save state
    r = client.post("/api/state?profile=testuser", json=state)
    assert r.status_code == 200
    assert r.json["status"] == "ok"

    # Load state
    r = client.get("/api/state?profile=testuser")
    assert r.status_code == 200
    loaded = r.json
    assert loaded["money"] == state["money"]
    assert loaded["xp"] == state["xp"]
    assert len(loaded["tiles"]) == 20


def test_invalid_state_post(tmp_path, monkeypatch):
    state_file = tmp_path / "game_state.json"
    monkeypatch.setenv("BHF_STATE_FILE", str(state_file))
    app_module = importlib.import_module("web_app")
    app = app_module.app
    client = app.test_client()

    r = client.post("/api/state", data="not-json")
    assert r.status_code == 400
    assert r.json["status"] == "error"
