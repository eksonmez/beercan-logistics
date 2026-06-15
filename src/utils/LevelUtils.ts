import {
  MAP_WIDTH, MAP_HEIGHT,
  MAP_GROWTH_WIDTH_STEP, MAP_GROWTH_HEIGHT_STEP,
  FLOOR_PALETTE_THRESHOLDS,
  OBSTACLE_UNLOCK_LEVEL, OBSTACLE_BASE_COUNT,
  FRAGILE_UNLOCK_LEVEL, FRAGILE_BOX_TTL_BASE, FRAGILE_BOX_TTL_MIN,
  CONVEYOR_UNLOCK_LEVEL, SLIPPERY_UNLOCK_LEVEL,
} from './Constants';

export function getMapSize(level: number): { width: number; height: number } {
  return {
    width:  MAP_WIDTH  + Math.floor(level / MAP_GROWTH_WIDTH_STEP),
    height: MAP_HEIGHT + Math.floor(level / MAP_GROWTH_HEIGHT_STEP),
  };
}

export function getFloorPaletteIndex(level: number): number {
  let idx = 0;
  for (let i = 0; i < FLOOR_PALETTE_THRESHOLDS.length; i++) {
    if (level >= FLOOR_PALETTE_THRESHOLDS[i]) idx = i;
  }
  return idx;
}

export function getObstacleCount(level: number): number {
  if (level < OBSTACLE_UNLOCK_LEVEL) return 0;
  return OBSTACLE_BASE_COUNT + Math.floor((level - OBSTACLE_UNLOCK_LEVEL) / 5);
}

export function getFragileRatio(level: number): number {
  if (level < FRAGILE_UNLOCK_LEVEL) return 0;
  return Math.min(0.3 + (level - FRAGILE_UNLOCK_LEVEL) * 0.01, 0.6);
}

export function getFragileTTL(level: number): number {
  if (level < FRAGILE_UNLOCK_LEVEL) return 0;
  return Math.max(FRAGILE_BOX_TTL_BASE - (level - FRAGILE_UNLOCK_LEVEL) * 0.5, FRAGILE_BOX_TTL_MIN);
}

export function hasConveyor(level: number): boolean {
  return level >= CONVEYOR_UNLOCK_LEVEL;
}

export function hasSlippery(level: number): boolean {
  return level >= SLIPPERY_UNLOCK_LEVEL;
}

/** Level'da ilk kez açılan mekaniklerin Türkçe adlarını döner. */
export function getNewMechanicsForLevel(level: number): string[] {
  const map: Record<number, string> = {
    [OBSTACLE_UNLOCK_LEVEL]:  'Hareketli Engel!',
    [FRAGILE_UNLOCK_LEVEL]:   'Kırılgan Kutular!',
    [CONVEYOR_UNLOCK_LEVEL]:  'Konveyör Bant!',
    [SLIPPERY_UNLOCK_LEVEL]:  'Kaygan Zemin!',
  };
  return map[level] ? [map[level]] : [];
}
