// src/crop.js
export class Crop {
  constructor({ type, plantedAt, growTimeMs, value }) {
    this.type = type;        // bv. "wheat"
    this.plantedAt = plantedAt; // timestamp (Date.now())
    this.growTimeMs = growTimeMs;
    this.value = value;      // opbrengst in munten
  }

  // 0.0 – 1.0
  getProgress(now = Date.now()) {
    const elapsed = now - this.plantedAt;
    return Math.min(1, elapsed / this.growTimeMs);
  }

  isReady(now = Date.now()) {
    return this.getProgress(now) >= 1;
  }

  toJSON() {
    return {
      type: this.type,
      plantedAt: this.plantedAt,
      growTimeMs: this.growTimeMs,
      value: this.value,
    };
  }

  static fromJSON(json) {
    return new Crop(json);
  }
}
