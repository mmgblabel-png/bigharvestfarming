import importlib


def test_profile_name_sanitization(tmp_path, monkeypatch):
    # Save dir
    saves_dir = tmp_path / "saves"
    saves_dir.mkdir(parents=True, exist_ok=True)
    monkeypatch.setenv("BHF_SAVES_DIR", str(saves_dir))

    app_module = importlib.import_module("web_app")
    app = app_module.app
    client = app.test_client()

    # Profile containing spaces and special chars should be sanitized to alnum/_/-
    prof = "dev test!!"
    r = client.post(f"/api/reset?profile={prof}")
    assert r.status_code == 200

    # Expected file name: spaces removed, specials dropped -> "devtest" then .json
    expected = saves_dir / "devtest.json"
    assert expected.exists(), f"Expected sanitized save file at {expected}"
