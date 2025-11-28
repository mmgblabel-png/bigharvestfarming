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
  },
  potato: {
    id: "potato",
    name: "Aardappel",
    emoji: "🥔",
    growTimeMs: 120_000,
    seedCost: 60,
    value: 140,
    xpPlant: 8,
    xpHarvest: 22,
    minLevel: 4
  },
  tomato: {
    id: "tomato",
    name: "Tomaat",
    emoji: "🍅",
    growTimeMs: 150_000,
    seedCost: 80,
    value: 190,
    xpPlant: 10,
    xpHarvest: 28,
    minLevel: 5
  },
  pumpkin: {
    id: "pumpkin",
    name: "Pompoen",
    emoji: "🎃",
    growTimeMs: 210_000,
    seedCost: 120,
    value: 300,
    xpPlant: 14,
    xpHarvest: 40,
    minLevel: 6
  },
  sunflower: {
    id: "sunflower",
    name: "Zonnebloem",
    emoji: "🌻",
    growTimeMs: 240_000,
    seedCost: 140,
    value: 360,
    xpPlant: 16,
    xpHarvest: 46,
    minLevel: 7
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
  },
  silo: {
    id: "silo",
    name: "Silo",
    emoji: "🛖",
    buildCost: 350,
    buildXp: 20,
    productionTimeMs: 180_000,
    productName: "Graanpakket",
    productValue: 120,
    productXp: 16,
    minLevel: 3
  },
  windmill: {
    id: "windmill",
    name: "Windmolen",
    emoji: "🌬️",
    buildCost: 600,
    buildXp: 40,
    productionTimeMs: 240_000,
    productName: "Meel",
    productValue: 220,
    productXp: 28,
    minLevel: 4
  },
  water_well: {
    id: "water_well",
    name: "Waterput",
    emoji: "🕳️",
    buildCost: 150,
    buildXp: 10,
    productionTimeMs: 45_000,
    productName: "Water",
    productValue: 30,
    productXp: 6,
    minLevel: 1
  },
  farmhouse: {
    id: "farmhouse",
    name: "Boerderijhuis",
    emoji: "🏡",
    buildCost: 500,
    buildXp: 35,
    productionTimeMs: 180_000,
    productName: "Maaltijd",
    productValue: 180,
    productXp: 24,
    minLevel: 4
  },
  storage_shed: {
    id: "storage_shed",
    name: "Opslag Schuur",
    emoji: "🧱",
    buildCost: 300,
    buildXp: 18,
    productionTimeMs: 150_000,
    productName: "Toolkit",
    productValue: 100,
    productXp: 14,
    minLevel: 2
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

let currentAction = "none"; // "plant", "build", "harvest", "collect", "plow", "water", "none"
let selectedCropId = null;
let selectedBuildingId = null;

// DOM refs
let farmGridEl;
let questListEl;
let inventoryListEl;
let hudMoneyEl;
let hudLevelEl;
let hudXpEl;
let hudXpNextEl;
let hudXpBarEl;
let hudActionLabelEl;
let cropButtonsContainer;
let buildingButtonsContainer;
let hudEnergyEl, hudEnergyMaxEl, hudEnergyBarEl;
let hudStorageUsedEl, hudStorageCapEl;
let timeOverlayEl, weatherOverlayEl;
let hudSeasonEl, hudWeatherEl;

// ======= INIT =======

window.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  setupToolbarButtons();
  createGrid();
  setupActionButtons();
  setupSystemButtons();
  setupShortcuts();
  setupAudio();
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
  inventoryListEl = document.getElementById("inventory-list");
  hudMoneyEl = document.getElementById("hud-money");
  hudLevelEl = document.getElementById("hud-level");
  hudXpEl = document.getElementById("hud-xp");
  hudXpNextEl = document.getElementById("hud-xp-next");
  hudXpBarEl = document.getElementById("hud-xp-bar");
  hudActionLabelEl = document.getElementById("hud-action-label");
  cropButtonsContainer = document.getElementById("crop-buttons");
  buildingButtonsContainer = document.getElementById("building-buttons");
  hudEnergyEl = document.getElementById("hud-energy");
  hudEnergyMaxEl = document.getElementById("hud-energy-max");
  hudEnergyBarEl = document.getElementById("hud-energy-bar");
  hudStorageUsedEl = document.getElementById("hud-storage-used");
  hudStorageCapEl = document.getElementById("hud-storage-cap");
  timeOverlayEl = document.getElementById("time-overlay");
  weatherOverlayEl = document.getElementById("weather-overlay");
  hudSeasonEl = document.getElementById("hud-season");
  hudWeatherEl = document.getElementById("hud-weather");
}

