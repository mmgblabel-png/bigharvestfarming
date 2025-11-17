// Big Harvest Farming - uitgebreide webclient
// Features:
// - A: meerdere gewassen
// - B: gebouwen
// - C: levels + XP
// - D: dieren (kippen/koeien produceren items)
// - E: grotere 20x20 map met scroll
// - F: backend save via /api/state

const GRID_WIDTH = 20;
const GRID_HEIGHT = 20;

// --- Gewassen (A) ---
const CROPS = {
  wheat: {
    key: "wheat",
    name: "Tarwe",
    emoji: "🌾",
    growTimeMs: 1000 * 30,
    seedCost: 10,
    value: 25,
    xpPlant: 2,
    xpHarvest: 5,
  },
  corn: {
    key: "corn",
    name: "Maïs",
    emoji: "🌽",
    growTimeMs: 1000 * 60,
    seedCost: 20,
    value: 50,
    xpPlant: 3,
    xpHarvest: 8,
  },
  carrot: {
    key: "carrot",
    name: "Wortel",
    emoji: "🥕",
    growTimeMs: 1000 * 45,
    seedCost: 15,
    value: 35,
    xpPlant: 3,
    xpHarvest: 7,
  },
};

// --- Gebouwen + dieren (B + D) ---
const BUILDINGS = {
  chicken_coop: {
    key: "chicken_coop",
    name: "Kippenhok",
    emoji: "🐔",
    buildCost: 200,
    buildXp: 15,
    productionTimeMs: 1000 * 60,
    productName: "Eieren",
    productValue: 40,
    productXp: 10,
  },
  cow_barn: {
    key: "cow_barn",
    name: "Koeienstal",
    emoji: "🐄",
    buildCost: 400,
    buildXp: 25,
    productionTimeMs: 1000 * 90,
    productName: "Melk",
    productValue: 80,
    productXp: 18,
  },
};

// --- Game-state ---
let state = {
  money: 500,
  xp: 0,
  tiles: [],
};

function createEmptyTiles() {
  const tiles = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const row = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      row.push({ crop: null, building: null });
    }
    tiles.push(row);
  }
  return tiles;
}

function ensureTiles() {
  if (!Array.isArray(state.tiles) || state.tiles.length !== GRID_HEIGHT) {
    state.tiles = createEmptyTiles();
    return;
  }
  // als dimensies niet kloppen, opnieuw vullen
  for (let y = 0; y < GRID_HEIGHT; y++) {
    if (!Array.isArray(state.tiles[y]) || state.tiles[y].length !== GRID_WIDTH) {
      state.tiles = createEmptyTiles();
      return;
    }
  }
}

function initState() {
  state.money = 500;
  state.xp = 0;
  state.tiles = createEmptyTiles();
}

// --- XP & levels (C) ---
function getLevelInfo(xp) {
  let level = 1;
  let remaining = xp;
  let need = 100;

  while (remaining >= need) {
    remaining -= need;
    level++;
    need = Math.round(need * 1.3);
  }
  return { level, currentXp: remaining, xpToNext: need };
}

function addXp(amount) {
  state.xp += amount;
}

// --- Crop helpers ---
function getCropConfig(type) {
  return CROPS[type] || null;
}

function cropProgress(crop, now = Date.now()) {
  const cfg = getCropConfig(crop.type);
  if (!cfg) return 0;
  const elapsed = now - crop.plantedAt;
  return Math.min(1, elapsed / cfg.growTimeMs);
}

function cropReady(crop, now = Date.now()) {
  return cropProgress(crop, now) >= 1;
}

// --- Building helpers ---
function getBuildingConfig(type) {
  return BUILDINGS[type] || null;
}

function buildingReady(building, now = Date.now()) {
  return building.nextReadyAt && now >= building.nextReadyAt;
}

// --- Acties ---
function plantCrop(x, y, cropType) {
  const tile = state.tiles?.[y]?.[x];
  if (!tile || tile.building || tile.crop) return;

  const cfg = getCropConfig(cropType);
  if (!cfg || state.money < cfg.seedCost) return;

  state.money -= cfg.seedCost;
  tile.crop = { type: cropType, plantedAt: Date.now() };
  addXp(cfg.xpPlant || 1);
}

function harvestCrop(x, y) {
  const tile = state.tiles?.[y]?.[x];
  if (!tile || !tile.crop) return;

  const cfg = getCropConfig(tile.crop.type);
  if (!cfg || !cropReady(tile.crop)) return;

  state.money += cfg.value;
  addXp(cfg.xpHarvest || 3);
  tile.crop = null;
}

function buildBuilding(x, y, buildingType) {
  const tile = state.tiles?.[y]?.[x];
  if (!tile || tile.building || tile.crop) return;

  const cfg = getBuildingConfig(buildingType);
  if (!cfg || state.money < cfg.buildCost) return;

  state.money -= cfg.buildCost;
  tile.building = {
    type: buildingType,
    builtAt: Date.now(),
    nextReadyAt: Date.now() + cfg.productionTimeMs,
  };
  addXp(cfg.buildXp || 10);
}

function collectFromBuilding(x, y) {
  const tile = state.tiles?.[y]?.[x];
  if (!tile || !tile.building) return;

  const cfg = getBuildingConfig(tile.building.type);
  if (!cfg || !buildingReady(tile.building)) return;

  state.money += cfg.productValue;
  addXp(cfg.productXp || 5);
  tile.building.nextReadyAt = Date.now() + cfg.productionTimeMs;
}

