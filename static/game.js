// ======= CONFIG =======

const GRID_SIZE = 20;
const RENDER_INTERVAL_MS = 500;
const GRID_RENDER_THROTTLE_MS = 1000;

const CROPS = {
  wheat: {
    id: "wheat",
    name: "Tarwe",
    emoji: "🌾",
    growTimeMs: 30_000, // 30 seconden
    seedCost: 12,
    value: 24,
    xpPlant: 3,
    xpHarvest: 6,
    minLevel: 1,
    seasons: ["Lente","Zomer","Herfst"]
  },
  corn: {
    id: "corn",
    name: "Maïs",
    emoji: "🌽",
    growTimeMs: 60_000, // 1 min
    seedCost: 28,
    value: 65,
    xpPlant: 5,
    xpHarvest: 12,
    minLevel: 2,
    seasons: ["Zomer"]
  },
  carrot: {
    id: "carrot",
    name: "Wortel",
    emoji: "🥕",
    growTimeMs: 90_000, // 1.5 min
    seedCost: 44,
    value: 110,
    xpPlant: 7,
    xpHarvest: 18,
    minLevel: 3,
    seasons: ["Lente","Herfst"]
  },
  potato: {
    id: "potato",
    name: "Aardappel",
    emoji: "🥔",
    growTimeMs: 120_000,
    seedCost: 66,
    value: 165,
    xpPlant: 9,
    xpHarvest: 24,
    minLevel: 4,
    seasons: ["Lente","Herfst"]
  },
  tomato: {
    id: "tomato",
    name: "Tomaat",
    emoji: "🍅",
    growTimeMs: 150_000,
    seedCost: 88,
    value: 230,
    xpPlant: 11,
    xpHarvest: 32,
    minLevel: 5,
    seasons: ["Zomer"]
  },
  pumpkin: {
    id: "pumpkin",
    name: "Pompoen",
    emoji: "🎃",
    growTimeMs: 210_000,
    seedCost: 132,
    value: 380,
    xpPlant: 16,
    xpHarvest: 46,
    minLevel: 6,
    seasons: ["Herfst"]
  },
  sunflower: {
    id: "sunflower",
    name: "Zonnebloem",
    emoji: "🌻",
    growTimeMs: 240_000,
    seedCost: 155,
    value: 460,
    xpPlant: 18,
    xpHarvest: 54,
    minLevel: 7,
    seasons: ["Zomer"]
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
    productValue: 70,
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
    productValue: 165,
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
    productValue: 140,
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
    productValue: 260,
    productXp: 28,
    minLevel: 4,
    requires: { wheat: 2 } // needs 2 wheat per production cycle
  },
  water_well: {
    id: "water_well",
    name: "Waterput",
    emoji: "🕳️",
    buildCost: 150,
    buildXp: 10,
    productionTimeMs: 45_000,
    productName: "Water",
    productValue: 34,
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
    productValue: 210,
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
    productValue: 120,
    productXp: 14,
    minLevel: 2
  }
};

// ======= UTILITY HELPERS =======
/**
 * Iterate over every tile in the grid.
 * @param {(tile:Object,x:number,y:number)=>void} cb Callback with tile and coords.
 */
function forEachTile(cb) {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      cb(state.tiles[y][x], x, y);
    }
  }
}

/**
 * Format numbers for UI with locale thousands grouping.
 * @param {number} n
 * @returns {string}
 */
function fmt(n) {
  try { return n.toLocaleString('nl-NL'); } catch { return String(n); }
}

/**
 * Determine if the crop on a tile is fully grown.
 * @param {Object} tile Tile state object.
 * @param {number} now Timestamp reference.
 * @returns {boolean}
 */
function tileCropReady(tile, now) {
  if (!tile.crop) return false;
  const crop = CROPS[tile.crop];
  if (!crop) return false;
  const plantedAt = tile.cropPlantedAt || now;
  return (now - plantedAt) >= getEffectiveCropGrowMs(crop.id);
}

/**
 * Determine if the building on a tile has a product ready.
 * @param {Object} tile Tile state object.
 * @param {number} now Timestamp reference.
 * @returns {boolean}
 */
function tileBuildingReady(tile, now) {
  if (!tile.building) return false;
  const b = BUILDINGS[tile.building];
  if (!b) return false;
  const last = tile.lastProductCollectedAt || tile.buildingStartedAt || now - getEffectiveBuildingProductionMs(b.id);
  return (now - last) >= getEffectiveBuildingProductionMs(b.id);
}

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
  },
  {
    id: "harvest_corn_5",
    title: "Oogst 5x maïs",
    type: "harvest_crop",
    cropId: "corn",
    target: 5,
    rewardMoney: 220,
    rewardXp: 120
  },
  {
    id: "build_windmill_1",
    title: "Bouw 1 windmolen",
    type: "build_building",
    buildingId: "windmill",
    target: 1,
    rewardMoney: 400,
    rewardXp: 160
  },
  {
    id: "collect_milk_5",
    title: "Verzamel 5x melk",
    type: "collect_product",
    buildingId: "cow_barn",
    target: 5,
    rewardMoney: 300,
    rewardXp: 140
  }
];

// ======= GAME STATE =======

let state = null;
let currentProfile = localStorage.getItem("bhf_profile") || "default";

let currentAction = "none"; // "plant", "build", "harvest", "collect", "plow", "water", "none"
let selectedCropId = null;
let selectedBuildingId = null;

// DOM refs
let farmGridEl;
let questListEl;
let inventoryListEl;
let statsListEl;
let hudMoneyEl;
let hudLevelEl;
let hudXpEl;
let hudXpNextEl;
let hudXpBarEl;
let hudMarketTrendEl;
let hudMarketSparkEl;
let hudActionLabelEl;
let cropButtonsContainer;
let buildingButtonsContainer;
let hudEnergyEl, hudEnergyMaxEl, hudEnergyBarEl;
let hudStorageUsedEl, hudStorageCapEl;
let timeOverlayEl, weatherOverlayEl;
let hudSeasonEl, hudWeatherEl;
let profileInputEl, profileApplyEl;
let lastFxRect = null;
let prevLevel = 1; // track previous level for level-up bloom
let lastGridRenderTs = 0; // throttle grid rendering
// Undo stack (client-only)
let undoStack = [];
// Market sparkline history
let marketTrendHistory = [];