function setupToolbarButtons() {
  // Gewas-knoppen
  cropButtonsContainer.innerHTML = "";
  Object.values(CROPS).forEach((crop) => {
    const btn = document.createElement("button");
    btn.textContent = `${crop.emoji} ${crop.name} (-${crop.seedCost})`;
    btn.dataset.cropId = crop.id;
    btn.classList.add("crop-btn");
    btn.title = `Kost: ${crop.seedCost} | Waarde: ${crop.value} | Level ${crop.minLevel}+`;
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
    btn.textContent = `${b.emoji} ${b.name} (-${b.buildCost})`;
    btn.dataset.buildingId = b.id;
    btn.classList.add("building-btn");
    btn.title = `Kost: ${b.buildCost} | Product: ${b.productName} (+${b.productValue}) | Level ${b.minLevel}+`;
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

function setupSystemButtons() {
  const resetBtn = document.getElementById("btn-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
      const ok = window.confirm("Weet je zeker dat je het spel wilt resetten? Dit kan niet ongedaan worden gemaakt.");
      if (!ok) return;
      try {
        await api("/api/reset", { method: "POST" });
        await loadStateFromServer();
        showToast("Spel gereset.");
      } catch (e) {
        showToast("Reset mislukt.");
      }
    });
  }

  const sellBtn = document.getElementById("btn-sell-products");
  if (sellBtn) {
    sellBtn.addEventListener("click", () => {
      if (!state || !state.inventory) return;
      const prices = getSellPriceMap();
      let total = 0;
      let soldCount = 0;
      // Sell products and crops, exclude water/toolkit
      Object.entries(state.inventory).forEach(([k, v]) => {
        if (!v) return;
        if (k === "water" || k === "toolkit") return;
        const unit = prices[k] || 0;
        if (unit > 0) {
          total += unit * v;
          soldCount += v;
          state.inventory[k] = 0;
        }
      });
      if (total <= 0) {
        showToast("Niets te verkopen");
        return;
      }
      state.money += total;
      showToast(`Verkocht (${soldCount}) voor ${total} 💰`);
      renderAll();
      scheduleSaveState();
    });
  }

  const repairBtn = document.getElementById("btn-repair");
  if (repairBtn) {
    repairBtn.addEventListener("click", () => {
      if (!state) return;
      // Prefer toolkit; fallback to coins
      if ((state.inventory.toolkit || 0) > 0) {
        state.inventory.toolkit -= 1;
        state.tools.hoe = 100;
        state.tools.wateringCan = 100;
        showToast("Gereedschap gerepareerd met toolkit 🧰");
      } else if (state.money >= 100) {
        state.money -= 100;
        state.tools.hoe = Math.min(100, state.tools.hoe + 60);
        state.tools.wateringCan = Math.min(100, state.tools.wateringCan + 60);
        showToast("Gedeeltelijke reparatie uitgevoerd (-100)");
      } else {
        showToast("Geen toolkit of munten voor reparatie");
        return;
      }
      updateToolsIndicator();
      renderAll();
      scheduleSaveState();
    });
  }

  const harvestAllBtn = document.getElementById("btn-harvest-all");
  if (harvestAllBtn) {
    harvestAllBtn.addEventListener("click", () => {
      const count = harvestAllReady();
      if (count === 0) return showToast("Geen rijpe gewassen");
      showToast(`Geoogst: ${count}`);
      renderAll();
      scheduleSaveState();
    });
  }
  const collectAllBtn = document.getElementById("btn-collect-all");
  if (collectAllBtn) {
    collectAllBtn.addEventListener("click", () => {
      const count = collectAllReady();
      if (count === 0) return showToast("Niets om te verzamelen");
      showToast(`Verzameld: ${count}`);
      renderAll();
      scheduleSaveState();
    });
  }

  const shopBtn = document.getElementById("btn-open-shop");
  if (shopBtn) {
    shopBtn.addEventListener("click", () => {
      openShop();
    });
  }
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
          lastProductCollectedAt: null,
          plowed: false
        };
      }
      if (typeof s.tiles[y][x].plowed !== "boolean") s.tiles[y][x].plowed = false;
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
  if (!s.inventory || typeof s.inventory !== "object") s.inventory = {};
  const ensureInv = (k) => { if (typeof s.inventory[k] !== "number") s.inventory[k] = 0; };
  ["eggs","milk","grain_pack","flour","water","meal","toolkit","fertilizer"].forEach(ensureInv);
  Object.keys(CROPS).forEach((cid) => ensureInv(cid));

  // Tools durability
  if (!s.tools || typeof s.tools !== "object") s.tools = { hoe: 100, wateringCan: 100 };
  if (typeof s.tools.hoe !== "number") s.tools.hoe = 100;
  if (typeof s.tools.wateringCan !== "number") s.tools.wateringCan = 100;

  // Energy
  if (typeof s.maxEnergy !== "number") s.maxEnergy = 100;
  if (typeof s.energy !== "number") s.energy = s.maxEnergy;
  if (typeof s.lastEnergyTs !== "number") s.lastEnergyTs = Date.now();

  // Inventory capacity
  if (typeof s.inventoryCapacity !== "number") s.inventoryCapacity = 100;

  // Market pricing
  if (!s.market || typeof s.market !== "object") s.market = { lastUpdateTs: Date.now(), multipliers: {} };
  if (typeof s.market.lastUpdateTs !== "number") s.market.lastUpdateTs = Date.now();
  if (!s.market.multipliers || typeof s.market.multipliers !== "object") s.market.multipliers = {};
  const initMult = (k) => { if (typeof s.market.multipliers[k] !== "number") s.market.multipliers[k] = 1.0; };
  ["eggs","milk","grain_pack","flour","water","meal","toolkit"].forEach(initMult);
  Object.keys(CROPS).forEach((cid) => initMult(cid));

  // Time of day
  if (typeof s.timeOfDay !== "number") s.timeOfDay = Math.random();
  if (typeof s.lastTimeTs !== "number") s.lastTimeTs = Date.now();

  // Seasons & Weather
  if (typeof s.seasonIndex !== "number") s.seasonIndex = 1; // 0 lente, 1 zomer, 2 herfst, 3 winter
  if (typeof s.season !== "string") s.season = ["Lente","Zomer","Herfst","Winter"][s.seasonIndex] || "Zomer";
  if (typeof s.weather !== "string") s.weather = "Helder";
  if (typeof s.lastSeasonTs !== "number") s.lastSeasonTs = Date.now();
  if (typeof s.lastWeatherTs !== "number") s.lastWeatherTs = Date.now();

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
    const data = await api("/api/state");
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
  indicateSaving();
  saveTimeout = setTimeout(saveStateToServer, 500);
}

