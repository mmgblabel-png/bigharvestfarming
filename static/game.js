// ======= CONFIG =======

const GRID_SIZE = 20;

const CROPS = {
  wheat: {
    id: "wheat",
    name: "Tarwe",
    emoji: "🌾",
    growTimeMs: 30_000, // 30 seconden
    seedCost: 10,
    value: 20,
    xpPlant: 2,
    xpHarvest: 5,
    minLevel: 1
  },
  corn: {
    id: "corn",
    name: "Maïs",
    emoji: "🌽",
    growTimeMs: 60_000, // 1 min
    seedCost: 25,
    value: 55,
    xpPlant: 4,
    xpHarvest: 10,
    minLevel: 2
  },
  carrot: {
    id: "carrot",
    name: "Wortel",
    emoji: "🥕",
    growTimeMs: 90_000, // 1.5 min
    seedCost: 40,
    value: 90,
    xpPlant: 6,
    xpHarvest: 16,
    minLevel: 3
  }
};

const BUILDINGS = {
  chicken_coop: {
    id: "chicken_coop",
    name: "Kippenhok",
    emoji: "🐔",
    buildCost: 200,
    buildXp: 15,
    productionTimeMs: 60_000,
    productName: "Eieren",
    productValue: 60,
    productXp: 10,
    minLevel: 2
  },
  cow_barn: {
    id: "cow_barn",
    name: "Koeienstal",
    emoji: "🐄",
    buildCost: 400,
    buildXp: 30,
    productionTimeMs: 120_000,
    productName: "Melk",
    productValue: 140,
    productXp: 20,
    minLevel: 3
  }
};

// Eenvoudige quest-definities
const QUEST_DEFS = [
  {
    id: "plant_wheat_10",
    title: "Zaai 10x tarwe",
    type: "plant_crop",
    cropId: "wheat",
    target: 10,
    rewardMoney: 100,
    rewardXp: 40
  },
  {
    id: "harvest_wheat_10",
    title: "Oogst 10x tarwe",
    type: "harvest_crop",
    cropId: "wheat",
    target: 10,
    rewardMoney: 150,
    rewardXp: 60
  },
  {
    id: "build_chicken_coop_1",
    title: "Bouw 1 kippenhok",
    type: "build_building",
    buildingId: "chicken_coop",
    target: 1,
    rewardMoney: 200,
    rewardXp: 80
  },
  {
    id: "collect_eggs_5",
    title: "Verzamel 5x eieren",
    type: "collect_product",
    buildingId: "chicken_coop",
    target: 5,
    rewardMoney: 250,
    rewardXp: 100
  }
];

// ======= GAME STATE =======

let state = null;

let currentAction = "none"; // "plant", "build", "harvest", "collect", "none"
let selectedCropId = null;
let selectedBuildingId = null;

// DOM refs
let farmGridEl;
let questListEl;
let hudMoneyEl;
let hudLevelEl;
let hudXpEl;
let hudXpNextEl;
let hudXpBarEl;
let hudActionLabelEl;
let cropButtonsContainer;
let buildingButtonsContainer;

// ======= INIT =======

window.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  setupToolbarButtons();
  createGrid();
  setupActionButtons();
  loadStateFromServer();

  // Periodieke render-timer
  setInterval(() => {
    if (state) {
      renderAll();
    }
  }, 500);
});

// ======= DOM helpers =======

function cacheDom() {
  farmGridEl = document.getElementById("farm-grid");
  questListEl = document.getElementById("quest-list");
  hudMoneyEl = document.getElementById("hud-money");
  hudLevelEl = document.getElementById("hud-level");
  hudXpEl = document.getElementById("hud-xp");
  hudXpNextEl = document.getElementById("hud-xp-next");
  hudXpBarEl = document.getElementById("hud-xp-bar");
  hudActionLabelEl = document.getElementById("hud-action-label");
  cropButtonsContainer = document.getElementById("crop-buttons");
  buildingButtonsContainer = document.getElementById("building-buttons");
}

