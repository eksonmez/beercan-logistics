export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const TILE_DEPTH = 16;

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

/** Saniyede kaç tile hareket — sub-tile smooth için */
export const PLAYER_SPEED = 4.5;
export const PLAYER_CARRY_SPEED = 2.5;
export const FORKLIFT_SPEED = 7;

export const BASE_TIME = 120;
export const MIN_TIME = 45;
export const TIME_DECREASE_PER_LEVEL = 5;
export const BONUS_TIME = 10;
export const PENALTY_TIME = 5;

export const FORKLIFT_CAPACITY = 3;

export const MAP_WIDTH = 12;
export const MAP_HEIGHT = 10;

/** Floor tile'ları her zaman game object'lerin altında kalır. */
export const OBJECT_BASE_DEPTH = 100;

// Mechanic unlock levels
export const OBSTACLE_UNLOCK_LEVEL   = 5;
export const FRAGILE_UNLOCK_LEVEL    = 10;
export const CONVEYOR_UNLOCK_LEVEL   = 15;
export const SLIPPERY_UNLOCK_LEVEL   = 20;

// Obstacle
export const OBSTACLE_SLOW_DURATION  = 1500; // ms
export const OBSTACLE_BASE_COUNT     = 1;

// Fragile box
export const FRAGILE_BOX_TTL_BASE    = 25; // saniye
export const FRAGILE_BOX_TTL_MIN     = 10; // saniye

// Conveyor
export const CONVEYOR_SPEED          = 2.5; // tile/sn
export const CONVEYOR_TILE_RATIO     = 0.08;

// Slippery
export const SLIPPERY_TILE_RATIO     = 0.10;
export const SLIPPERY_FRICTION       = 0.85;

// Map growth
export const MAP_GROWTH_WIDTH_STEP   = 3;
export const MAP_GROWTH_HEIGHT_STEP  = 5;

// Floor palette level thresholds
export const FLOOR_PALETTE_THRESHOLDS = [1, 10, 20, 30, 50] as const;

export const BEER_COLORS = {
  lager:   0xf5c542,
  ale:     0xe07b39,
  stout:   0x8b5a2b,
  pilsner: 0x5db85d,
} as const;