async function saveStateToServer() {
  try {
    await api("/api/state", {
      method: "POST",
      body: JSON.stringify(state),
      headers: { "Content-Type": "application/json" }
    });
    indicateSaved();
  } catch (err) {
    console.error("Fout bij opslaan state:", err);
    showToast("Opslaan mislukt");
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
  } else if (currentAction === "plow") {
    plowTile(tile);
  } else if (currentAction === "water") {
    waterTile(tile);
  } else if (currentAction === "fertilize") {
    fertilizeTile(tile);
  }

  renderAll();
  scheduleSaveState();
}

// ======= ACTIONS =======

function plantCrop(tile, cropId) {
  const crop = CROPS[cropId];
  if (!crop) return;
  if (!canUseCrop(cropId)) return;
  if (tile.building || tile.crop) return showToast("Tegel bezet");
  if (!tile.plowed) return showToast("Eerst ploegen (toets P)");
  if (state.money < crop.seedCost) return showToast("Onvoldoende munten");
  if (!spendEnergy(1)) return;

  state.money -= crop.seedCost;
  tile.crop = cropId;
  tile.cropPlantedAt = Date.now();

  addXp(crop.xpPlant);
  updateQuestProgress("plant_crop", { cropId });
  showToast(`${crop.emoji} Geplant!`);
  playSfx("plant");
}

function harvestCrop(tile) {
  if (!tile.crop) return;
  const crop = CROPS[tile.crop];
  if (!crop) return;
  if (!spendEnergy(1)) return;

  const now = Date.now();
  const plantedAt = tile.cropPlantedAt || now;
  const elapsed = now - plantedAt;

  if (elapsed < getEffectiveCropGrowMs(crop.id)) {
    return showToast("Nog niet klaar om te oogsten");
  }

  if (!canGainInventory(1)) return showToast("Opslag vol");
  state.money += crop.value;
  addXp(crop.xpHarvest);
  state.inventory[crop.id] = (state.inventory[crop.id] || 0) + 1;

  updateQuestProgress("harvest_crop", { cropId: tile.crop });

  tile.crop = null;
  tile.cropPlantedAt = null;
  tile.plowed = false;
  showToast("Oogst binnen! 💰");
  playSfx("harvest");
}

function buildBuilding(tile, buildingId) {
  const b = BUILDINGS[buildingId];
  if (!b) return;
  if (!canUseBuilding(buildingId)) return;
  if (tile.building || tile.crop) return showToast("Tegel bezet");
  if (state.money < b.buildCost) return showToast("Onvoldoende munten");
  if (!spendEnergy(5)) return;

  state.money -= b.buildCost;
  tile.building = buildingId;
  tile.buildingStartedAt = Date.now();
  tile.lastProductCollectedAt = null;

  addXp(b.buildXp);
  updateQuestProgress("build_building", { buildingId });
  showToast(`${b.emoji} Gebouwd!`);
  playSfx("build");
}

function collectFromBuilding(tile) {
  if (!tile.building) return;
  const b = BUILDINGS[tile.building];
  if (!b) return;
  if (!spendEnergy(1)) return;

  const now = Date.now();
  const last =
    tile.lastProductCollectedAt ||
    tile.buildingStartedAt ||
    now - b.productionTimeMs;
  const elapsed = now - last;

  if (elapsed < b.productionTimeMs) {
    return showToast("Nog in productie");
  }

  state.money += b.productValue;
  addXp(b.productXp);
  const key = productKeyForBuilding(b);
  if (!canGainInventory(1)) return showToast("Opslag vol");
  state.inventory[key] = (state.inventory[key] || 0) + 1;

  tile.lastProductCollectedAt = now;

  updateQuestProgress("collect_product", { buildingId: tile.building });
  showToast(`${b.productName} verzameld!`);
  playSfx("collect");
}

// ======= AUDIO =======
let audioCtx;
let isMuted = false;

function setupAudio() {
  try {
    isMuted = localStorage.getItem("bhf_muted") === "1";
  } catch {}
  const btn = document.getElementById("btn-mute");
  if (btn) {
    updateMuteButton(btn);
    btn.addEventListener("click", () => {
      isMuted = !isMuted;
      try { localStorage.setItem("bhf_muted", isMuted ? "1" : "0"); } catch {}
      updateMuteButton(btn);
    });
  }
  document.addEventListener("click", initAudioOnce, { once: true, capture: true });
}