function setupToolbarButtons() {
  // Gewas-knoppen
  cropButtonsContainer.innerHTML = "";
  Object.values(CROPS).forEach((crop) => {
    const btn = document.createElement("button");
    btn.textContent = `${crop.emoji} ${crop.name}`;
    btn.dataset.cropId = crop.id;
    btn.classList.add("crop-btn");
    btn.addEventListener("click", () => {
      if (btn.classList.contains("locked")) return;
      selectedCropId = crop.id;
      selectedBuildingId = null;
      currentAction = "plant";
      updateToolbarSelection();
      updateHudActionLabel();
    });
    cropButtonsContainer.appendChild(btn);
  });

  // Gebouw-knoppen
  buildingButtonsContainer.innerHTML = "";
  Object.values(BUILDINGS).forEach((b) => {
    const btn = document.createElement("button");
    btn.textContent = `${b.emoji} ${b.name}`;
    btn.dataset.buildingId = b.id;
    btn.classList.add("building-btn");
    btn.addEventListener("click", () => {
      if (btn.classList.contains("locked")) return;
      selectedBuildingId = b.id;
      selectedCropId = null;
      currentAction = "build";
      updateToolbarSelection();
      updateHudActionLabel();
    });
    buildingButtonsContainer.appendChild(btn);
  });
}

function setupActionButtons() {
  document.querySelectorAll(".action-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (action === "none") {
        currentAction = "none";
        selectedCropId = null;
        selectedBuildingId = null;
      } else {
        currentAction = action;
        selectedCropId = null;
        selectedBuildingId = null;
      }
      updateToolbarSelection();
      updateHudActionLabel();
    });
  });
}

function createGrid() {
  farmGridEl.innerHTML = "";
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const tileEl = document.createElement("div");
      tileEl.classList.add("tile", "tile-empty");
      tileEl.dataset.x = x;
      tileEl.dataset.y = y;
      tileEl.addEventListener("click", () => onTileClick(x, y));
      farmGridEl.appendChild(tileEl);
    }
  }
}

// ======= STATE / LEVEL =======

function ensureStateShape(s) {
  // Zorg dat tiles en quests bestaan (handig als bestaande save ouder is)
  if (!s.tiles || !Array.isArray(s.tiles)) {
    s.tiles = [];
  }
  for (let y = 0; y < GRID_SIZE; y++) {
    if (!s.tiles[y]) s.tiles[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!s.tiles[y][x]) {
        s.tiles[y][x] = {
          crop: null,
          cropPlantedAt: null,
          building: null,
          buildingStartedAt: null,
          lastProductCollectedAt: null
        };
      }
    }
  }

  if (!Array.isArray(s.quests)) {
    s.quests = [];
  }

  // Zorg dat alle QUEST_DEFS een state entry hebben
  QUEST_DEFS.forEach((q) => {
    if (!s.quests.find((entry) => entry.id === q.id)) {
      s.quests.push({
        id: q.id,
        progress: 0,
        completed: false,
        rewardClaimed: false
      });
    }
  });

  if (typeof s.money !== "number") s.money = 500;
  if (typeof s.xp !== "number") s.xp = 0;

  return s;
}

function getLevelInfo(xp) {
  let level = 1;
  let currentLevelXp = 0;
  let nextLevelXp = 100; // level 2 rond 100 XP

  while (xp >= nextLevelXp) {
    level++;
    currentLevelXp = nextLevelXp;
    nextLevelXp = Math.round(nextLevelXp * 1.3);
  }

  return { level, currentLevelXp, nextLevelXp };
}

function addXp(amount) {
  state.xp += amount;
}

function canUseCrop(cropId) {
  const crop = CROPS[cropId];
  const { level } = getLevelInfo(state.xp);
  return level >= crop.minLevel;
}

function canUseBuilding(buildingId) {
  const b = BUILDINGS[buildingId];
  const { level } = getLevelInfo(state.xp);
  return level >= b.minLevel;
}

// ======= SERVER COMM =======

async function loadStateFromServer() {
  try {
    const res = await fetch("/api/state");
    if (!res.ok) throw new Error("State load failed");
    const data = await res.json();
    state = ensureStateShape(data);
    renderAll();
  } catch (err) {
    console.error("Fout bij laden state:", err);
    state = ensureStateShape({
      money: 500,
      xp: 0,
      tiles: [],
      quests: []
    });
    renderAll();
  }
}

let saveTimeout = null;

function scheduleSaveState() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveStateToServer, 500);
}

async function saveStateToServer() {
  try {
    await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    });
  } catch (err) {
    console.error("Fout bij opslaan state:", err);
  }
}

// ======= TILE INTERACTION =======

