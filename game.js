// Eenvoudige boerderij-game in de browser
// Geen backend nodig; state wordt bewaard in localStorage.

const GRID_WIDTH = 10;
const GRID_HEIGHT = 6;
const SEED_COST = 10;
const CROP_VALUE = 25;
const GROW_TIME_MS = 1000 * 30; // 30 seconden tot oogstrijp

// --- State ---
let state = {
  money: 100,
  tiles: [], // 2D array [y][x] -> { crop: { plantedAt } | null }
};

function initNewState() {
  state.money = 100;
  state.tiles = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const row = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      row.push({ crop: null });
    }
    state.tiles.push(row);
  }
}

function saveState() {
  localStorage.setItem("bigharvest-state", JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem("bigharvest-state");
  if (!raw) {
    initNewState();
    return;
  }
  try {
    const data = JSON.parse(raw);
    // heel simpel: vertrouwen dat structuur klopt
    state = data;
  } catch (e) {
    console.warn("Kon savegame niet laden, nieuwe state:", e);
    initNewState();
  }
}

// --- Crop helpers ---
function getProgress(crop, now = Date.now()) {
  const elapsed = now - crop.plantedAt;
  return Math.min(1, elapsed / GROW_TIME_MS);
}

function isReady(crop, now = Date.now()) {
  return getProgress(crop, now) >= 1;
}

// --- Game actions ---
function plant(x, y) {
  const tile = state.tiles[y][x];
  if (!tile || tile.crop) return;
  if (state.money < SEED_COST) return;

  state.money -= SEED_COST;
  tile.crop = {
    plantedAt: Date.now(),
  };
}

function harvest(x, y) {
  const tile = state.tiles[y][x];
  if (!tile || !tile.crop) return;

  if (!isReady(tile.crop)) return;

  state.money += CROP_VALUE;
  tile.crop = null;
}

// --- UI ---
const moneyEl = document.getElementById("money");
const gridEl = document.getElementById("farm-grid");
const actionButtons = document.querySelectorAll("[data-action]");

let currentAction = "plant";

actionButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentAction = btn.dataset.action;
  });
});

function renderGrid() {
  gridEl.innerHTML = "";
  const now = Date.now();

  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const tile = state.tiles[y][x];
      const div = document.createElement("div");
      div.classList.add("tile");

      if (!tile.crop) {
        div.classList.add("empty");
      } else {
        const progress = getProgress(tile.crop, now);
        if (isReady(tile.crop, now)) {
          div.classList.add("ready");
          div.textContent = "✅";
        } else {
          div.classList.add("growing");
          div.textContent = progress < 0.5 ? "🌱" : "🌾";
        }
      }

      div.addEventListener("click", () => {
        if (currentAction === "plant") {
          plant(x, y);
        } else if (currentAction === "harvest") {
          harvest(x, y);
        }
        saveState();
        updateUI();
      });

      gridEl.appendChild(div);
    }
  }
}

function updateUI() {
  moneyEl.textContent = state.money;
  renderGrid();
}

// --- Init ---
loadState();
updateUI();

// Optioneel: elke seconde opnieuw renderen, zodat groei visueel wordt
setInterval(updateUI, 1000);