function initAudioOnce() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  }
}

function updateMuteButton(btn) {
  btn.textContent = isMuted ? "🔇 Stille modus" : "🔊 Geluid";
}

function playSfx(kind) {
  if (isMuted || !window.AudioContext && !window.webkitAudioContext) return;
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = "sine";
  const now = audioCtx.currentTime;
  const conf = {
    plow: { f: 180, t: 0.08 },
    water: { f: 360, t: 0.05 },
    plant: { f: 420, t: 0.05 },
    harvest: { f: 520, t: 0.08 },
    collect: { f: 300, t: 0.08 },
    build: { f: 240, t: 0.1 }
  }[kind] || { f: 400, t: 0.06 };
  o.frequency.setValueAtTime(conf.f, now);
  g.gain.setValueAtTime(0.08, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + conf.t);
  o.connect(g).connect(audioCtx.destination);
  o.start();
  o.stop(now + conf.t);
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
      // Beloning claimen gaat nu handmatig via UI
    }
  });
}

// ======= RENDER =======

function renderAll() {
  regenEnergy();
  updateMarket();
  updateSeasonsAndWeather();
  renderHud();
  renderToolbarLockState();
  renderGrid();
  renderQuests();
  renderInventory();
  updateToolsIndicator();
  updateSellButtonIndicator();
  renderTimeOverlay();
  renderWeatherOverlay();
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

  // Energy HUD
  if (hudEnergyEl && hudEnergyMaxEl && hudEnergyBarEl) {
    hudEnergyEl.textContent = Math.floor(state.energy);
    hudEnergyMaxEl.textContent = state.maxEnergy;
    const ep = Math.max(0, Math.min(100, (state.energy / state.maxEnergy) * 100));
    hudEnergyBarEl.style.width = `${ep}%`;
  }

  // Storage HUD
  if (hudStorageUsedEl && hudStorageCapEl) {
    const used = inventoryUsed();
    hudStorageUsedEl.textContent = used;
    hudStorageCapEl.textContent = state.inventoryCapacity;
  }
  // Season / Weather HUD
  if (hudSeasonEl) hudSeasonEl.textContent = state.season || "Zomer";
  if (hudWeatherEl) hudWeatherEl.textContent = state.weather || "Helder";
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
  } else if (currentAction === "plow") {
    text = "Ploegen";
  } else if (currentAction === "water") {
    text = "Water geven";
  } else if (currentAction === "fertilize") {
    text = "Bemesten";
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
    if (locked) {
      btn.title = `${crop.name} vergrendeld — vereist level ${crop.minLevel}`;
    }
  });

  document.querySelectorAll(".building-btn").forEach((btn) => {
    const buildingId = btn.dataset.buildingId;
    const b = BUILDINGS[buildingId];
    const locked = level < b.minLevel;
    btn.classList.toggle("locked", locked);
    if (locked) {
      btn.title = `${b.name} vergrendeld — vereist level ${b.minLevel}`;
    }
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
      el.style.backgroundImage = "";
      const indicator = el.querySelector(".tile-indicator");
      if (indicator) indicator.remove();
      const oldAnimal = el.querySelector(".tile-animal");
      if (oldAnimal) oldAnimal.remove();
      const oldBlades = el.querySelector(".tile-overlay-blades");
      if (oldBlades) oldBlades.remove();
      const oldRipple = el.querySelector(".tile-overlay-ripple");
      if (oldRipple) oldRipple.remove();

      if (!tile.crop && !tile.building) {
        el.classList.add(tile.plowed ? "tile-plowed" : "tile-empty");
        continue;
      }

      if (tile.crop) {
        const crop = CROPS[tile.crop];
        const plantedAt = tile.cropPlantedAt || now;
        const elapsed = now - plantedAt;
        const isReady = elapsed >= getEffectiveCropGrowMs(crop.id);
        if (!setTileSprite(el, "crop", tile.crop, isReady)) {
          el.textContent = crop.emoji;
        }
        if (isReady) {
          el.classList.add("tile-crop-ready");
        } else {
          el.classList.add("tile-crop-growing");
        }
      }

      if (tile.building) {
        const b = BUILDINGS[tile.building];
        if (!setTileSprite(el, "building", tile.building, true)) {
          el.textContent = b.emoji;
        }
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

        // Animal overlay for barns
        const animalPath = SPRITES.animal && SPRITES.animal[tile.building];
        if (animalPath) {
          const a = document.createElement("div");
          a.className = "tile-animal";
          a.style.backgroundImage = `url(${animalPath})`;
          el.appendChild(a);
        }

        // Rotating blades for windmill
        if (tile.building === "windmill") {
          const blades = document.createElement("div");
          blades.className = "tile-overlay-blades";
          blades.style.backgroundImage = `url(${SPRITES.overlay.windmill_blades})`;
          el.appendChild(blades);
        }

        // Ripple overlay for water well
        if (tile.building === "water_well") {
          const rip = document.createElement("div");
          rip.className = "tile-overlay-ripple";
          rip.style.backgroundImage = `url(${SPRITES.overlay.well_ripple})`;
          el.appendChild(rip);
        }
      }
    }
  }
}