function onTileClick(x, y) {
  if (!state) return;
  const tile = state.tiles[y][x];

  if (currentAction === "plant" && selectedCropId) {
    plantCrop(tile, selectedCropId);
  } else if (currentAction === "build" && selectedBuildingId) {
    buildBuilding(tile, selectedBuildingId);
  } else if (currentAction === "harvest") {
    harvestCrop(tile);
  } else if (currentAction === "collect") {
    collectFromBuilding(tile);
  }

  renderAll();
  scheduleSaveState();
}

// ======= ACTIONS =======

function plantCrop(tile, cropId) {
  const crop = CROPS[cropId];
  if (!crop) return;
  if (!canUseCrop(cropId)) return;
  if (tile.building || tile.crop) return;
  if (state.money < crop.seedCost) return;

  state.money -= crop.seedCost;
  tile.crop = cropId;
  tile.cropPlantedAt = Date.now();

  addXp(crop.xpPlant);
  updateQuestProgress("plant_crop", { cropId });
}

function harvestCrop(tile) {
  if (!tile.crop) return;
  const crop = CROPS[tile.crop];
  if (!crop) return;

  const now = Date.now();
  const plantedAt = tile.cropPlantedAt || now;
  const elapsed = now - plantedAt;

  if (elapsed < crop.growTimeMs) {
    return;
  }

  state.money += crop.value;
  addXp(crop.xpHarvest);

  updateQuestProgress("harvest_crop", { cropId: tile.crop });

  tile.crop = null;
  tile.cropPlantedAt = null;
}

function buildBuilding(tile, buildingId) {
  const b = BUILDINGS[buildingId];
  if (!b) return;
  if (!canUseBuilding(buildingId)) return;
  if (tile.building || tile.crop) return;
  if (state.money < b.buildCost) return;

  state.money -= b.buildCost;
  tile.building = buildingId;
  tile.buildingStartedAt = Date.now();
  tile.lastProductCollectedAt = null;

  addXp(b.buildXp);
  updateQuestProgress("build_building", { buildingId });
}

function collectFromBuilding(tile) {
  if (!tile.building) return;
  const b = BUILDINGS[tile.building];
  if (!b) return;

  const now = Date.now();
  const last =
    tile.lastProductCollectedAt ||
    tile.buildingStartedAt ||
    now - b.productionTimeMs;
  const elapsed = now - last;

  if (elapsed < b.productionTimeMs) {
    return;
  }

  state.money += b.productValue;
  addXp(b.productXp);

  tile.lastProductCollectedAt = now;

  updateQuestProgress("collect_product", { buildingId: tile.building });
}

// ======= QUESTS =======

function getQuestState(questId) {
  return state.quests.find((q) => q.id === questId);
}

function updateQuestProgress(type, payload) {
  QUEST_DEFS.forEach((qDef) => {
    if (qDef.type !== type) return;

    const qState = getQuestState(qDef.id);
    if (!qState || qState.completed) return;

    if (type === "plant_crop" || type === "harvest_crop") {
      if (qDef.cropId && qDef.cropId !== payload.cropId) return;
    }
    if (type === "build_building" || type === "collect_product") {
      if (qDef.buildingId && qDef.buildingId !== payload.buildingId) return;
    }

    qState.progress += 1;
    if (qState.progress >= qDef.target) {
      qState.completed = true;
      if (!qState.rewardClaimed) {
        state.money += qDef.rewardMoney;
        addXp(qDef.rewardXp);
        qState.rewardClaimed = true;
      }
    }
  });
}

// ======= RENDER =======

function renderAll() {
  renderHud();
  renderToolbarLockState();
  renderGrid();
  renderQuests();
}

function renderHud() {
  hudMoneyEl.textContent = state.money;

  const { level, currentLevelXp, nextLevelXp } = getLevelInfo(state.xp);
  hudLevelEl.textContent = level;
  hudXpEl.textContent = state.xp;
  hudXpNextEl.textContent = nextLevelXp;

  const range = nextLevelXp - currentLevelXp;
  const progress = state.xp - currentLevelXp;
  const percent = Math.max(0, Math.min(100, (progress / range) * 100));
  hudXpBarEl.style.width = `${percent}%`;

  updateHudActionLabel();
}