// --- UI referenties ---
let currentAction = "plant";
let currentCropType = "wheat";
let currentBuildingType = "chicken_coop";

const moneyEl = document.getElementById("money");
const levelEl = document.getElementById("level");
const xpEl = document.getElementById("xp");
const xpNextEl = document.getElementById("xp-next");
const gridEl = document.getElementById("farm-grid");
const actionButtons = document.querySelectorAll("[data-action]");
const cropToolbarEl = document.getElementById("crop-toolbar");
const buildToolbarEl = document.getElementById("build-toolbar");

// --- Toolbars opbouwen ---
function buildCropToolbar() {
  cropToolbarEl.querySelectorAll("button").forEach((b) => b.remove());
  Object.values(CROPS).forEach((cfg) => {
    const btn = document.createElement("button");
    btn.textContent = `${cfg.emoji} ${cfg.name} (${cfg.seedCost})`;
    btn.dataset.cropType = cfg.key;
    if (cfg.key === currentCropType) btn.classList.add("active");
    btn.addEventListener("click", () => {
      currentCropType = cfg.key;
      updateToolbarActiveState();
    });
    cropToolbarEl.appendChild(btn);
  });
}

function buildBuildingToolbar() {
  buildToolbarEl.querySelectorAll("button").forEach((b) => b.remove());
  Object.values(BUILDINGS).forEach((cfg) => {
    const btn = document.createElement("button");
    btn.textContent = `${cfg.emoji} ${cfg.name} (${cfg.buildCost})`;
    btn.dataset.buildingType = cfg.key;
    if (cfg.key === currentBuildingType) btn.classList.add("active");
    btn.addEventListener("click", () => {
      currentBuildingType = cfg.key;
      updateToolbarActiveState();
    });
    buildToolbarEl.appendChild(btn);
  });
}

function updateToolbarActiveState() {
  cropToolbarEl.querySelectorAll("button").forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.cropType === currentCropType)
  );
  buildToolbarEl.querySelectorAll("button").forEach((btn) =>
    btn.classList.toggle(
      "active",
      btn.dataset.buildingType === currentBuildingType
    )
  );
}

// --- Rendering (grid tekenen) ---
function renderGrid() {
  gridEl.innerHTML = "";
  const now = Date.now();

  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const tile = state.tiles?.[y]?.[x];
      const div = document.createElement("div");
      div.classList.add("tile");

      let label = "";
      let small = "";

      if (!tile) {
        div.classList.add("empty");
      } else if (tile.building) {
        const cfg = getBuildingConfig(tile.building.type);
        const ready = buildingReady(tile.building, now);
        div.classList.add("building");
        if (ready) div.classList.add("building-ready");
        label = cfg?.emoji || "🏠";
        if (cfg) {
          const remaining = Math.max(
            0,
            Math.ceil((tile.building.nextReadyAt - now) / 1000)
          );
          small = ready ? "✅" : `${remaining}s`;
        }
      } else if (tile.crop) {
        const cfg = getCropConfig(tile.crop.type);
        const ready = cropReady(tile.crop, now);
        if (ready) div.classList.add("crop-ready");
        else div.classList.add("crop-growing");
        label = cfg?.emoji || "🌱";
      } else {
        div.classList.add("empty");
      }

      const content = document.createElement("div");
      content.classList.add("tile-label");
      content.textContent = label;
      if (small) {
        const s = document.createElement("span");
        s.textContent = small;
        s.classList.add("small");
        content.appendChild(s);
      }
      div.appendChild(content);

      div.addEventListener("click", () => {
        if (currentAction === "plant") {
          plantCrop(x, y, currentCropType);
        } else if (currentAction === "harvest") {
          harvestCrop(x, y);
        } else if (currentAction === "build") {
          buildBuilding(x, y, currentBuildingType);
        } else if (currentAction === "collect") {
          collectFromBuilding(x, y);
        }
        scheduleSave();
        updateUI();
      });

      gridEl.appendChild(div);
    }
  }
}

function updateUI() {
  const info = getLevelInfo(state.xp);
  moneyEl.textContent = state.money;
  levelEl.textContent = info.level;
  xpEl.textContent = info.currentXp;
  xpNextEl.textContent = info.xpToNext;
  renderGrid();
}

// --- Action buttons ---
actionButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentAction = btn.dataset.action;
    actionButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// --- Backend save/load (F) ---
let saveTimeout = null;

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveStateToServer, 400);
}

async function loadStateFromServer() {
  try {
    const res = await fetch("/api/state");
    if (!res.ok) {
      initState();
      return;
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.tiles)) {
      initState();
    } else {
      state = data;
      ensureTiles();
    }
  } catch (e) {
    console.warn("Kon state niet van server laden:", e);
    initState();
  }
}

async function saveStateToServer() {
  try {
    await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
  } catch (e) {
    console.warn("Kon state niet opslaan:", e);
  }
}

// --- Game start ---
async function startGame() {
  await loadStateFromServer();
  ensureTiles();
  buildCropToolbar();
  buildBuildingToolbar();
  updateToolbarActiveState();
  updateUI();
  setInterval(updateUI, 1000);
}

startGame();
