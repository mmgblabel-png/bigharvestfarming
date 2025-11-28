import importlib


def _mk_payload(money=101, xp=3):
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


def test_state_file_used_when_no_profile(tmp_path, monkeypatch):
    state_file = tmp_path / "single.json"
    monkeypatch.setenv("BHF_STATE_FILE", str(state_file))
    app_module = importlib.import_module("web_app")
    app = app_module.app
    client = app.test_client()

    # POST without profile stores to state file
    r = client.post("/api/state", json=_mk_payload(202, 9))
    assert r.status_code == 200
    assert state_file.exists()

    # GET without profile reads same
    r = client.get("/api/state")
    assert r.status_code == 200
    js = r.get_json()
    assert js["money"] == 202
    assert js["xp"] == 9


def test_profile_takes_precedence_over_state_file(tmp_path, monkeypatch):
    state_file = tmp_path / "single.json"
    saves_dir = tmp_path / "saves"
    saves_dir.mkdir(parents=True, exist_ok=True)
    monkeypatch.setenv("BHF_STATE_FILE", str(state_file))
    monkeypatch.setenv("BHF_SAVES_DIR", str(saves_dir))

    app_module = importlib.import_module("web_app")
    app = app_module.app
    client = app.test_client()

    # With profile, should NOT use state_file; should use saves/<profile>.json
    r = client.post("/api/state?profile=p1", json=_mk_payload(303, 11))
    assert r.status_code == 200
    prof_path = saves_dir / "p1.json"
    assert prof_path.exists()
    # The env state_file may be untouched
    assert not state_file.exists()

    # Read back via profile
    r = client.get("/api/state?profile=p1")
    js = r.get_json()
    assert js["money"] == 303
    assert js["xp"] == 11
