# Copilot Instructions for Big Harvest Farming

You are building **Big Harvest Farming**, a farm game inspired by:
- Goodgame Big Farm
- Stardew Valley
- Hay Day
- Casual 3D/2D farming simulators

The project has **two main tracks**:

1. A **2D web version** (HTML/CSS/JavaScript + Flask)
2. A future **3D version** (Unity / Unreal / Blender assets)

You must keep both in mind and generate code, assets and structures that are
consistent with a cozy, bright, semi-realistic farming game.

---

## 1. CURRENT PROJECT: 2D WEB FARM GAME (HTML/CSS/JS + FLASK)

### Tech

- Backend:
  - Python + Flask (`web_app.py`)
  - Routes:
    - `GET /` → serve `static/index.html`
    - `GET /api/state` → return JSON state (or default)
    - `POST /api/state` → save JSON state to `game_state.json`

- Frontend: folder `static/`
  - `static/index.html` – structure & layout
  - `static/style.css` – visuals & layout
  - `static/game.js` – game logic, state, rendering

### Game Features (2D Version)

The core web game is:

- **Tile-based farm grid**, at least 20x20
  - Each tile can be:
    - empty
    - crop (in a growth stage)
    - building (barn, coop, etc.)

- **Crops**
  - At least:
    - wheat 🌾
    - corn 🌽
    - carrot 🥕
    - (later more: potatoes, tomatoes, pumpkins, sunflowers)
  - Each crop has:
    - `growTimeMs`
    - `seedCost`
    - `value`
    - `xpPlant`
    - `xpHarvest`
    - `minLevel`
  - Each crop visually:
    - seedling
    - growing
    - mature / ready-to-harvest

- **Buildings & animals**
  - Chicken coop (🐔) → produces eggs
  - Cow barn (🐄) → produces milk
  - Later: farmhouse, silo, windmill, water well, storage shed, fences/paths
  - Buildings have:
    - `buildCost`
    - `buildXp`
    - `productionTimeMs`
    - `productName`
    - `productValue`
    - `productXp`
    - `minLevel`

- **Economy**
  - Player starts with some money (e.g. 500 coins)
  - Coins spent on seeds and buildings
  - Coins earned from crops & animal products

- **XP & Levels**
  - XP for planting, harvesting, building, collecting
  - Simple level curve: level 1 at 0 XP, level 2 ~100 XP, each level ~30% more
  - Higher levels unlock more crops and buildings

- **Quests**
  - Simple quests:
    - “Harvest 10 wheat”
    - “Build 1 chicken coop”
    - “Collect 5 eggs”
  - Each quest has:
    - id
    - title
    - type (harvest_crop / build_building / collect_product)
    - target (number)
    - rewardMoney
    - rewardXp
  - Quests are shown in a side panel with progress and rewards

- **Persistent save**
  - State saved as JSON (e.g. `game_state.json`)
  - On load: `GET /api/state`
  - On change: `POST /api/state` with full state

### Visual Style (2D)

- Cozy, bright, farm aesthetic
- Slightly cartoony but not childish
- Rounded corners, soft shadows
- Color palette:
  - warm greens (grass)
  - rich browns (soil)
  - bright reds/oranges/yellows (buildings, crops)
- Clear icons and tiles:
  - Grass tile
  - Plowed soil tile
  - Crop tiles (different states)
  - Building tiles
- HUD:
  - Shows money, level, XP
  - Action buttons: Plant, Harvest, Build, Collect
- Side bar:
  - Quest list with title, progress, rewards

### What You Should Do (Copilot) in the 2D Web Code

**When editing `static/index.html`:**

- Suggest clear layout:
  - `<header>` HUD with:
    - money
    - level
    - XP
    - action buttons
  - Toolbars:
    - crops toolbar with crop buttons/unlocks
    - buildings toolbar with building buttons/unlocks
  - Main area:
    - left: scrollable farm grid container
    - right: quests panel
- Use semantic, readable class names and IDs:
  - `#farm-grid`, `.tile`, `.hud`, `.toolbar`, `.side-panel`, `#quest-list`, etc.

**When editing `static/style.css`:**

