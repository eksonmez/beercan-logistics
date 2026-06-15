/** İzometrik sahnede kullanılan 4 görünür yön. */
export type IsoDirection = 'ne' | 'se' | 'sw' | 'nw';

export const ISO_DIRECTIONS: IsoDirection[] = ['ne', 'se', 'sw', 'nw'];

/** Oyuncu animasyon key'leri — PreloadScene ile aynı isimlendirme. */
export const PlayerAnims = {
  idle: (dir: IsoDirection) => `player_idle_${dir}`,
  walk: (dir: IsoDirection) => `player_walk_${dir}`,
  carry: (dir: IsoDirection) => `player_carry_${dir}`,
} as const;

/** Forklift animasyon key'leri. */
export const ForkliftAnims = {
  idle: (dir: IsoDirection) => `forklift_idle_${dir}`,
  move: (dir: IsoDirection) => `forklift_move_${dir}`,
} as const;

/** Sprite sheet frame düzeni sabitleri. */
export const PLAYER_FRAME = { width: 32, height: 48, cols: 9 };
export const FORKLIFT_FRAME = { width: 72, height: 56, cols: 5 };

/** Oyuncu sheet'inde yön satırı × sütun ofseti. */
export function playerFrameIndex(isoDir: IsoDirection, col: number): number {
  const row = ISO_DIRECTIONS.indexOf(isoDir);
  return row * PLAYER_FRAME.cols + col;
}

/** Forklift sheet'inde yön satırı × sütun ofseti. */
export function forkliftFrameIndex(isoDir: IsoDirection, col: number): number {
  const row = ISO_DIRECTIONS.indexOf(isoDir);
  return row * FORKLIFT_FRAME.cols + col;
}
