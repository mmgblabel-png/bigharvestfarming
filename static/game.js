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
const questListEl = document.getElementById("quest-list");

// --- Gebouwen (B) ---
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
    minLevel: 2,
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
    minLevel: 3,
  },
};


// --- Game-state ---
let state = {
  money: 500,
  xp: 0,
  tiles: [],
  quests: [], // lijst van actieve quests
};
// --- Quests-config ---
const QUEST_DEFS = [
  {
    id: "harvest_10_wheat",
    title: "Oogst 10 tarwe",
    type: "harvest_crop",
    cropType: "wheat",
    target: 10,
    rewardMoney: 100,
    rewardXp: 20,
  },
  {
    id: "build_chicken_coop",
    title: "Bouw 1 kippenhok",
    type: "build_building",
    buildingType: "chicken_coop",
    target: 1,
    rewardMoney: 150,
    rewardXp: 30,
  },
  {
    id: "collect_5_eggs",
    title: "Verzamel 5x eieren",
    type: "collect_product",
    buildingType: "chicken_coop",
    target: 5,
    rewardMoney: 200,
    rewardXp: 40,
  },
];

function initQuestsIfNeeded() {
  if (!Array.isArray(state.quests) || state.quests.length === 0) {
    state.quests = QUEST_DEFS.map((q) => ({
      id: q.id,
      progress: 0,
      completed: false,
    }));
  }
}


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
  state.quests = [];
  initQuestsIfNeeded();
}

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
 // --- Quests bijwerken ---
function updateQuestsOnAction(action, payload) {
  // zorg dat quests bestaan
  initQuestsIfNeeded();

  const questMap = {};
  for (const q of state.quests) {
    questMap[q.id] = q;
  }

  const levelInfo = getLevelInfo(state.xp);

  for (const def of QUEST_DEFS) {
    const q = questMap[def.id];
    if (!q || q.completed) continue;

    switch (def.type) {
      case "harvest_crop":
        if (
          action === "harvest_crop" &&
          payload.cropType === def.cropType
        ) {
          q.progress += 1;
        }
        break;

      case "build_building":
        if (
          action === "build_building" &&
          payload.buildingType === def.buildingType
        ) {
          q.progress += 1;
        }
        break;

      case "collect_product":
        if (
          action === "collect_product" &&
          payload.buildingType === def.buildingType
        ) {
          q.progress += 1;
        }
        break;

      default:
        break;
    }

    // check of quest klaar is
    if (!q.completed && q.progress >= def.target) {
      q.completed = true;
      state.money += def.rewardMoney;
      addXp(def.rewardXp);
      console.log(
        `Quest voltooid: ${def.title} (+${def.rewardMoney} geld, +${def.rewardXp} XP)`
      );
    }
  }
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
function harvestCrop(x, y) {
  const tile = state.tiles?.[y]?.[x];
  if (!tile || !tile.crop) return;

  const cropType = tile.crop.type;
  const cfg = getCropConfig(cropType);
  if (!cfg || !cropReady(tile.crop)) return;

  state.money += cfg.value;
  addXp(cfg.xpHarvest || 3);
  tile.crop = null;

  updateQuestsOnAction("harvest_crop", { cropType });
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

  updateQuestsOnAction("build_building", { buildingType });
}


function collectFromBuilding(x, y) {
  const tile = state.tiles?.[y]?.[x];
  if (!tile || !tile.building) return;

  const buildingType = tile.building.type;
  const cfg = getBuildingConfig(buildingType);
  if (!cfg || !buildingReady(tile.building)) return;

  state.money += cfg.productValue;
  addXp(cfg.productXp || 5);
  tile.building.nextReadyAt = Date.now() + cfg.productionTimeMs;

  updateQuestsOnAction("collect_product", { buildingType });
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
  const levelInfo = getLevelInfo(state.xp);

  Object.values(BUILDINGS).forEach((cfg) => {
    const btn = document.createElement("button");
    const locked = levelInfo.level < (cfg.minLevel || 1);
    btn.textContent = locked
      ? `🔒 ${cfg.name} (level ${cfg.minLevel})`
      : `${cfg.emoji} ${cfg.name} (${cfg.buildCost})`;
    btn.dataset.buildingType = cfg.key;

    if (cfg.key === currentBuildingType && !locked) {
      btn.classList.add("active");
    }

    if (locked) {
      btn.disabled = true;
      btn.style.opacity = "0.6";
    } else {
      btn.addEventListener("click", () => {
        currentBuildingType = cfg.key;
        updateToolbarActiveState();
      });
    }
    buildToolbarEl.appendChild(btn);
  });
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
function renderQuests() {
  questListEl.innerHTML = "";
  initQuestsIfNeeded();

  for (const def of QUEST_DEFS) {
    const q = state.quests.find((qq) => qq.id === def.id);
    if (!q) continue;

    const li = document.createElement("li");
    li.classList.add("quest-item");
    if (q.completed) li.classList.add("completed");

    const title = document.createElement("div");
    title.classList.add("quest-title");
    title.textContent = def.title;

    const progress = document.createElement("div");
    progress.classList.add("quest-progress");
    const capped = Math.min(q.progress, def.target);
    progress.textContent = `${capped}/${def.target}  •  +${def.rewardMoney}💰  +${def.rewardXp}XP`;

    li.appendChild(title);
    li.appendChild(progress);
    questListEl.appendChild(li);
  }
}

function updateUI() {
  const info = getLevelInfo(state.xp);
  moneyEl.textContent = state.money;
  levelEl.textContent = info.level;
  xpEl.textContent = info.currentXp;
  xpNextEl.textContent = info.xpToNext;
  renderGrid();
  renderQuests();
}

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

async function startGame() {
  await loadStateFromServer();
  ensureTiles();
  initQuestsIfNeeded();
  buildCropToolbar();
  buildBuildingToolbar();
  updateToolbarActiveState();
  updateUI();
  setInterval(updateUI, 1000);
}

