// Heel eenvoudige boerderij-game in de browser
// (geen backend, geen localStorage, gewoon eerst laten werken)

console.log("game.js geladen");

// Constanten voor het grid en de gewassen
const GRID_WIDTH = 10;
const GRID_HEIGHT = 6;
const SEED_COST = 10;
const CROP_VALUE = 25;
const GROW_TIME_MS = 1000 * 30; // 30 seconden

// Game state
let state = {
  money: 100,
  tiles: [],
};

// Nieuwe state aanmaken
function initState() {
  state.money = 100;
  state.tiles = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const row = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      row.push({ crop: null }); // elk vak heeft 1 veld "crop"
    }
    state.tiles.push(row);
  }
}

// Helpers voor groei
function getProgress(crop, now = Date.now()) {
  const elapsed = now - crop.plantedAt;
  return Math.min(1, elapsed / GROW_TIME_MS);
}

function isReady(crop, now = Date.now()) {
  return getProgress(crop, now) >= 1;
}

// Acties
function plant(x, y) {
  const tile = state.tiles[y][x];
  if (!tile || tile.crop) return;
  if (state.money < SEED_COST) return;

  state.money -= SEED_COST;
  tile.crop = { plantedAt: Date.now() };
}

function harvest(x, y) {
  const tile = state.tiles[y][x];
  if (!tile || !tile.crop) return;
  if (!isReady(tile.crop)) return;

  state.money += CROP_VALUE;
  tile.crop = null;
}

// UI-elementen zoeken
const moneyEl = document.getElementById("money");
const gridEl = document.getElementById("farm-grid");
const actionButtons = document.querySelectorAll("[data-action]");

let currentAction = "plant";

actionButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentAction = btn.dataset.action;
  });
});

// Grid tekenen
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

// Start game
initState();
updateUI();

// Elke seconde vernieuwen zodat groei zichtbaar is
setInterval(updateUI, 1000);