function updateHudActionLabel() {
  let text = "Geen";
  if (currentAction === "plant" && selectedCropId) {
    text = `Planten: ${CROPS[selectedCropId].name}`;
  } else if (currentAction === "build" && selectedBuildingId) {
    text = `Bouwen: ${BUILDINGS[selectedBuildingId].name}`;
  } else if (currentAction === "harvest") {
    text = "Oogsten";
  } else if (currentAction === "collect") {
    text = "Verzamelen";
  }
  hudActionLabelEl.textContent = text;
}

function renderToolbarLockState() {
  const { level } = getLevelInfo(state.xp);

  document.querySelectorAll(".crop-btn").forEach((btn) => {
    const cropId = btn.dataset.cropId;
    const crop = CROPS[cropId];
    const locked = level < crop.minLevel;
    btn.classList.toggle("locked", locked);
  });

  document.querySelectorAll(".building-btn").forEach((btn) => {
    const buildingId = btn.dataset.buildingId;
    const b = BUILDINGS[buildingId];
    const locked = level < b.minLevel;
    btn.classList.toggle("locked", locked);
  });

  updateToolbarSelection();
}

function updateToolbarSelection() {
  document
    .querySelectorAll(".crop-btn")
    .forEach((btn) => btn.classList.remove("crop-selected"));
  document
    .querySelectorAll(".building-btn")
    .forEach((btn) => btn.classList.remove("building-selected"));
  document
    .querySelectorAll(".action-btn")
    .forEach((btn) => btn.classList.remove("action-selected"));

  if (currentAction === "plant" && selectedCropId) {
    const btn = document.querySelector(
      `.crop-btn[data-crop-id="${selectedCropId}"]`
    );
    if (btn) btn.classList.add("crop-selected");
  } else if (currentAction === "build" && selectedBuildingId) {
    const btn = document.querySelector(
      `.building-btn[data-building-id="${selectedBuildingId}"]`
    );
    if (btn) btn.classList.add("building-selected");
  } else if (currentAction === "harvest" || currentAction === "collect") {
    const btn = document.querySelector(
      `.action-btn[data-action="${currentAction}"]`
    );
    if (btn) btn.classList.add("action-selected");
  }
}

function renderGrid() {
  const now = Date.now();
  const { children } = farmGridEl;

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const tile = state.tiles[y][x];
      const idx = y * GRID_SIZE + x;
      const el = children[idx];
      el.className = "tile";
      el.textContent = "";
      const indicator = el.querySelector(".tile-indicator");
      if (indicator) indicator.remove();

      if (!tile.crop && !tile.building) {
        el.classList.add("tile-empty");
        continue;
      }

      if (tile.crop) {
        const crop = CROPS[tile.crop];
        el.textContent = crop.emoji;

        const plantedAt = tile.cropPlantedAt || now;
        const elapsed = now - plantedAt;
        if (elapsed >= crop.growTimeMs) {
          el.classList.add("tile-crop-ready");
        } else {
          el.classList.add("tile-crop-growing");
        }
      }

      if (tile.building) {
        const b = BUILDINGS[tile.building];
        el.textContent = b.emoji;
        el.classList.add("tile-building");

        const last =
          tile.lastProductCollectedAt ||
          tile.buildingStartedAt ||
          now - b.productionTimeMs;
        const elapsed = now - last;

        if (elapsed >= b.productionTimeMs) {
          const ind = document.createElement("div");
          ind.classList.add("tile-indicator");
          ind.textContent = "✔";
          el.appendChild(ind);
        }
      }
    }
  }
}

function renderQuests() {
  questListEl.innerHTML = "";

  QUEST_DEFS.forEach((qDef) => {
    const qState = getQuestState(qDef.id);
    const card = document.createElement("div");
    card.classList.add("quest-card");
    if (qState && qState.completed) {
      card.classList.add("quest-completed");
    }

    const title = document.createElement("div");
    title.classList.add("quest-title");
    title.textContent = qDef.title;
    card.appendChild(title);

    const progressText = document.createElement("div");
    progressText.classList.add("quest-progress");
    const progress = qState ? qState.progress : 0;
    progressText.textContent = `${progress}/${qDef.target}`;
    card.appendChild(progressText);

    const reward = document.createElement("div");
    reward.classList.add("quest-reward");
    reward.textContent = `Beloning: 💰 ${qDef.rewardMoney} / XP ${qDef.rewardXp}`;
    card.appendChild(reward);

    questListEl.appendChild(card);
  });
}

