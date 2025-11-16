// src/main.js
import { GameState } from "./gameState.js";
import { Farm } from "./farm.js";
import { Crop } from "./crop.js";

const state = new GameState();

// Na load: crop-objecten reconstrueren
for (let y = 0; y < state.height; y++) {
  for (let x = 0; x < state.width; x++) {
    const tile = state.tiles[y][x];
    if (tile && tile.crop && !(tile.crop instanceof Crop)) {
      tile.crop = Crop.fromJSON(tile.crop);
    }
  }
}

const farm = new Farm(state);

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

  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const tile = state.tiles[y][x];
      const div = document.createElement("div");
      div.classList.add("tile");

      if (!tile.crop) {
        div.classList.add("empty");
      } else {
        const crop = tile.crop;
        const progress = crop.getProgress(now);

        if (crop.isReady(now)) {
          div.classList.add("ready");
          div.textContent = "✅";
        } else {
          div.classList.add("growing");
          // simpele visuele indicatie
          div.textContent = progress < 0.5 ? "🌱" : "🌾";
        }
      }

      div.addEventListener("click", () => {
        if (currentAction === "plant") {
          farm.plantCrop(x, y);
        } else if (currentAction === "harvest") {
          farm.harvestCrop(x, y);
        }

        state.save();
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

function gameLoop() {
  farm.tick();
  updateUI();
  requestAnimationFrame(gameLoop);
}

// Start
updateUI();
gameLoop();
