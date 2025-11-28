# Big Harvest Unreal Integration

This folder contains ready-to-use Unreal Engine integration pieces to link your UE project with the Flask backend in this repo.

What you get:
- `UGameStateSync` (C++ ActorComponent): GET/POST the shared game state JSON.
- `AStateSyncActor` (example): Auto-fetches state on BeginPlay and logs it.
- Blueprint (VaRest) recipe: No C++ required (see below).
  - Structured helpers: `ParseStateJson(Json, OutState)` and `BuildStateJson(State)` with `FGameStateData`, `FTileData`, `FInventoryData`, `FStatsData` (tiles flattened 20×20 = 400 entries).

## 1) Add C++ Component to UE5

1. Copy the files into your UE project (recommended path):
   - `Source/<YourGame>/BigHarvest/UGameStateSync.h`
   - `Source/<YourGame>/BigHarvest/UGameStateSync.cpp`
   - `Source/<YourGame>/BigHarvest/StateSyncActor.h`
   - `Source/<YourGame>/BigHarvest/StateSyncActor.cpp`

2. Edit your `<YourGame>.Build.cs` and add modules:

```csharp
PublicDependencyModuleNames.AddRange(new string[] { "Core", "CoreUObject", "Engine", "HTTP", "Json", "JsonUtilities" });
```

3. Build the project. In the editor, you can now:
   - Add the `GameStateSync` component to any Actor and set:
     - `BaseUrl`: `http://127.0.0.1:5000` (dev) or your server URL
     - `Profile`: e.g., `ue`, `ue-dev`, `slot-1`
     - `bAutoFetchOnBeginPlay`: true to auto load
   - Or drop `StateSyncActor` into the level.

4. Use in Blueprints:
   - From the component, call `FetchState` or `SaveState(JsonPayload)`.
   - Bind to `OnFetchOk (Json string)`, `OnFetchError`, `OnSaveOk`, `OnSaveError`.
  - If you prefer structured data: on `OnFetchOk`, call `ParseStateJson` to get `FGameStateData`, modify fields, then call `BuildStateJson` and pass to `SaveState`.

  Tip: `UGameStateSync::MakeMinimalState(Money, Xp)` generates a minimal JSON the backend accepts; the web client fills missing fields.

## 2) Blueprint-only via VaRest

If you prefer Blueprints, install the VaRest plugin (Marketplace). Then:

- GET flow
  1. Construct `VaRestRequestJSON` (GET)
  2. URL: `http://127.0.0.1:5000/api/state?profile=ue`
  3. `Execute` → bind `OnRequestComplete`
  4. Use `GetResponseObject` → `GetNumberField("money")`, `GetNumberField("xp")`
  5. For tiles: `GetArrayField("tiles")` → for each row (array) → for each tile (object): fields `crop`, `cropPlantedAt`, `building`, `buildingStartedAt`, `lastProductCollectedAt`, `plowed`, `fertilizedBonus`.

- POST flow
  1. Create a `VaRestJsonObject`
  2. Set required fields at minimum: `money`, `xp`, `tiles` (20×20 arrays of tile objects), `quests` (array)
  3. Construct `VaRestRequestJSON` (POST)
  4. Set body to your object; header `Content-Type: application/json`
  5. URL with `?profile=ue`, then `Execute`

Note: Timestamps are in milliseconds since epoch (numbers). Keep them as 64-bit integers where possible.

## 3) Backend Quick Start

Run the Flask server from this repo:

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:FLASK_APP = "web_app.py"; python web_app.py
# http://127.0.0.1:5000
```

Health/reset for testing:
- `GET /api/health`
- `POST /api/reset?profile=ue`

Docker option (port 8000):

```powershell
docker build -t big-harvest-farming .
docker run -p 8000:8000 -v ${PWD}\saves:/app/saves big-harvest-farming
```

## 4) Data Shape Notes

- The web app is tolerant and will enrich minimal states. The canonical shape used on the frontend:

```json
{
  "money": 500,
  "xp": 0,
  "tiles": [[ {"crop":null,"cropPlantedAt":null,"building":null,"buildingStartedAt":null,"lastProductCollectedAt":null,"plowed":false,"fertilizedBonus":false} ]],
  "quests": []
}
```

- Arrays are 20×20. When posting, keep array sizes consistent to avoid client-side clamping.
- Profiles: add `?profile=<name>` or header `X-Profile: <name>` to isolate saves (be consistent across UE and browser to avoid conflicts).

## 5) Example: Save Money Only (Blueprint)

Minimal JSON payload (keeping tiles unchanged requires reading them first). If you only want to set money/xp in a test:

```json
{
  "money": 1234,
  "xp": 10,
  "tiles": [ [ {"crop":null,"cropPlantedAt":null,"building":null,"buildingStartedAt":null,"lastProductCollectedAt":null,"plowed":false,"fertilizedBonus":false} ] ],
  "quests": []
}
```

In practice, read the current state → modify → POST back.

## 6) Troubleshooting

- 400 on POST: ensure `Content-Type: application/json` and top-level JSON object.
- 404/connection refused: confirm the Flask server URL/port and Windows firewall prompts.
- Timestamps: keep as numbers, not strings. Use `int64` in C++.
