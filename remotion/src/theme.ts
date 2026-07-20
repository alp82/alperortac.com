// Shared palette + geometry for the Forge loop concepts.
// Emerald panel identity (matches projects.ts panelColor #065f46) with forge heat accents.

export const FPS = 30;
export const DURATION = 120; // 4s seamless loop
export const WIDTH = 1280;
export const HEIGHT = 720;

export const COLORS = {
  emeraldDeep: "#022c22", // near-black emerald backdrop
  emerald: "#065f46", // panel identity
  emeraldBright: "#10b981",
  emeraldGlow: "#34d399",
  ember: "#f97316", // forge orange
  emberHot: "#fb923c",
  white: "#fff7ed", // white-hot
  gold: "#fbbf24",
  ink: "#052e2b",
  parchment: "#e8f5ef",
};

// The seven Forge pipeline stages (from projects.ts extraSection).
export const STAGES = [
  "Intent",
  "Scout",
  "Blueprint",
  "Tests",
  "Build",
  "Review",
  "Ship",
] as const;

// Watermark shown on the panel identity.
export const WATERMARK = "FORGE · PIPELINE";
