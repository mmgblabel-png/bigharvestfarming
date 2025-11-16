// src/farm.js
import { Crop } from "./crop.js";

export class Farm {
  constructor(gameState) {
    this.state = gameState;
  }

  getTile(x, y) {
    if (
      x < 0 ||
      y < 0 ||
      x >= this.state.width ||
      y >= this.state.height
    ) {
      return null;
    }
    return this.state.tiles[y][x];
  }

  plantCrop(x, y) {
    const tile = this.getTile(x, y);
    if (!tile) return;
    if (tile.crop) return; // al bezet

    const seedCost = 10;
    if (this.state.money < seedCost) return;

    this.state.money -= seedCost;
    tile.crop = new Crop({
      type: "wheat",
      plantedAt: Date.now(),
      growTimeMs: 1000 * 30, // 30 seconden
      value: 25,
    });
  }

  harvestCrop(x, y) {
    const tile = this.getTile(x, y);
    if (!tile || !tile.crop) return;
    const now = Date.now();
    if (!tile.crop.isReady(now)) return;

    this.state.money += tile.crop.value;
    tile.crop = null;
  }

  tick() {
    // hier kun je later global logic doen (bv. quests, dieren, etc.)
  }
}