- Improve farm visuals:
  - Beautiful farm tiles:
    - grass vs plowed soil vs crop vs building
  - Hover highlight on tiles
  - Active state for selected action button
  - Soft shadows and rounded corners for HUD, toolbars, side panel
- Use CSS variables where useful, e.g.:
  - `--farm-green`
  - `--farm-brown`
  - `--farm-accent`
- Add simple animations:
  - hover transitions
  - “pop” or glow for ready crops/buildings
  - subtle animations on buttons

**When editing `static/game.js`:**

- Keep game state clear:
  - `money`, `xp`, `tiles`, `quests`, etc.
- Render the grid with visually distinct states:
  - empty
  - crop-growing
  - crop-ready
  - building
  - building-ready
- Map game logic to visuals:
  - Crop growth stages → different icons, emojis, CSS classes or sprites
  - Building ready state → check mark, glow, timer text
- Suggest helper functions:
  - `loadStateFromServer`, `saveStateToServer`
  - `renderGrid`, `renderQuests`, `updateUI`
- Implement and respect:
  - unlock levels for crops and buildings
  - quest progress updates on actions:
    - harvest events
    - build events
    - collect events

---

## 2. FUTURE / PARALLEL: 3D FARM GAME (UNITY / UNREAL / BLENDER)

You also support a 3D version of the same game world.

### Target Engines

The 3D version may use:

