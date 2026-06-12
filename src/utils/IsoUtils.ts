import { TILE_WIDTH, TILE_HEIGHT } from './Constants';

/** Grid (tile) koordinatını ekran piksel koordinatına çevirir. */
export function isoToScreen(tileX: number, tileY: number): { x: number; y: number } {
  return {
    x: (tileX - tileY) * (TILE_WIDTH / 2),
    y: (tileX + tileY) * (TILE_HEIGHT / 2),
  };
}

/** Ekran piksel koordinatını grid (tile) koordinatına çevirir. */
export function screenToIso(screenX: number, screenY: number): { x: number; y: number } {
  return {
    x: (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2,
    y: (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2,
  };
}

/** Nesnenin render derinliğini hesaplar (depth sorting için). */
export function calcDepth(tileX: number, tileY: number): number {
  return tileX + tileY;
}