// ======= SPRITES =======
const SPRITES = {
  crop: {
    wheat: { growing: "/static/assets/crops/wheat_growing.svg", mature: "/static/assets/crops/wheat_mature.svg" },
    corn: { growing: "/static/assets/crops/corn_growing.svg", mature: "/static/assets/crops/corn_mature.svg" },
    carrot: { growing: "/static/assets/crops/carrot_growing.svg", mature: "/static/assets/crops/carrot_mature.svg" },
    potato: { growing: "/static/assets/crops/potato_growing.svg", mature: "/static/assets/crops/potato_mature.svg" },
    tomato: { growing: "/static/assets/crops/tomato_growing.svg", mature: "/static/assets/crops/tomato_mature.svg" },
    pumpkin: { growing: "/static/assets/crops/pumpkin_growing.svg", mature: "/static/assets/crops/pumpkin_mature.svg" },
    sunflower: { growing: "/static/assets/crops/sunflower_growing.svg", mature: "/static/assets/crops/sunflower_mature.svg" }
  },
  building: {
    chicken_coop: "/static/assets/buildings/chicken_coop.svg",
    cow_barn: "/static/assets/buildings/cow_barn.svg",
    silo: "/static/assets/buildings/silo.svg",
    windmill: "/static/assets/buildings/windmill.svg",
    water_well: "/static/assets/buildings/water_well.svg",
    farmhouse: "/static/assets/buildings/farmhouse.svg",
    storage_shed: "/static/assets/buildings/storage_shed.svg"
  },
  animal: {
    chicken_coop: "/static/assets/animals/chicken.svg",
    cow_barn: "/static/assets/animals/cow.svg"
  },
  overlay: {
    windmill_blades: "/static/assets/overlays/windmill_blades.svg",
    well_ripple: "/static/assets/overlays/well_ripple.svg"
  }
};

function setTileSprite(el, kind, id, isReady) {
  try {
    if (kind === "crop") {
      const m = SPRITES.crop[id];
      if (!m) return false;
      const path = isReady ? m.mature : m.growing;
      if (!path) return false;
      el.style.backgroundImage = `url(${path})`;
      return true;
    }
    if (kind === "building") {
      const path = SPRITES.building[id];
      if (!path) return false;
      el.style.backgroundImage = `url(${path})`;
      return true;
    }
  } catch {}
  return false;
}

// ======= SHORTCUTS =======
function setupShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Escape cancels
    if (e.key === "Escape") {
      currentAction = "none";
      selectedCropId = null;
      selectedBuildingId = null;
      updateToolbarSelection();
      updateHudActionLabel();
      return;
    }

    // Bulk actions
    if (e.key.toLowerCase() === "h" && e.shiftKey) { // Harvest all
      const count = harvestAllReady();
      if (count > 0) {
        showToast(`Geoogst: ${count}`);
        renderAll();
        scheduleSaveState();
      } else {
        showToast("Geen rijpe gewassen");
      }
      return;
    }
    if (e.key.toLowerCase() === "c" && e.shiftKey) { // Collect all
      const count = collectAllReady();
      if (count > 0) {
        showToast(`Verzameld: ${count}`);
        renderAll();
        scheduleSaveState();
      } else {
        showToast("Niets om te verzamelen");
      }
      return;
    }

    // Single actions
    if (e.key.toLowerCase() === "h") {
      currentAction = "harvest";
      selectedCropId = null;
      selectedBuildingId = null;
      updateToolbarSelection();
      updateHudActionLabel();
      return;
    }
    if (e.key.toLowerCase() === "c") {
      currentAction = "collect";
      selectedCropId = null;
      selectedBuildingId = null;
      updateToolbarSelection();
      updateHudActionLabel();
      return;
    }
    if (e.key.toLowerCase() === "p") {
      currentAction = "plow";
      selectedCropId = null;
      selectedBuildingId = null;
      updateToolbarSelection();
      updateHudActionLabel();
      return;
    }
    if (e.key.toLowerCase() === "w") {
      currentAction = "water";
      selectedCropId = null;
      selectedBuildingId = null;
      updateToolbarSelection();
      updateHudActionLabel();
      return;
    }
    if (e.key.toLowerCase() === "f") {
      currentAction = "fertilize";
      selectedCropId = null;
      selectedBuildingId = null;
      updateToolbarSelection();
      updateHudActionLabel();
      return;
    }
    if (e.key.toLowerCase() === "r") { // reset
      const btn = document.getElementById("btn-reset");
      if (btn) btn.click();
      return;
    }

    // Digits 1-9 select crops; Alt+1-9 select buildings
    if (/^[1-9]$/.test(e.key)) {
      const idx = parseInt(e.key, 10) - 1;
      if (e.altKey) {
        const buttons = Array.from(document.querySelectorAll(".building-btn:not(.locked)"));
        if (buttons[idx]) buttons[idx].click();
      } else {
        const buttons = Array.from(document.querySelectorAll(".crop-btn:not(.locked)"));
        if (buttons[idx]) buttons[idx].click();
      }
      return;
    }

    // Toggle shop
    if (e.key.toLowerCase() === "s") {
      toggleShop();
      return;
    }
  });
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

    if (qState && qState.completed && !qState.rewardClaimed) {
      const claim = document.createElement("button");
      claim.textContent = "Claim beloning";
      claim.addEventListener("click", () => {
        qState.rewardClaimed = true;
        state.money += qDef.rewardMoney;
        addXp(qDef.rewardXp);
        showToast("Beloning geclaimd! 💰⭐");
        renderAll();
        scheduleSaveState();
      });
      card.appendChild(claim);
    }

    questListEl.appendChild(card);
  });
}