// ======= INIT =======

window.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  setupToolbarButtons();
  createGrid();
  setupActionButtons();
  setupSystemButtons();
  setupShortcuts();
  setupAudio();
  setupProfileUi();
  loadStateFromServer();

  // Periodieke render-timer
  setInterval(() => {
    if (state) {
      renderAll();
    }
  }, RENDER_INTERVAL_MS);

  // Ensure pending save is flushed when leaving the page
  window.addEventListener('beforeunload', () => {
    if (saveTimeout) {
      try { saveStateToServer(); } catch {}
    }
  });
});

// ======= DOM helpers =======

function cacheDom() {
  farmGridEl = document.getElementById("farm-grid");
  questListEl = document.getElementById("quest-list");
  inventoryListEl = document.getElementById("inventory-list");
  statsListEl = document.getElementById("stats-list");
  hudMoneyEl = document.getElementById("hud-money");
  hudLevelEl = document.getElementById("hud-level");
  hudXpEl = document.getElementById("hud-xp");
  hudXpNextEl = document.getElementById("hud-xp-next");
  hudXpBarEl = document.getElementById("hud-xp-bar");
  hudMarketTrendEl = document.getElementById("hud-market-trend");
  hudMarketSparkEl = document.getElementById("hud-market-spark");
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
  profileInputEl = document.getElementById("profile-input");
  profileApplyEl = document.getElementById("profile-apply");
}

function setupProfileUi() {
  if (profileInputEl) profileInputEl.value = currentProfile || "default";
  if (profileApplyEl) {
    profileApplyEl.addEventListener("click", () => {
      const val = (profileInputEl && profileInputEl.value.trim()) || "default";
      currentProfile = val || "default";
      try { localStorage.setItem("bhf_profile", currentProfile); } catch {}
      loadStateFromServer();
      showToast(`Profiel geladen: ${currentProfile}`);
    });
  }
}

