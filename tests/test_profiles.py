import importlib


def _mk_payload(money=777, xp=5):
    # Properly build 20x20 tiles with distinct lists
    tile = {
        "crop": None,
        "cropPlantedAt": None,
        "building": None,
        "buildingStartedAt": None,
        "lastProductCollectedAt": None,
        "plowed": False,
        "fertilizedBonus": False,
    }
    tiles = [[dict(tile) for _ in range(20)] for __ in range(20)]
    return {"money": money, "xp": xp, "tiles": tiles, "quests": []}


def test_profile_query_and_header_routing(tmp_path, monkeypatch):
    # Use a temp saves dir to avoid touching real files
    saves_dir = tmp_path / "saves"
    saves_dir.mkdir(parents=True, exist_ok=True)
    monkeypatch.setenv("BHF_SAVES_DIR", str(saves_dir))

    # Import app after env set
    app_module = importlib.import_module("web_app")
    app = app_module.app
    client = app.test_client()

    # 1) Reset with query profile
    r = client.post("/api/reset?profile=ue-test")
    assert r.status_code == 200
    data = r.get_json()
    assert data["status"] == "ok"
    # File should exist
    f = saves_dir / "ue-test.json"
    assert f.exists()

    # 2) Save via header for same profile
    payload = _mk_payload(777, 5)
    r = client.post("/api/state", json=payload, headers={"X-Profile": "ue-test"})
    assert r.status_code == 200
    assert r.get_json()["status"] == "ok"

    # 3) Read back via query
    r = client.get("/api/state?profile=ue-test")
    assert r.status_code == 200
    state = r.get_json()
    assert state["money"] == 777
    assert state["xp"] == 5

    # 4) Health should be ok
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.get_json()["status"] == "ok"


def test_reset_creates_default_shape(tmp_path, monkeypatch):
    saves_dir = tmp_path / "saves"
    saves_dir.mkdir(parents=True, exist_ok=True)
    monkeypatch.setenv("BHF_SAVES_DIR", str(saves_dir))

    app_module = importlib.import_module("web_app")
    app = app_module.app
    client = app.test_client()

    r = client.post("/api/reset?profile=qa")
    assert r.status_code == 200
    resp = r.get_json()
    assert resp["status"] == "ok"
    state = resp["state"]
    # Minimal keys
    assert isinstance(state.get("money"), int)
    assert isinstance(state.get("xp"), int)
    assert isinstance(state.get("tiles"), list)
    assert isinstance(state.get("quests"), list)
    # Grid size
    assert len(state["tiles"]) == 20
    assert len(state["tiles"][0]) == 20