function renderInventory() {
  if (!inventoryListEl) return;
  const entries = [];
  const productOrder = [
    ["water","💧","Water"],
    ["eggs","🥚","Eieren"],
    ["milk","🥛","Melk"],
    ["grain_pack","📦","Graanpakket"],
    ["flour","🧂","Meel"],
    ["meal","🍽️","Maaltijd"],
    ["toolkit","🧰","Toolkit"]
  ];
  productOrder.forEach(([k, icon, label]) => {
    const v = state.inventory[k] || 0;
    if (v > 0 || k === "water") entries.push({k, icon, label, v});
  });
  Object.values(CROPS).forEach((c) => {
    const v = state.inventory[c.id] || 0;
    if (v > 0) entries.push({k: c.id, icon: c.emoji, label: c.name, v});
  });
  inventoryListEl.innerHTML = "";
  const prices = getSellPriceMap();
  entries.forEach((e) => {
    const row = document.createElement("div");
    row.className = "inv-row";
    const unit = prices[e.k] || 0;
    row.title = unit > 0 ? `Waarde per stuk: ${unit}` : "Niet te verkopen";
    const left = document.createElement("span");
    left.textContent = `${e.icon} ${e.label}`;
    const right = document.createElement("span");
    right.textContent = e.v;
    row.appendChild(left);
    row.appendChild(right);
    if (e.k !== "water" && e.k !== "toolkit" && unit > 0 && e.v > 0) {
      const btn = document.createElement("button");
      btn.textContent = "Verkoop";
      btn.style.marginLeft = "8px";
      btn.addEventListener("click", () => {
        const amount = state.inventory[e.k] || 0;
        if (amount <= 0) return;
        const gain = unit * amount;
        state.inventory[e.k] = 0;
        state.money += gain;
        showToast(`Verkocht ${amount} × ${e.label} voor ${gain} 💰`);
        renderAll();
        scheduleSaveState();
      });
      row.appendChild(btn);
    }
    inventoryListEl.appendChild(row);
  });
}

function productKeyForBuilding(b) {
  switch (b.id) {
    case "chicken_coop": return "eggs";
    case "cow_barn": return "milk";
    case "silo": return "grain_pack";
    case "windmill": return "flour";
    case "water_well": return "water";
    case "farmhouse": return "meal";
    case "storage_shed": return "toolkit";
    default: return b.productName?.toLowerCase() || "item";
  }
}

// ======= UI FEEDBACK =======
let toastTimer = null;
function showToast(text) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = text;
  el.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 1300);
}

// Fetch wrapper + save indicator
async function api(path, options = {}) {
  const res = await fetch(path, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

function updateSellButtonIndicator() {
  const btn = document.getElementById("btn-sell-products");
  if (!btn || !state || !state.inventory) return;
  const prices = getSellPriceMap();
  let total = 0;
  Object.entries(state.inventory).forEach(([k, v]) => {
    if (!v) return;
    if (k === "water" || k === "toolkit") return;
    const unit = prices[k] || 0;
    total += unit * v;
  });
  btn.textContent = total > 0 ? `💸 Verkoop producten (+${total})` : "💸 Verkoop producten";
  btn.title = total > 0 ? `Verkoop alles voor ${total} munten` : "Verkoop alle producten";
}

function harvestAllReady() {
  let count = 0;
  const now = Date.now();
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const tile = state.tiles[y][x];
      if (!tile.crop) continue;
      const crop = CROPS[tile.crop];
      if (!crop) continue;
      const plantedAt = tile.cropPlantedAt || now;
      const elapsed = now - plantedAt;
      if (elapsed >= getEffectiveCropGrowMs(crop.id)) {
        harvestCrop(tile);
        count++;
      }
    }
  }
  return count;
}

function collectAllReady() {
  let count = 0;
  const now = Date.now();
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const tile = state.tiles[y][x];
      if (!tile.building) continue;
      const b = BUILDINGS[tile.building];
      if (!b) continue;
      const last = tile.lastProductCollectedAt || tile.buildingStartedAt || now - b.productionTimeMs;
      const elapsed = now - last;
      if (elapsed >= b.productionTimeMs) {
        collectFromBuilding(tile);
        count++;
      }
    }
  }
  return count;
}

function indicateSaving() {
  const el = document.getElementById("save-indicator");
  if (!el) return;
  el.textContent = "💾 Opslaan...";
  el.classList.add("saving");
  el.classList.remove("saved");
}

function indicateSaved() {
  const el = document.getElementById("save-indicator");
  if (!el) return;
  el.textContent = "💾 Opgeslagen";
  el.classList.remove("saving");
  el.classList.add("saved");
  setTimeout(() => {
    el.classList.remove("saved");
  }, 1200);
}