function setupToolbarButtons() {
  // Gewas-knoppen
  cropButtonsContainer.innerHTML = "";
  Object.values(CROPS).forEach((crop) => {
    const btn = document.createElement("button");
    btn.textContent = `${crop.emoji} ${crop.name} (-${crop.seedCost})`;
    btn.dataset.cropId = crop.id;
    btn.classList.add("crop-btn");
    const seasonsText = crop.seasons ? ` | Seizoen: ${crop.seasons.join("/")}` : "";
    btn.title = `Kost: ${crop.seedCost} | Waarde: ${crop.value} | Level ${crop.minLevel}+${seasonsText}`;
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
        await api(`/api/reset?profile=${encodeURIComponent(currentProfile)}`, { method: "POST" });
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
      pushUndo("sell-all");
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
      if (state.stats) state.stats.moneyEarned = (state.stats.moneyEarned || 0) + total;
      showToast(`Verkocht (${soldCount}) voor ${total} 💰`);
      spawnFloatingText(`+${total} 💰`, "#ffeb3b");
      microShake();
      renderAll();
      scheduleSaveState();
    });
  }

  const repairBtn = document.getElementById("btn-repair");
  if (repairBtn) {
    repairBtn.addEventListener("click", () => {
      pushUndo("repair");
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
      pushUndo("harvest-all");
      const count = harvestAllReady();
      if (count === 0) return showToast("Geen rijpe gewassen");
      showToast(`Geoogst: ${count}`);
      microShake();
      renderAll();
      scheduleSaveState();
    });
  }
  const collectAllBtn = document.getElementById("btn-collect-all");
  if (collectAllBtn) {
    collectAllBtn.addEventListener("click", () => {
      pushUndo("collect-all");
      const count = collectAllReady();
      if (count === 0) return showToast("Niets om te verzamelen");
      showToast(`Verzameld: ${count}`);
      microShake();
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

  const helpBtn = document.getElementById("btn-open-help");
  if (helpBtn) {
    helpBtn.addEventListener("click", () => {
      openHelp();
    });
  }

  const eatBtn = document.getElementById("btn-eat-meal");
  if (eatBtn) {
    eatBtn.addEventListener("click", () => {
      pushUndo("eat-meal");
      if (!state) return;
      const have = state.inventory.meal || 0;
      if (have <= 0) {
        showToast("Geen maaltijd in inventaris");
        return;
      }
      state.inventory.meal = have - 1;
      const before = state.energy;
      state.energy = Math.min(state.maxEnergy, state.energy + 40);
      addXp(5);
      const gained = Math.round(state.energy - before);
      showToast(`Energie hersteld (+${gained})`);
      spawnFloatingText(`+${gained} ⚡  +5 XP`, "#a5d6a7");
      renderAll();
      scheduleSaveState();
    });
  }

  // Undo button
  const undoBtn = document.getElementById('btn-undo');
  if (undoBtn) {
    undoBtn.addEventListener('click', () => undoLast());
  }

  // Auto toggles
  let autoHarvestEnabled = false;
  let autoCollectEnabled = false;
  try {
    autoHarvestEnabled = localStorage.getItem("bhf_auto_harvest") === "1";
    autoCollectEnabled = localStorage.getItem("bhf_auto_collect") === "1";
  } catch {}
  const autoHarvestBtn = document.getElementById("btn-auto-harvest");
  const autoCollectBtn = document.getElementById("btn-auto-collect");
  function updateAutoBtns() {
    if (autoHarvestBtn) autoHarvestBtn.textContent = `🤖 Auto Oogst: ${autoHarvestEnabled ? 'Aan' : 'Uit'}`;
    if (autoCollectBtn) autoCollectBtn.textContent = `🤖 Auto Verzamelen: ${autoCollectEnabled ? 'Aan' : 'Uit'}`;
  }
  updateAutoBtns();
  if (autoHarvestBtn) {
    autoHarvestBtn.addEventListener("click", () => {
      autoHarvestEnabled = !autoHarvestEnabled;
      try { localStorage.setItem("bhf_auto_harvest", autoHarvestEnabled ? "1" : "0"); } catch {}
      updateAutoBtns();
    });
  }
  if (autoCollectBtn) {
    autoCollectBtn.addEventListener("click", () => {
      autoCollectEnabled = !autoCollectEnabled;
      try { localStorage.setItem("bhf_auto_collect", autoCollectEnabled ? "1" : "0"); } catch {}
      updateAutoBtns();
    });
  }

  // Expose for autoActions
  window.__bhf_autoHarvestEnabled = () => autoHarvestEnabled;
  window.__bhf_autoCollectEnabled = () => autoCollectEnabled;

  // Reduced motion accessibility toggle
  let reducedMotion = false;
  try { reducedMotion = localStorage.getItem('bhf_reduced_motion') === '1'; } catch {}
  const reducedBtn = document.getElementById('btn-reduced-motion');
  function applyReducedMotion() {
    document.body.classList.toggle('reduced-motion', reducedMotion);
    if (reducedBtn) reducedBtn.textContent = `🌀 Animaties: ${reducedMotion ? 'Uit' : 'Aan'}`;
  }
  applyReducedMotion();
  if (reducedBtn) {
    reducedBtn.addEventListener('click', () => {
      reducedMotion = !reducedMotion;
      try { localStorage.setItem('bhf_reduced_motion', reducedMotion ? '1' : '0'); } catch {}
      applyReducedMotion();
    });
  }
  window.__bhf_reducedMotion = () => reducedMotion;
  // High contrast toggle
  let highContrast = false;
  try { highContrast = localStorage.getItem('bhf_high_contrast') === '1'; } catch {}
  const contrastBtn = document.getElementById('btn-high-contrast');
  function applyContrast() {
    document.body.classList.toggle('high-contrast', highContrast);
    if (contrastBtn) contrastBtn.textContent = `🌓 Contrast: ${highContrast ? 'Aan' : 'Uit'}`;
  }
  applyContrast();
  if (contrastBtn) {
    contrastBtn.addEventListener('click', () => {
      highContrast = !highContrast;
      try { localStorage.setItem('bhf_high_contrast', highContrast ? '1' : '0'); } catch {}
      applyContrast();
    });
  }
  window.__bhf_highContrast = () => highContrast;

  // Coordinates overlay toggle (persisted in state.settings)
  const coordsBtn = document.getElementById('btn-toggle-coords');
  function updateCoordsBtn() {
    if (!coordsBtn) return;
    const on = !!(state && state.settings && state.settings.showCoords);
    coordsBtn.textContent = `📐 Coords: ${on ? 'Aan' : 'Uit'}`;
  }
  if (coordsBtn) {
    coordsBtn.addEventListener('click', () => {
      if (!state) return;
      if (!state.settings) state.settings = {};
      state.settings.showCoords = !state.settings.showCoords;
      try { localStorage.setItem('bhf_show_coords', state.settings.showCoords ? '1' : '0'); } catch {}
      // First-time tip when enabling
      if (state.settings.showCoords) {
        try {
          const tipSeen = localStorage.getItem('bhf_tip_coords_shown') === '1';
          if (!tipSeen) {
            showToast('Coördinaten zichtbaar. Gebruik pijltjestoetsen om tegels te navigeren.');
            localStorage.setItem('bhf_tip_coords_shown', '1');
          }
        } catch {}
      }
      updateCoordsBtn();
      renderAll();
      scheduleSaveState();
    });
  }
  window.__bhf_updateCoordsBtn = updateCoordsBtn;
}

function createGrid() {
  farmGridEl.innerHTML = "";
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const tileEl = document.createElement("div");
      tileEl.classList.add("tile", "tile-empty");
      tileEl.tabIndex = 0; // keyboard focusable
      tileEl.dataset.x = x;
      tileEl.dataset.y = y;
      tileEl.addEventListener("click", () => onTileClick(x, y));
      tileEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTileClick(x, y);
        }
        let nx = x, ny = y;
        if (e.key === 'ArrowRight') nx = Math.min(GRID_SIZE - 1, x + 1);
        else if (e.key === 'ArrowLeft') nx = Math.max(0, x - 1);
        else if (e.key === 'ArrowDown') ny = Math.min(GRID_SIZE - 1, y + 1);
        else if (e.key === 'ArrowUp') ny = Math.max(0, y - 1);
        if (nx !== x || ny !== y) {
          const idx = ny * GRID_SIZE + nx;
          const nextEl = farmGridEl.children[idx];
          if (nextEl && nextEl.focus) nextEl.focus();
        }
      });
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
          plowed: false,
          fertilizedBonus: false
        };
      }
      if (typeof s.tiles[y][x].plowed !== "boolean") s.tiles[y][x].plowed = false;
      if (typeof s.tiles[y][x].fertilizedBonus !== "boolean") s.tiles[y][x].fertilizedBonus = false;
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

  // Stats tracking
  if (!s.stats || typeof s.stats !== "object") s.stats = {};
  const zero = (k) => { if (typeof s.stats[k] !== "number") s.stats[k] = 0; };
  [
    "cropsPlanted",
    "cropsHarvested",
    "productsCollected",
    "buildingsConstructed",
    "productsProcessed",
    "moneyEarned"
  ].forEach(zero);

  // Versioning and idle tracking
  if (typeof s.version !== "number") s.version = 1;
  if (typeof s.lastActiveTs !== "number") s.lastActiveTs = Date.now();

  // UI Settings
  if (!s.settings || typeof s.settings !== "object") s.settings = {};
  if (typeof s.settings.showCoords !== "boolean") s.settings.showCoords = false;

  return s;
}

