import { isoToScreen, calcDepth } from '../utils/IsoUtils';
import { MAP_WIDTH, MAP_HEIGHT } from '../utils/Constants';
import type { IsoPosition } from '../types';

/** İzometrik dünya: grid yönetimi ve koordinat dönüşümleri. */
export class IsoWorld {
  readonly mapWidth: number;
  readonly mapHeight: number;

  /** Harita origin'inin ekran offset'i (grid merkezi ekranda olsun diye). */
  readonly originX: number;
  readonly originY: number;

  private blockedTiles: Set<string> = new Set();

  constructor(screenWidth: number, screenHeight: number) {
    this.mapWidth = MAP_WIDTH;
    this.mapHeight = MAP_HEIGHT;
    this.originX = screenWidth / 2;
    this.originY = screenHeight / 4;
  }

  /** Tile koordinatını nihai ekran koordinatına çevirir (origin offset dahil). */
  tileToScreen(tileX: number, tileY: number): { x: number; y: number } {
    const pos = isoToScreen(tileX, tileY);
    return { x: pos.x + this.originX, y: pos.y + this.originY };
  }

  /** Tile'ın render depth değerini döner. */
  getDepth(tileX: number, tileY: number): number {
    return calcDepth(tileX, tileY);
  }

  /** Verilen pozisyon harita sınırları içinde mi? */
  isInBounds(pos: IsoPosition): boolean {
    return pos.tileX >= 0 && pos.tileX < this.mapWidth && pos.tileY >= 0 && pos.tileY < this.mapHeight;
  }

  /** Tile'ı geçilmez olarak işaretle (raf/duvar yerleşiminde çağrılır). */
  addBlockedTile(tx: number, ty: number): void {
    this.blockedTiles.add(`${Math.round(tx)},${Math.round(ty)}`);
  }

  /** Tile geçilmez mi? Player/Forklift hareketi bu kontrolü yapar. */
  isTileBlocked(tx: number, ty: number): boolean {
    return this.blockedTiles.has(`${tx},${ty}`);
  }
}