// ======= TOOLS / ACTION HELPERS =======
function updateToolsIndicator() {
  const el = document.getElementById("tools-indicator");
  if (!el || !state || !state.tools) return;
  const hoe = Math.max(0, Math.min(100, state.tools.hoe || 0));
  const can = Math.max(0, Math.min(100, state.tools.wateringCan || 0));
  el.textContent = `🪓 Ploeg: ${hoe} | 💧 Gieter: ${can}`;
}

function getSellPriceMap() {
  const base = {
    eggs: BUILDINGS.chicken_coop.productValue,
    milk: BUILDINGS.cow_barn.productValue,
    grain_pack: BUILDINGS.silo.productValue,
    flour: BUILDINGS.windmill.productValue,
    water: BUILDINGS.water_well.productValue,
    meal: BUILDINGS.farmhouse.productValue,
    toolkit: BUILDINGS.storage_shed.productValue
  };
  Object.values(CROPS).forEach((c) => { base[c.id] = c.value; });
  const out = {};
  Object.entries(base).forEach(([k, v]) => {
    const mult = (state.market && state.market.multipliers && state.market.multipliers[k]) || 1.0;
    out[k] = Math.max(1, Math.round(v * mult));
  });
  return out;
}

function plowTile(tile) {
  if (!tile) return;
  if (!state.tools || state.tools.hoe <= 0) return showToast("Ploeg kapot — repareer eerst");
  if (tile.crop || tile.building) return showToast("Tegel bezet");
  if (tile.plowed) return showToast("Al geploegd");
  if (!spendEnergy(2)) return;
  tile.plowed = true;
  state.tools.hoe = Math.max(0, (state.tools.hoe || 0) - 1);
  playSfx("plow");
}

function waterTile(tile) {
  if (!tile || !tile.crop) return showToast("Geen gewas hier");
  const crop = CROPS[tile.crop];
  if (!crop) return;
  if (!state.tools || state.tools.wateringCan <= 0) return showToast("Gieter kapot — repareer eerst");
  if ((state.inventory.water || 0) <= 0) return showToast("Geen water in voorraad");
  if (!spendEnergy(1)) return;
  const now = Date.now();
  const plantedAt = tile.cropPlantedAt || now;
  const elapsed = now - plantedAt;
  const remaining = Math.max(0, crop.growTimeMs - elapsed);
  if (remaining <= 0) return showToast("Al klaar om te oogsten");
  const delta = Math.min(30_000, remaining);
  tile.cropPlantedAt = plantedAt - delta; // versnellen
  state.inventory.water = Math.max(0, (state.inventory.water || 0) - 1);
  state.tools.wateringCan = Math.max(0, (state.tools.wateringCan || 0) - 1);
  showToast("Gewas bewaterd (-1 💧)");
  playSfx("water");
}

function fertilizeTile(tile) {
  if (!tile || !tile.crop) return showToast("Geen gewas hier");
  const crop = CROPS[tile.crop];
  if (!crop) return;
  if ((state.inventory.fertilizer || 0) <= 0) return showToast("Geen mest beschikbaar");
  if (!spendEnergy(2)) return;
  const now = Date.now();
  const plantedAt = tile.cropPlantedAt || now;
  const elapsed = now - plantedAt;
  const remaining = Math.max(0, crop.growTimeMs - elapsed);
  if (remaining <= 0) return showToast("Al klaar om te oogsten");
  const delta = Math.min(60_000, remaining);
  tile.cropPlantedAt = plantedAt - delta;
  state.inventory.fertilizer = Math.max(0, (state.inventory.fertilizer || 0) - 1);
  showToast("Gewas bemest (-1 🧪)");
}

// Energy / inventory / market / time helpers
function regenEnergy() {
  const now = Date.now();
  const dt = Math.max(0, now - (state.lastEnergyTs || now));
  const regenPerMs = 1 / 5000; // 1 energy per 5s
  state.energy = Math.min(state.maxEnergy, state.energy + dt * regenPerMs);
  state.lastEnergyTs = now;
}

function spendEnergy(amount) {
  if (state.energy < amount) {
    showToast("Onvoldoende energie");
    return false;
  }
  state.energy -= amount;
  return true;
}

function inventoryUsed() {
  if (!state.inventory) return 0;
  return Object.values(state.inventory).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
}

function canGainInventory(amount) {
  return inventoryUsed() + amount <= state.inventoryCapacity;
}

function updateMarket() {
  const now = Date.now();
  if (!state.market) return;
  if (now - state.market.lastUpdateTs < 60_000) return;
  const keys = new Set([
    ...Object.keys(CROPS),
    "eggs","milk","grain_pack","flour","water","meal","toolkit"
  ]);
  keys.forEach((k) => {
    const cur = state.market.multipliers[k] || 1.0;
    const delta = (Math.random() * 0.1) - 0.05; // -0.05..0.05
    const next = Math.max(0.7, Math.min(1.4, cur + delta));
    state.market.multipliers[k] = parseFloat(next.toFixed(2));
  });
  state.market.lastUpdateTs = now;
}

function renderTimeOverlay() {
  if (!timeOverlayEl) return;
  const now = Date.now();
  const dt = Math.max(0, now - (state.lastTimeTs || now));
  state.lastTimeTs = now;
  const dayLenMs = 120_000; // 2 minutes per day
  state.timeOfDay = (state.timeOfDay + dt / dayLenMs) % 1;
  const nightStrength = Math.max(0, Math.cos(state.timeOfDay * Math.PI * 2));
  const opacity = Math.max(0, nightStrength * 0.35);
  timeOverlayEl.style.opacity = opacity.toFixed(2);
}

