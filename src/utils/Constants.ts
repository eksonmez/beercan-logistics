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

export const BEER_COLORS = {
  lager:   0xf5c542,
  ale:     0xe07b39,
  stout:   0x8b5a2b,
  pilsner: 0x5db85d,
} as const;