function getLevelInfo(xp) {
  // Piecewise-smooth progression: gentle early, steeper mid-game
  let level = 1;
  let currentLevelXp = 0;
  let nextLevelXp = 120; // base for level 2
  while (xp >= nextLevelXp) {
    level++;
    currentLevelXp = nextLevelXp;
    const mul = level < 6 ? 1.22 : level < 12 ? 1.26 : 1.32;
    nextLevelXp = Math.round(nextLevelXp * mul + 10);
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
    const data = await api(`/api/state?profile=${encodeURIComponent(currentProfile)}`);
    state = ensureStateShape(data);
    // Prefer local UI preference for coords if present
    try {
      const lc = localStorage.getItem('bhf_show_coords');
      if (lc === '1' || lc === '0') {
        if (!state.settings) state.settings = {};
        state.settings.showCoords = (lc === '1');
      }
    } catch {}
    applyIdleEarnings();
    try { if (window.__bhf_updateCoordsBtn) window.__bhf_updateCoordsBtn(); } catch {}
    renderAll();
  } catch (err) {
    console.error("Fout bij laden state:", err);
    state = ensureStateShape({
      money: 500,
      xp: 0,
      tiles: [],
      quests: []
    });
    applyIdleEarnings();
    try { if (window.__bhf_updateCoordsBtn) window.__bhf_updateCoordsBtn(); } catch {}
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
    // Update last active timestamp so idle earnings window is accurate
    if (state) state.lastActiveTs = Date.now();
    await api(`/api/state?profile=${encodeURIComponent(currentProfile)}` , {
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

// ======= IDLE EARNINGS =======
function countBuildings() {
  let n = 0;
  forEachTile((tile) => { if (tile.building) n++; });
  return n;
}

function applyIdleEarnings() {
  try {
    if (!state) return;
    const now = Date.now();
    const last = state.lastActiveTs || now;
    const dtMs = Math.max(0, now - last);
    const minutes = dtMs / 60000;
    if (minutes < 1) { state.lastActiveTs = now; return; }
    const { level } = getLevelInfo(state.xp || 0);
    const buildings = countBuildings();
    // Base per-minute income influenced by buildings and level; conservative cap
    const perMin = buildings * 0.6 + level * 0.25; // coins/min
    let gain = Math.floor(perMin * minutes);
    gain = Math.max(0, Math.min(gain, 600)); // cap max idle gain per session
    if (gain > 0) {
      state.money += gain;
      if (state.stats) state.stats.moneyEarned = (state.stats.moneyEarned || 0) + gain;
      showToast(`💤 Idle beloning: +${fmt(gain)} munten`);
      spawnFloatingText(`+${fmt(gain)} 💰`, "#ffe082");
      state.lastActiveTs = now;
      scheduleSaveState();
    }
  } catch {}
}

// ======= TILE INTERACTION =======

function onTileClick(x, y) {
  if (!state) return;
  pushUndo("tile-action");
  const tile = state.tiles[y][x];
  const idx = y * GRID_SIZE + x;
  const el = farmGridEl.children[idx];
  if (el && el.getBoundingClientRect) {
    lastFxRect = el.getBoundingClientRect();
    // Click ripple feedback
    spawnTileRipple(el);
  }

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
  if (crop.seasons && !crop.seasons.includes(state.season)) {
    return showToast("Niet het juiste seizoen voor dit gewas");
  }
  if (tile.building || tile.crop) return showToast("Tegel bezet");
  if (!tile.plowed) return showToast("Eerst ploegen (toets P)");
  if (state.money < crop.seedCost) return showToast("Onvoldoende munten");
  if (!spendEnergy(1)) return;

  state.money -= crop.seedCost;
  tile.crop = cropId;
  tile.cropPlantedAt = Date.now();

  addXp(crop.xpPlant);
  if (state.stats) state.stats.cropsPlanted = (state.stats.cropsPlanted || 0) + 1;
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
    spawnFloatingText(`+${crop.value} 💰`, "#ffd54f");
  addXp(crop.xpHarvest);
  state.inventory[crop.id] = (state.inventory[crop.id] || 0) + 1;
  if (tile.fertilizedBonus && canGainInventory(1)) {
    state.inventory[crop.id] += 1;
    spawnFloatingText("Bonus +1", "#b2ff59");
  }
  if (state.stats) {
    state.stats.cropsHarvested = (state.stats.cropsHarvested || 0) + 1;
    state.stats.moneyEarned = (state.stats.moneyEarned || 0) + (crop.value || 0);
  }

  updateQuestProgress("harvest_crop", { cropId: tile.crop });

  tile.crop = null;
  tile.cropPlantedAt = null;
  tile.plowed = false;
  tile.fertilizedBonus = false;
  spawnParticles("harvest", 8);
  microShake();
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
  if (state.stats) state.stats.buildingsConstructed = (state.stats.buildingsConstructed || 0) + 1;
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
    now - getEffectiveBuildingProductionMs(b.id);
  const elapsed = now - last;

  const needMs = getEffectiveBuildingProductionMs(b.id);
  if (elapsed < needMs) {
    return showToast("Nog in productie");
  }

  // Input requirement check (e.g., windmill wheat -> flour)
  if (b.requires) {
    for (const [rk, rv] of Object.entries(b.requires)) {
      if ((state.inventory[rk] || 0) < rv) {
        showToast(`Benodigd: ${rv}× ${rk}`);
        return;
      }
    }
    // Consume inputs
    for (const [rk, rv] of Object.entries(b.requires)) {
      state.inventory[rk] = (state.inventory[rk] || 0) - rv;
    }
  }

  state.money += b.productValue;
    spawnFloatingText(`+${b.productValue} 💰`, "#80deea");
  addXp(b.productXp);
  const key = productKeyForBuilding(b);
  if (!canGainInventory(1)) return showToast("Opslag vol");
  state.inventory[key] = (state.inventory[key] || 0) + 1;
  if (state.stats) {
    state.stats.productsCollected = (state.stats.productsCollected || 0) + 1;
    state.stats.moneyEarned = (state.stats.moneyEarned || 0) + (b.productValue || 0);
    if (b.requires) state.stats.productsProcessed = (state.stats.productsProcessed || 0) + 1;
  }

  tile.lastProductCollectedAt = now;
  spawnParticles("collect", 8);
  microShake();

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
  const jitter = (Math.random() - 0.5) * 20; // slight pitch variance
  const durMul = 1 + (Math.random() - 0.5) * 0.2;
  o.frequency.setValueAtTime(conf.f + jitter, now);
  g.gain.setValueAtTime(0.08, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + conf.t * durMul);
  o.connect(g).connect(audioCtx.destination);
  o.start();
  o.stop(now + conf.t * durMul);
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

/**
 * Main per-tick update pipeline; throttles heavy grid rendering, updates
 * dynamic systems (energy, market, seasons, weather) and applies visual state.
 */
function renderAll() {
  regenEnergy();
  updateMarket();
  updateSeasonsAndWeather();
  renderHud();
  renderToolbarLockState();
  // Throttle heavy grid DOM updates
  const nowTs = Date.now();
  if (nowTs - lastGridRenderTs >= GRID_RENDER_THROTTLE_MS) {
    renderGrid();
    lastGridRenderTs = nowTs;
  }
  renderQuests();
  renderInventory();
  renderStats();
  updateToolsIndicator();
  updateSellButtonIndicator();
  renderTimeOverlay();
  renderWeatherOverlay();
  applySeasonClass();
  adjustCropBobDuration();
  detectLevelUpBloom();
  autoActions();
}

/**
 * Execute automatic harvest / collect actions if toggles are enabled.
 * Uses helper readiness checks and short-circuits when both are disabled.
 */
function autoActions() {
  if (!state) return;
  const doHarvest = window.__bhf_autoHarvestEnabled && window.__bhf_autoHarvestEnabled();
  const doCollect = window.__bhf_autoCollectEnabled && window.__bhf_autoCollectEnabled();
  if (!doHarvest && !doCollect) return;
  const now = Date.now();
  forEachTile((tile) => {
    if (doHarvest && tileCropReady(tile, now)) harvestCrop(tile);
    if (doCollect && tileBuildingReady(tile, now)) collectFromBuilding(tile);
  });
}

function renderHud() {
  hudMoneyEl.textContent = fmt(state.money);

  const { level, currentLevelXp, nextLevelXp } = getLevelInfo(state.xp);
  hudLevelEl.textContent = level;
  hudXpEl.textContent = fmt(state.xp);
  hudXpNextEl.textContent = fmt(nextLevelXp);

  const range = nextLevelXp - currentLevelXp;
  const progress = state.xp - currentLevelXp;
  const percent = Math.max(0, Math.min(100, (progress / range) * 100));
  hudXpBarEl.style.width = `${percent}%`;
  // Store current level for bloom detection if not set
  if (!prevLevel) prevLevel = level;

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
  if (hudSeasonEl) {
    hudSeasonEl.textContent = state.season || "Zomer";
    const seasonMul = (SEASONS[state.seasonIndex] || SEASONS[1]).speed;
    hudSeasonEl.title = `Seizoen invloed: ×${seasonMul.toFixed(2)} groeisnelheid`;
  }
  if (hudWeatherEl) {
    hudWeatherEl.textContent = state.weather || "Helder";
    const wMul = weatherSpeedMultiplier();
    const note = state.weather === "Regen"
      ? "(snellere groei, minder watergebruik)"
      : state.weather === "Sneeuw"
      ? "(langzamere groei, tragere dierproductie)"
      : "";
    hudWeatherEl.title = `Weer invloed: ×${wMul.toFixed(2)} ${note}`;
  }
  // Market trend HUD
  if (hudMarketTrendEl && state.market && state.market.multipliers) {
    const vals = Object.values(state.market.multipliers).filter(v => typeof v === 'number' && isFinite(v));
    const avg = vals.length ? (vals.reduce((a,b)=>a+b,0) / vals.length) : 1.0;
    const arrow = avg > 1.03 ? '↑' : (avg < 0.97 ? '↓' : '→');
    hudMarketTrendEl.textContent = `${arrow} ×${avg.toFixed(2)}`;
    hudMarketTrendEl.title = `Gemiddelde markt: ×${avg.toFixed(2)}`;
    // Draw sparkline for recent market averages
    if (hudMarketSparkEl && typeof hudMarketSparkEl.getContext === 'function') {
      marketTrendHistory.push(avg);
      const w = hudMarketSparkEl.width || 80;
      const h = hudMarketSparkEl.height || 16;
      const maxPoints = Math.max(10, w);
      if (marketTrendHistory.length > maxPoints) {
        marketTrendHistory.splice(0, marketTrendHistory.length - maxPoints);
      }
      const ctx = hudMarketSparkEl.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, w, h);
        const minV = 0.7, maxV = 1.4;
        // Baseline at ×1.0 for readability
        const baselineY = h - ((1.0 - minV) / (maxV - minV)) * (h - 1);
        ctx.beginPath();
        ctx.moveTo(0, baselineY);
        ctx.lineTo(w, baselineY);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
        const n = marketTrendHistory.length;
        if (n > 1) {
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            const v = Math.max(minV, Math.min(maxV, marketTrendHistory[i]));
            const x = (i / (n - 1)) * (w - 1);
            const y = h - ((v - minV) / (maxV - minV)) * (h - 1);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = avg >= 1.0 ? '#2e7d32' : '#b71c1c';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }

  // Update action button tooltips to reflect weather effects
  const waterBtn = document.querySelector('.action-btn[data-action="water"]');
  if (waterBtn) {
    waterBtn.title = state.weather === "Regen"
      ? "Water geven: geen 💧 verbruik dankzij regen"
      : "Water geven: verbruikt 1× 💧";
  }
  const collectBtn = document.querySelector('.action-btn[data-action="collect"]');
  if (collectBtn) {
    collectBtn.title = state.weather === "Sneeuw"
      ? "Verzamelen: productie duurt langer bij sneeuw"
      : "Verzamelen: standaard productietijd";
  }
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
    const lockedByLevel = level < crop.minLevel;
    const inSeason = !crop.seasons || crop.seasons.includes(state.season);
    const lockedBySeason = !inSeason;
    const locked = lockedByLevel || lockedBySeason;
    btn.classList.toggle("locked", locked);
    const seasonsText = crop.seasons ? `Seizoen: ${crop.seasons.join("/")}` : "Altijd";
    if (lockedByLevel) {
      btn.title = `${crop.name} vergrendeld — level ${crop.minLevel}+ vereist (${seasonsText})`;
    } else if (lockedBySeason) {
      btn.title = `${crop.name} niet in seizoen — ${seasonsText}`;
    } else {
      btn.title = `${crop.emoji} ${crop.name} (kost ${crop.seedCost}) — ${seasonsText}`;
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
  const seasonMul = (SEASONS[state.seasonIndex] || SEASONS[1]).speed;
  const weatherMul = weatherSpeedMultiplier();
  const speedMul = seasonMul * weatherMul;

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
      const oldCoord = el.querySelector('.tile-coord');
      if (oldCoord) oldCoord.remove();
      const oldSprite = el.querySelector(".tile-sprite");
      if (oldSprite) oldSprite.remove();
      const oldAnimal = el.querySelector(".tile-animal");
      if (oldAnimal) oldAnimal.remove();
      const oldBlades = el.querySelector(".tile-overlay-blades");
      if (oldBlades) oldBlades.remove();
      const oldRipple = el.querySelector(".tile-overlay-ripple");
      if (oldRipple) oldRipple.remove();

      if (!tile.crop && !tile.building) {
        el.classList.add(tile.plowed ? "tile-plowed" : "tile-empty");
        if (state.settings && state.settings.showCoords) {
          const c = document.createElement('div');
          c.className = 'tile-coord';
          c.textContent = `${x},${y}`;
          el.appendChild(c);
        }
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
          el.title = `${crop.name}: klaar om te oogsten\nWaarde: ${crop.value} | XP: ${crop.xpHarvest}`;
        } else {
          el.classList.add("tile-crop-growing");
          const rem = Math.max(0, getEffectiveCropGrowMs(crop.id) - elapsed);
          const s = Math.ceil(rem / 1000);
          el.title = `${crop.name}: rijp over ${s}s\nSnelheid: ×${speedMul.toFixed(2)} (seizoen ×${seasonMul.toFixed(2)}, weer ×${weatherMul.toFixed(2)})`;
        }
        if (tile.fertilizedBonus) {
          const buff = document.createElement("div");
            buff.className = "tile-buff-icon";
            buff.textContent = "🧪";
            el.appendChild(buff);
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
          now - getEffectiveBuildingProductionMs(b.id);
        const elapsed = now - last;

        if (elapsed >= getEffectiveBuildingProductionMs(b.id)) {
          const ind = document.createElement("div");
          ind.classList.add("tile-indicator");
          ind.textContent = "✔";
          el.appendChild(ind);
          // Check input requirements (e.g., windmill needs wheat)
          let reqOk = true;
          if (b.requires) {
            for (const [rk, rv] of Object.entries(b.requires)) {
              if ((state.inventory[rk] || 0) < rv) { reqOk = false; break; }
            }
          }
          if (reqOk) {
            el.title = `${b.name}: ${b.productName} klaar om te verzamelen\nWaarde: ${b.productValue} | XP: ${b.productXp}`;
            el.classList.add("tile-building-ready");
          } else {
            el.title = `${b.name}: wacht op input (${Object.entries(b.requires).map(([rk,rv])=>`${rv}× ${rk}`).join(', ')})`;
            ind.textContent = "…"; // show waiting indicator instead of checkmark
          }
        } else {
          const need = getEffectiveBuildingProductionMs(b.id);
          const rem = Math.max(0, need - elapsed);
          const s = Math.ceil(rem / 1000);
          const bMul = state.weather === "Sneeuw" ? 1.3 : 1.0;
          el.title = `${b.name}: ${b.productName} klaar over ${s}s\nProductie: ×${bMul.toFixed(2)} (weer)`;
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
      // Add coord label for non-empty tiles if enabled
      if (state.settings && state.settings.showCoords) {
        const c = document.createElement('div');
        c.className = 'tile-coord';
        c.textContent = `${x},${y}`;
        el.appendChild(c);
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
      const sprite = document.createElement("div");
      sprite.className = `tile-sprite tile-sprite-crop ${isReady ? 'tile-sprite-crop-mature' : 'tile-sprite-crop-growing'}`;
      sprite.style.backgroundImage = `url(${path})`;
      el.appendChild(sprite);
      return true;
    }
    if (kind === "building") {
      const path = SPRITES.building[id];
      if (!path) return false;
      const sprite = document.createElement("div");
      sprite.className = "tile-sprite tile-sprite-building";
      sprite.style.backgroundImage = `url(${path})`;
      el.appendChild(sprite);
      return true;
    }
  } catch {}
  return false;
}

// ======= PARTICLES =======
/**
 * Spawn decorative particle effects with seasonal & weather palette mixing.
 * Rate limited (<=64 particles per 800ms window) and disabled under reduced motion.
 * @param {string} kind Semantic effect type (e.g. 'harvest','collect').
 * @param {number} count Desired particle count.
 */
function spawnParticles(kind, count) {
  if (window.__bhf_reducedMotion && window.__bhf_reducedMotion()) return;
  // Rate cap window
  const now = Date.now();
  if (!spawnParticles._windowStart || now - spawnParticles._windowStart > 800) {
    spawnParticles._windowStart = now;
    spawnParticles._emitted = 0;
  }
  if (spawnParticles._emitted && spawnParticles._emitted > 64) return; // cap
  const rect = lastFxRect || (farmGridEl && farmGridEl.getBoundingClientRect && farmGridEl.getBoundingClientRect());
  if (!rect) return;
  const season = state.season || "Zomer";
  const weather = state.weather || "Helder";
  const palettes = {
    harvest: ["#ffd54f", "#ffe082", "#ffca28"],
    collect: ["#80deea", "#4dd0e1", "#26c6da"],
    winter: ["#bbdefb", "#e3f2fd", "#90caf9"],
    autumn: ["#ffb74d", "#ffa726", "#ffcc80"],
    spring: ["#aed581", "#9ccc65", "#dce775"],
    storm: ["#eceff1", "#cfd8dc", "#b0bec5"],
    rain: ["#64b5f6", "#42a5f5", "#90caf9"],
    snow: ["#ffffff", "#e0f7fa", "#fffde7"]
  };
  const seasonKey = season === "Herfst" ? "autumn" : season === "Winter" ? "winter" : season === "Lente" ? "spring" : null;
  const weatherKey = weather === "Regen" ? "rain" : weather === "Storm" ? "storm" : weather === "Sneeuw" ? "snow" : null;
  const base = palettes[kind] || ["#ffd54f", "#80deea"];
  const mix = [...base, ...(seasonKey ? palettes[seasonKey] : []), ...(weatherKey ? palettes[weatherKey] : [])];
  for (let i = 0; i < count; i++) {
    if (spawnParticles._emitted > 64) break;
    const p = document.createElement("div");
    p.style.position = "fixed";
    p.style.left = `${rect.left + rect.width / 2}px`;
    p.style.top = `${rect.top + rect.height / 2}px`;
    p.style.width = "6px";
    p.style.height = "6px";
    let shape = "circle";
    if (seasonKey === "autumn") shape = "square";
    if (weatherKey === "storm") shape = "diamond";
    if (shape === "circle") p.style.borderRadius = "50%";
    if (shape === "square") p.style.borderRadius = "2px";
    if (shape === "diamond") { p.style.borderRadius = "2px"; p.style.transform = "rotate(45deg)"; }
    p.style.pointerEvents = "none";
    p.style.zIndex = 999;
    p.style.background = mix[Math.floor(Math.random() * mix.length)] || (kind === "harvest" ? "#ffd54f" : "#80deea");
    p.style.boxShadow = "0 0 4px rgba(0,0,0,0.2)";
    p.style.opacity = "0.9";
    const dx = (Math.random() - 0.5) * 60;
    const dy = (Math.random() - 0.5) * 60;
    const dur = 500 + Math.random() * 300;
    const anim = p.animate([
      { transform: "translate(0,0)", opacity: 0.9 },
      { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 }
    ], { duration: dur, easing: "ease-out" });
    document.body.appendChild(p);
    anim.onfinish = () => p.remove();
    spawnParticles._emitted++;
  }
}

// ======= TILE RIPPLE =======
function spawnTileRipple(el) {
  try {
    const r = document.createElement("div");
    r.className = "tile-click-ripple";
    el.appendChild(r);
    r.addEventListener("animationend", () => r.remove(), { once: true });
  } catch {}
}

// ======= SHORTCUTS =======
function setupShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Undo (Ctrl+Z)
    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undoLast();
      return;
    }
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

    // Help: F1 or ?
    if (e.key === "F1" || e.key === "?") {
      e.preventDefault();
      toggleHelp();
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
        spawnBloom();
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
    const mult = (state.market && state.market.multipliers && state.market.multipliers[e.k]) || 1.0;
    const unitTxt = unit > 0 ? fmt(unit) : "-";
    row.title = unit > 0 ? `Waarde per stuk: ${unitTxt} (markt ×${mult.toFixed(2)})` : "Niet te verkopen";
    const left = document.createElement("span");
    left.textContent = `${e.icon} ${e.label}`;
    const right = document.createElement("span");
    const total = unit * e.v;
    right.textContent = unit > 0 ? `${fmt(e.v)} (= ${fmt(total)})` : fmt(e.v);
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
        const ok = window.confirm(`Verkoop ${fmt(amount)} × ${e.label} voor ${fmt(gain)} munten?`);
        if (!ok) return;
        state.inventory[e.k] = 0;
        state.money += gain;
        showToast(`Verkocht ${fmt(amount)} × ${e.label} voor ${fmt(gain)} 💰`);
        renderAll();
        scheduleSaveState();
      });
      row.appendChild(btn);
    }
    // Market trend coloring
    if (mult > 1.05) {
      row.style.borderColor = '#7cb342';
    } else if (mult < 0.95) {
      row.style.borderColor = '#d77';
    }
    inventoryListEl.appendChild(row);
  });
}

function renderStats() {
  if (!statsListEl || !state) return;
  const s = state.stats || {};
  statsListEl.innerHTML = "";
  const rows = [
    ["🌱 Gezaaid", s.cropsPlanted || 0],
    ["🌾 Geoogst", s.cropsHarvested || 0],
    ["📦 Verzameld", s.productsCollected || 0],
    ["⚙️ Verwerkt", s.productsProcessed || 0],
    ["🏗️ Gebouwd", s.buildingsConstructed || 0],
    ["💰 Verdiend", s.moneyEarned || 0]
  ];
  rows.forEach(([label, value]) => {
    const row = document.createElement('div');
    row.className = 'inv-row';
    const left = document.createElement('span'); left.textContent = label;
    const right = document.createElement('span'); right.textContent = fmt(value);
    row.appendChild(left); row.appendChild(right);
    statsListEl.appendChild(row);
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

// Floating text feedback near last clicked tile (or grid center)
function spawnFloatingText(text, color = "#fff") {
  try {
    const rect = lastFxRect || (farmGridEl && farmGridEl.getBoundingClientRect && farmGridEl.getBoundingClientRect());
    if (!rect) return;
    const el = document.createElement("div");
    el.textContent = text;
    el.style.position = "fixed";
    el.style.left = `${rect.left + rect.width / 2}px`;
    el.style.top = `${rect.top + rect.height / 2}px`;
    el.style.transform = "translate(-50%, -50%)";
    el.style.color = color;
    el.style.fontWeight = "700";
    el.style.textShadow = "0 1px 2px rgba(0,0,0,0.5)";
    el.style.pointerEvents = "none";
    el.style.zIndex = 1000;
    document.body.appendChild(el);
    const anim = el.animate([
      { opacity: 1, transform: "translate(-50%, -50%) translateY(0)" },
      { opacity: 0, transform: "translate(-50%, -50%) translateY(-28px)" }
    ], { duration: 900, easing: "ease-out" });
    anim.onfinish = () => el.remove();
  } catch {}
}

// Micro shake of the farm wrapper for impactful actions
function microShake() {
  if (window.__bhf_reducedMotion && window.__bhf_reducedMotion()) return; // skip shake
  const wrap = document.getElementById("farm-wrapper");
  if (!wrap) return;
  wrap.classList.remove("shake");
  // force reflow to restart animation
  void wrap.offsetWidth;
  wrap.classList.add("shake");
  setTimeout(() => wrap.classList.remove("shake"), 180);
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

// ======= UNDO STACK =======
function deepClone(obj) {
  try { if (window.structuredClone) return structuredClone(obj); } catch {}
  try { return JSON.parse(JSON.stringify(obj)); } catch { return null; }
}

function pushUndo(reason = "") {
  if (!state) return;
  const snap = deepClone(state);
  if (!snap) return;
  undoStack.push({ state: snap, reason: String(reason || "") });
  if (undoStack.length > 20) undoStack.shift();
}

function undoLast() {
  if (undoStack.length === 0) { showToast("Niets om ongedaan te maken"); return; }
  const entry = undoStack.pop();
  state = ensureStateShape(entry.state);
  showToast("Actie ongedaan gemaakt");
  renderAll();
  scheduleSaveState();
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
  forEachTile((tile) => {
    if (tileCropReady(tile, now)) {
      harvestCrop(tile);
      count++;
    }
  });
  return count;
}

function collectAllReady() {
  let count = 0;
  const now = Date.now();
  forEachTile((tile) => {
    if (tileBuildingReady(tile, now)) {
      collectFromBuilding(tile);
      count++;
    }
  });
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
  const raining = state.weather === "Regen";
  if (!raining && (state.inventory.water || 0) <= 0) return showToast("Geen water in voorraad");
  if (!spendEnergy(1)) return;
  const now = Date.now();
  const plantedAt = tile.cropPlantedAt || now;
  const elapsed = now - plantedAt;
  const remaining = Math.max(0, crop.growTimeMs - elapsed);
  if (remaining <= 0) return showToast("Al klaar om te oogsten");
  const delta = Math.min(30_000, remaining);
  tile.cropPlantedAt = plantedAt - delta; // versnellen
  if (!raining) {
    state.inventory.water = Math.max(0, (state.inventory.water || 0) - 1);
  }
  state.tools.wateringCan = Math.max(0, (state.tools.wateringCan || 0) - 1);
  showToast(raining ? "Gewas bewaterd (regen — geen verbruik)" : "Gewas bewaterd (-1 💧)");
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
  tile.fertilizedBonus = true; // grant a bonus yield on harvest
  showToast("Gewas bemest: snellere groei + bonusopbrengst (-1 🧪)");
}

// Energy / inventory / market / time helpers
function regenEnergy() {
  const now = Date.now();
  const dt = Math.max(0, now - (state.lastEnergyTs || now));
  const regenPerMs = 1 / 4000; // slightly faster regen: 1 energy per 4s
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
  if (now - state.market.lastUpdateTs < 45_000) return; // update a bit more frequently
  const keys = new Set([
    ...Object.keys(CROPS),
    "eggs","milk","grain_pack","flour","water","meal","toolkit"
  ]);
  keys.forEach((k) => {
    const cur = state.market.multipliers[k] || 1.0;
    const delta = (Math.random() * 0.12) - 0.06; // slightly wider range
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
  // Stars overlay follows night strength
  const stars = document.getElementById("stars-overlay");
  if (stars) stars.style.opacity = (nightStrength * 0.6).toFixed(2);
  // Horizon brightness shift (subtle day/night tint)
  const hb = document.getElementById('horizon-back');
  const hf = document.getElementById('horizon-front');
  if (hb) hb.style.filter = `brightness(${0.85 + nightStrength * 0.15})`;
  if (hf) hf.style.filter = `brightness(${0.9 + nightStrength * 0.1})`;
}

// ======= Season visual helpers =======
function applySeasonClass() {
  const wrap = document.getElementById('farm-wrapper');
  if (!wrap) return;
  wrap.classList.remove('season-spring','season-summer','season-autumn','season-winter');
  const map = { 'Lente':'season-spring','Zomer':'season-summer','Herfst':'season-autumn','Winter':'season-winter' };
  wrap.classList.add(map[state.season] || 'season-summer');
}

function adjustCropBobDuration() {
  const wrap = document.getElementById('farm-wrapper');
  if (!wrap) return;
  let dur = 2.2;
  if (state.weather === 'Storm') dur = 1.6;
  else if (state.weather === 'Regen') dur = 2.0;
  else if (state.weather === 'Sneeuw') dur = 2.8;
  wrap.style.setProperty('--crop-bob-duration', `${dur}s`);
}

function detectLevelUpBloom() {
  const { level } = getLevelInfo(state.xp);
  if (level > prevLevel) {
    showToast(`🎉 Level omhoog! Niveau ${level}`);
    spawnBloom();
    prevLevel = level;
  }
}

function spawnBloom() {
  if (window.__bhf_reducedMotion && window.__bhf_reducedMotion()) return;
  const el = document.createElement('div');
  el.className = 'bloom-effect';
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
  showToast('✨ Visueel effect');
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

function getEffectiveBuildingProductionMs(buildingId) {
  const b = BUILDINGS[buildingId];
  if (!b) return 0;
  let mul = 1.0;
  if (state.weather === "Sneeuw") mul *= 1.3; // trager bij sneeuw
  return Math.max(1000, Math.round(b.productionTimeMs * mul));
}

function renderWeatherOverlay() {
  if (!weatherOverlayEl) return;
  weatherOverlayEl.innerHTML = "";
  let cls = null;
  if (state.weather === "Regen") cls = "weather-rain";
  if (state.weather === "Sneeuw") cls = "weather-snow";
  if (state.weather === "Storm") cls = "weather-storm";
  if (cls) {
    const layer = document.createElement("div");
    layer.className = cls;
    weatherOverlayEl.appendChild(layer);
    if (cls === "weather-storm") {
      const flash = document.createElement("div");
      flash.className = "storm-flash";
      weatherOverlayEl.appendChild(flash);
    }
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
  const mults = (state.market && state.market.multipliers) || {};
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
    // Helpful price breakdown tooltip
    let tip = "";
    if (it.id === "water10") {
      const base = BUILDINGS.water_well.productValue;
      const m = mults.water || 1.0;
      tip = `Prijs ≈ (basis ${base} × markt ×3) ×10; markt ×${m.toFixed(2)}`;
    } else if (it.id === "tool1") {
      const base = BUILDINGS.storage_shed.productValue;
      const m = mults.toolkit || 1.0;
      tip = `Prijs ≈ basis ${base} × markt ×1.2; markt ×${m.toFixed(2)}`;
    } else if (it.id === "fert5") {
      tip = "Vaste prijs; versnelt groei met bemesten";
    } else if (it.id === "cap20") {
      tip = "Vergroot opslagcapaciteit met 20";
    }
    row.title = tip || "";
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

// ======= HELP =======
function openHelp() {
  const modal = document.getElementById("help-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.querySelectorAll('[data-close="help"]').forEach((el) => {
    el.addEventListener("click", closeHelp, { once: true });
  });
}

function closeHelp() {
  const modal = document.getElementById("help-modal");
  if (modal) modal.classList.add("hidden");
}

function toggleHelp() {
  const modal = document.getElementById("help-modal");
  if (!modal) return;
  if (modal.classList.contains("hidden")) openHelp(); else closeHelp();
}