// ======= SEASONS / WEATHER =======
const SEASONS = [
  { name: "Lente", speed: 1.1, weatherWeights: { Helder: 40, Bewolkt: 25, Regen: 30, Sneeuw: 0, Storm: 5 } },
  { name: "Zomer", speed: 1.0, weatherWeights: { Helder: 50, Bewolkt: 20, Regen: 20, Sneeuw: 0, Storm: 10 } },
  { name: "Herfst", speed: 0.9, weatherWeights: { Helder: 35, Bewolkt: 30, Regen: 25, Sneeuw: 0, Storm: 10 } },
  { name: "Winter", speed: 0.7, weatherWeights: { Helder: 25, Bewolkt: 35, Regen: 5, Sneeuw: 30, Storm: 5 } }
];

function pickWeather(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * total;
  for (const [name, w] of entries) {
    if ((r -= w) <= 0) return name;
  }
  return "Helder";
}

function updateSeasonsAndWeather() {
  const now = Date.now();
  const seasonLen = 180_000; // ~3 min per season
  if (now - state.lastSeasonTs >= seasonLen) {
    state.seasonIndex = (state.seasonIndex + 1) % SEASONS.length;
    state.season = SEASONS[state.seasonIndex].name;
    state.lastSeasonTs = now;
  }
  const weatherInterval = 45_000 + Math.floor(Math.random() * 45_000);
  if (now - state.lastWeatherTs >= weatherInterval) {
    const curSeason = SEASONS[state.seasonIndex] || SEASONS[1];
    state.weather = pickWeather(curSeason.weatherWeights);
    state.lastWeatherTs = now;
  }
}

function weatherSpeedMultiplier() {
  switch (state.weather) {
    case "Regen": return 1.15;
    case "Sneeuw": return 0.8;
    case "Bewolkt": return 1.0;
    case "Storm": return 1.05;
    default: return 1.0; // Helder
  }
}

function getEffectiveCropGrowMs(cropId) {
  const crop = CROPS[cropId];
  if (!crop) return 0;
  const seasonMul = (SEASONS[state.seasonIndex] || SEASONS[1]).speed;
  const weatherMul = weatherSpeedMultiplier();
  const speed = seasonMul * weatherMul;
  return Math.max(1000, Math.round(crop.growTimeMs / speed));
}

function renderWeatherOverlay() {
  if (!weatherOverlayEl) return;
  weatherOverlayEl.innerHTML = "";
  let cls = null;
  if (state.weather === "Regen") cls = "weather-rain";
  if (state.weather === "Sneeuw") cls = "weather-snow";
  if (cls) {
    const layer = document.createElement("div");
    layer.className = cls;
    weatherOverlayEl.appendChild(layer);
  }
}

// ======= SHOP =======
function getShopItems() {
  const prices = getSellPriceMap();
  return [
    { id: "water10", label: "💧 Water ×10", price: Math.max(10, Math.round((prices.water || 30) * 3.0)), buy: () => { state.inventory.water = (state.inventory.water||0) + 10; } },
    { id: "fert5", label: "🧪 Mest ×5", price: 100, buy: () => { state.inventory.fertilizer = (state.inventory.fertilizer||0) + 5; } },
    { id: "tool1", label: "🧰 Toolkit ×1", price: Math.max(80, Math.round((prices.toolkit || 100) * 1.2)), buy: () => { state.inventory.toolkit = (state.inventory.toolkit||0) + 1; } },
    { id: "cap20", label: "🗄️ Opslag +20", price: 200, buy: () => { state.inventoryCapacity = (state.inventoryCapacity||100) + 20; } }
  ];
}

function openShop() {
  const modal = document.getElementById("shop-modal");
  const body = document.getElementById("shop-body");
  if (!modal || !body) return;
  body.innerHTML = "";
  getShopItems().forEach((it) => {
    const row = document.createElement("div");
    row.className = "shop-row";
    const title = document.createElement("div");
    title.className = "shop-title";
    title.textContent = it.label;
    const price = document.createElement("div");
    price.className = "shop-price";
    price.textContent = `${it.price} 💰`;
    const btn = document.createElement("button");
    btn.className = "shop-buy";
    btn.textContent = "Koop";
    btn.addEventListener("click", () => {
      if (state.money < it.price) return showToast("Onvoldoende munten");
      state.money -= it.price;
      it.buy();
      showToast("Aankoop voltooid");
      renderAll();
      scheduleSaveState();
    });
    row.appendChild(title);
    row.appendChild(price);
    row.appendChild(btn);
    body.appendChild(row);
  });
  modal.classList.remove("hidden");
  modal.querySelectorAll('[data-close="shop"]').forEach((el) => {
    el.addEventListener("click", closeShop, { once: true });
  });
}

function closeShop() {
  const modal = document.getElementById("shop-modal");
  if (modal) modal.classList.add("hidden");
}

function toggleShop() {
  const modal = document.getElementById("shop-modal");
  if (!modal) return;
  if (modal.classList.contains("hidden")) openShop(); else closeShop();
}

