// src/gameState.js
export class GameState {
  constructor() {
    this.width = 10;
    this.height = 6;
    this.money = 100;
    this.tiles = []; // matrix: [ { crop: Crop | null } ]

    this.load() || this.initNew();
  }

  initNew() {
    this.tiles = [];
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        row.push({ crop: null });
      }
      this.tiles.push(row);
    }
  }

  save() {
    const data = {
      money: this.money,
      tiles: this.tiles.map(row =>
        row.map(t =>
          t.crop
            ? {
                ...t.crop.toJSON(),
              }
            : null
        )
      ),
    };
    localStorage.setItem("farm-save", JSON.stringify(data));
  }

  load() {
    const raw = localStorage.getItem("farm-save");
    if (!raw) return false;

    try {
      const data = JSON.parse(raw);
      this.money = data.money;
      this.tiles = data.tiles;
      return true;
    } catch {
      return false;
    }
  }
}