- Unity (C#)
- Unreal Engine (Blueprints and/or C++)
- Blender for modelling and export (FBX/GLTF)

### Your Job in the 3D Context

Generate code, asset structures, and helpers for **3D graphics**:

- Blender-style models
- Unity/Unreal-ready meshes
- PBR materials
- Animation controllers
- Integration into a grid-based farming world

### 3D Models Needed

**1. Buildings (low/mid poly, cozy realistic style)**

- Farmhouse  
- Barn  
- Chicken coop  
- Cow barn  
- Silo  
- Windmill  
- Water well  
- Storage shed  
- Fences, gates, dirt roads  

Requirements:
- Modular where possible (walls, roofs, corners, doors)
- Simple collision meshes
- PBR materials (albedo, normal, roughness, metallic)
- 1–2 LOD levels for performance

**2. Crops**

- Wheat, corn, carrots, potatoes, tomatoes, pumpkins, sunflowers

Each crop must have separate meshes for:
- seedling
- growing
- mature / ready to harvest

Optional:
- wind sway via vertex shader or simple animation

**3. Animals**

- Chickens, cows, sheep, pigs, horses, dog, cat

Each animal:
- low/mid poly, stylized but believable proportions
- rigged skeleton
- idle, walk, eat, sleep animations

Unity:
- AnimatorController examples

Unreal:
- Animation Blueprints / state machines pseudo-logic

**4. Environment**

- Grass tiles, dirt tiles, plowed field tiles
- Rock props, trees, bushes, flowers
- Simple skybox or sky sphere setup
- Lighting setup:
  - directional sun light
  - subtle ambient
  - soft shadows

### Visual Style (3D)

- Cozy, bright, semi-realistic farm
- Slightly cartoony proportions (not hyper-realistic)
- Smooth edges, rounded corners
- PBR materials with stylized textures
- Color palette:
  - warm greens (fields)
  - rich browns (soil, wood)
  - bright reds/oranges/yellows (buildings, crops)

### What You Should Do (Copilot) in 3D Code

**When editing Unity C# scripts:**

- Suggest classes and components like:
  - `FarmTile`
  - `CropInstance`
  - `BuildingInstance`
  - `AnimalController`
- Provide code to:
  - place buildings on grid cells
  - spawn crops at grid positions
  - change meshes/materials based on growth stages
  - animate animals using Animator
  - handle simple day/night cycle and lighting adjustments
- Suggest clear folder structures:
  - `Assets/Environment/Buildings`
  - `Assets/Environment/Crops`
  - `Assets/Characters/Animals`
  - `Assets/Materials/Farm`

**When editing Unreal C++ / Blueprints:**

- Suggest Actors and Components:
  - `AFarmTile`
  - `ABuildingActor`
  - `AAnimalCharacter`
- Provide pseudo-blueprint logic for:
  - grid placement
  - growth timers
  - switching meshes / materials when crops or buildings change state
- Suggest asset folder hierarchies similar to Unity.

**When editing documentation/comments related to 3D:**

- Suggest:
  - naming conventions
  - model polycount targets (e.g. 500–5k per object depending on type)
  - texture resolutions (e.g. 512–2048)
- Keep everything consistent with the visual style of the 2D web version (same world, just 3D).

---

## 3. GENERAL RULES FOR YOU (COPILOT)

- Always think in terms of a **cozy farming game**:
  - clear feedback
  - satisfying visuals
  - gentle animations
- Keep code:
  - modular
  - readable
  - easy to extend later
- Use descriptive names and comments so humans can understand what’s going on.
- When adding new features, try to:
  - reuse patterns already in the project
  - keep the UX consistent (same icons/colors where possible)
- For 2D web:
  - focus on HTML/CSS/JS and integration with Flask API
- For 3D:
  - focus on asset structures, scripts/components, and integration into a grid-based farm.

## 4. Continuous Improvement Behaviour

You should behave as if you are continuously improving this project over time.

Whenever I open or edit files in this repository (HTML, CSS, JS, Python, or future Unity/Unreal code):

- Proactively suggest:
  - refactors that reduce duplication
  - clearer function names and structures
  - better separation of concerns (rendering vs logic vs data)
  - performance improvements for rendering the farm grid
  - visual improvements that make the farm look more polished

- When I write comments like:
  - // TODO: improve visuals
  - // TODO: refactor
  - // TODO: optimize
  you should respond with concrete, high-quality suggestions and code changes.

Act as if each editing session is an opportunity for a “version upgrade” of the game:
- cleaner code
- better visuals
- more consistent style
- easier to extend later.

You are not allowed to run on a timer, but you should act as if you are the
self-improvement engine for this project whenever I am working in VS Code.

This document is your main style and design reference for anything related to
Big Harvest Farming. Always generate code, structures and suggestions that fit
this game and its aesthetic.


You are helping me build a 3D farming game inspired by Goodgame Big Farm,
Stardew Valley (3D style), and casual farming simulators.

Your job: generate code, asset structures, and helpers for **3D graphics**:
- Blender-style models
- Unity/Unreal-ready meshes
- PBR materials
- animation controllers
- integration into a grid-based farming world

### Target Engines

I will use one or more of:
- Unity (C#)
- Unreal Engine (Blueprints and/or C++)
- Blender for modelling and export (FBX/GLTF)

You should generate:
- Example C# scripts (Unity) OR Unreal Blueprints pseudo-logic for:
  - placing buildings on a grid
  - spawning crops
  - animating animals
  - handling day/night cycles and simple lighting
- Suggestions for folder structures for 3D assets
- Comments that tell me where to drop models/textures

### 3D Models Needed

Create specifications and example setups for 3D assets:

1. Buildings (low/mid poly, cozy realistic style)
   - Farmhouse
   - Barn
   - Chicken coop
   - Cow barn
   - Silo
   - Windmill
   - Water well
   - Storage shed
   - Fences, gates, dirt roads

   Requirements:
   - Modular pieces where possible (walls, roofs, corners, doors)
   - Simple collision meshes
   - PBR materials (albedo, normal, roughness, metallic)
   - 1–2 LOD levels for performance

2. Crops
   - Wheat, corn, carrots, potatoes, tomatoes, pumpkins, sunflowers
   - Each crop must have separate meshes for:
     - Seedling
     - Growing
     - Mature / ready to harvest
   - Optional: wind sway via vertex shader or simple animation

3. Animals
   - Chickens, cows, sheep, pigs, horses, dog, cat
   - Low/mid poly stylized but believable proportions
   - Each animal:
     - Rigged skeleton
     - Idle, walk, eat, sleep animations
   - Unity: AnimatorController examples
   - Unreal: Animation Blueprints / state machines pseudo-logic

4. Environment
   - Grass tiles, dirt tiles, plowed field tiles
   - Rock props, trees, bushes, flowers
   - Simple skybox or sky sphere setup
   - Light setup suggestions (directional sun, subtle ambient, soft shadows)

### Visual Style

- Cozy, bright, semi-realistic farm
- Slightly cartoony proportions (not hyper-realistic)
- Smooth edges, rounded corners
- PBR materials but with stylized textures
- Color palette:
  - Warm greens for grass fields
  - Rich browns for soil
  - Bright reds/oranges/yellows for buildings and crops

### What I Want From You (Copilot)

- When I am in a Unity C# script:
  - Suggest classes like FarmTile, CropInstance, BuildingInstance, AnimalController
  - Provide code to:
    - place buildings on grid cells
    - load 3D prefabs for each building/animal/crop state
    - animate animals using Animator
    - change crop models based on growth stage

- When I am in an Unreal C++ or Blueprint file:
  - Suggest Actors and Components for:
    - FarmTile
    - BuildingActor
    - AnimalCharacter
  - Provide pseudo-blueprint logic for:
    - grid placement
    - growth timers
    - switching meshes / materials

- When I am editing documentation or comments:
  - Suggest naming conventions, folder hierarchies like:
    - Assets/Environment/Buildings
    - Assets/Environment/Crops
    - Assets/Characters/Animals
    - Assets/Materials/Farm
  - Suggest model polycounts and texture resolutions (e.g. 512–2048)

Always keep everything consistent with a 3D farming game aesthetic and
optimize for readability, modularity, and easy extension later.


You are assisting in creating a high-quality farming simulation game similar to
Goodgame Big Farm, Stardew Valley, Farming Simulator, and Hay Day.

Generate code, assets, shaders, CSS, SVG icons, sprite sheets, and rendering
logic that produce **modern, realistic, polished visuals**.

### Graphic Requirements

1. **World Style**
   - Soft, bright, colorful farming world
   - Slightly cartoony but realistic proportions
   - Smooth rounded edges, cozy atmosphere
   - Daylight color palette inspired by farming games

2. **Plants & Crops**
   - High-quality sprites for:
     - Wheat, Corn, Carrots, Potatoes, Tomatoes, Pumpkins, Sunflowers
   - Each crop must have:
     - Seed stage
     - Growing stage
     - Mature/ready-to-harvest stage
   - Animated growing (subtle sway in wind)

3. **Buildings**
   Generate realistic but soft-styled buildings:
   - Barn
   - Chicken Coop
   - Cow Barn
   - Silo
   - Windmill
   - Farmhouse
   - Water Well
   - Storage Shed
   - Field Plots / Soil Tiles
   - Roads, fences, paths

4. **Animals**
   Provide sprite sheets or SVG art for:
   - Chickens
   - Cows
   - Sheep
   - Pigs
   - Horses
   - Dogs & Cats (optional pets)
   - Each with idle, eat, walk animations

5. **UI / HUD**
   - Gold coin icon (💰 style)
   - XP star icon (⭐)
   - Tool buttons:
     - Plant
     - Harvest
     - Build
     - Collect
   - Quest panel UI with icons
   - Inventory icons (eggs, milk, wool, seeds, feed)

6. **Tile & Ground Textures**
   - Soil tile (plowed)
   - Grass tile
   - Dirt path tile
   - Farmland tile
   - Water tile (animated)

7. **Lighting & Effects**
   - Soft shadows
   - Highlight tile on hover
   - Glow effect for ready-to-harvest crops
   - Smooth transition animations

### Deliverables Copilot Should Generate

- SVG graphics with full shading & outlines
- PNG sprite sheets for crops, animals, and buildings
- CSS visual themes for farming UI
- Canvas/WebGL rendering code to display tiles & animations
- Example scenes (farm layout preview)
- Placeholder art that still looks polished
- Utility functions to load sprite sheets and animate them
- Code to layer buildings, plants, and animals on the grid
- Shader effects (wind sway, hover highlights, subtle bloom)

### Style Guide

- Modern farming mobile-game visuals
- Bright, clean, cozy, farm aesthetic
- Slight cartoony realism like Hay Day + Big Farm
- Smooth outlines, rounded corners
- Warm color palette (greens, browns, yellows, reds)
- All assets consistent in perspective and style

### Output Format

Provide:
- SVG / PNG art definitions
- CSS variables / themes
- Code examples (JavaScript, HTML5 Canvas, or WebGL)
- Optional: links to generate sprite sheets or animations
- Explanations on how to use each asset in the game

Generate highly detailed, production-level visuals that can immediately be used
in a farming simulation game.
