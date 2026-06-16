import { TimerSystem } from './TimerSystem';
import {
  CONVEYOR_TILE_RATIO, SLIPPERY_TILE_RATIO,
} from '../utils/Constants';
import {
  getMapSize, getFloorPaletteIndex,
  getObstacleCount, getFragileRatio, getFragileTTL,
  hasConveyor, hasSlippery,
} from '../utils/LevelUtils';
import type { BeerType, LevelConfig, ShelfData, TileData, ObstacleData } from '../types';

const ALL_TYPES: BeerType[] = ['lager', 'ale', 'stout', 'pilsner'];

/** Prosedürel level verisi üretir. */
export class LevelGenerator {
  /** Level konfigürasyonunu hesaplar. */
  static buildConfig(level: number, bonusTime: number = 0): LevelConfig {
    const typeCount  = Math.min(2 + Math.floor(level / 3), 4);
    const boxCount   = 8 + level * 2;
    const timeLimit  = TimerSystem.calcTimeLimit(level, bonusTime);
    const beerTypes  = ALL_TYPES.slice(0, typeCount) as BeerType[];
    const { width: mapWidth, height: mapHeight } = getMapSize(level);

    const specialTiles = LevelGenerator._generateSpecialTiles(level, mapWidth, mapHeight);
    const obstacles    = LevelGenerator._generateObstacles(level, mapWidth, mapHeight, specialTiles);

    return {
      level,
      boxCount,
      beerTypes,
      timeLimit,
      mapWidth,
      mapHeight,
      obstacleCount:    getObstacleCount(level),
      fragileBoxRatio:  getFragileRatio(level),
      fragileBoxTTL:    getFragileTTL(level),
      hasConveyor:      hasConveyor(level),
      hasSlippery:      hasSlippery(level),
      floorPaletteIndex: getFloorPaletteIndex(level),
      specialTiles,
      obstacles,
    };
  }

  /** Raf pozisyonlarını ve konfigürasyonunu üretir. */
  static generateShelves(config: LevelConfig): ShelfData[] {
    const shelves: ShelfData[] = [];
    const typeCount = config.beerTypes.length;
    // Kutu üretimiyle aynı round-robin dağılımı: raf kapasitesi tipe göre değişebilir
    const capacityPerType = Array(typeCount).fill(0) as number[];
    for (let i = 0; i < config.boxCount; i++) capacityPerType[i % typeCount]++;

    const shelfX = config.mapWidth - 4;
    const usableRows = config.mapHeight - 2;
    const spacing = Math.max(1, Math.floor(usableRows / typeCount));

    config.beerTypes.forEach((type, i) => {
      shelves.push({
        id: `shelf_${type}`,
        tileX: shelfX,
        tileY: 1 + i * spacing,
        acceptedType: type,
        capacity: capacityPerType[i],
        currentCount: 0,
      });
    });

    return shelves;
  }

  /** Kutu başlangıç pozisyonlarını üretir. */
  static generateBoxPositions(config: LevelConfig): Array<{ tileX: number; tileY: number; type: BeerType }> {
    const positions: Array<{ tileX: number; tileY: number; type: BeerType }> = [];
    const used = new Set<string>();
    const ROWS      = config.mapHeight - 2;
    const MAX_COL_X = config.mapWidth - 5;

    const typeCount = config.beerTypes.length;
    const countPerType = Array(typeCount).fill(0) as number[];
    for (let i = 0; i < config.boxCount; i++) countPerType[i % typeCount]++;

    for (let ti = 0; ti < typeCount; ti++) {
      const type  = config.beerTypes[ti];
      const count = countPerType[ti];

      for (let j = 0; j < count; j++) {
        const colX = 2 + ti + Math.floor(j / ROWS) * typeCount;
        const tileY = 1 + (j % ROWS);

        if (colX <= MAX_COL_X) {
          const key = `${colX},${tileY}`;
          if (!used.has(key)) {
            used.add(key);
            positions.push({ tileX: colX, tileY, type });
            continue;
          }
        }

        // Fallback
        let fbKey: string;
        let tileX: number;
        let tries = 0;
        do {
          tileX = 1 + Math.floor(Math.random() * 4);
          const fbY = 1 + Math.floor(Math.random() * ROWS);
          fbKey = `${tileX},${fbY}`;
          tries++;
          if (tries > 200) break;
        } while (used.has(fbKey));
        used.add(fbKey);
        const [fbX, fbYn] = fbKey.split(',').map(Number);
        positions.push({ tileX: fbX, tileY: fbYn, type });
      }
    }

    return positions;
  }

  private static _generateSpecialTiles(level: number, mapWidth: number, mapHeight: number): TileData[] {
    const tiles: TileData[] = [];
    const used = new Set<string>();

    // Raf ve spawn alanını koruma bölgeleri
    const shelfZoneX = mapWidth - 5;
    const isSafe = (x: number, y: number) =>
      x >= 2 && x <= shelfZoneX - 1 && y >= 1 && y < mapHeight - 1;

    if (hasConveyor(level)) {
      const total = Math.max(3, Math.floor(mapWidth * mapHeight * CONVEYOR_TILE_RATIO));

      // Yatay konveyör grubu (sol-orta)
      const startY = Math.floor(mapHeight / 2);
      for (let i = 0; i < Math.ceil(total / 2); i++) {
        const tx = 2 + i;
        const ty = startY;
        const k  = `${tx},${ty}`;
        if (tx <= shelfZoneX - 2 && isSafe(tx, ty) && !used.has(k)) {
          used.add(k);
          tiles.push({ tileX: tx, tileY: ty, type: 'conveyor_e' });
        }
      }

      // Dikey konveyör grubu (orta)
      const midX = Math.floor(mapWidth / 2);
      for (let i = 0; i < Math.floor(total / 2); i++) {
        const tx = midX;
        const ty = 2 + i;
        const k  = `${tx},${ty}`;
        if (ty < mapHeight - 2 && isSafe(tx, ty) && !used.has(k)) {
          used.add(k);
          tiles.push({ tileX: tx, tileY: ty, type: 'conveyor_s' });
        }
      }
    }

    if (hasSlippery(level)) {
      const count = Math.floor(mapWidth * mapHeight * SLIPPERY_TILE_RATIO);
      let placed  = 0;
      let attempts = 0;
      while (placed < count && attempts < 500) {
        attempts++;
        const tx = 2 + Math.floor(Math.random() * (mapWidth - 6));
        const ty = 1 + Math.floor(Math.random() * (mapHeight - 3));
        const k  = `${tx},${ty}`;
        if (isSafe(tx, ty) && !used.has(k)) {
          used.add(k);
          tiles.push({ tileX: tx, tileY: ty, type: 'slippery' });
          placed++;
        }
      }
    }

    return tiles;
  }

  private static _generateObstacles(
    level: number,
    mapWidth: number,
    mapHeight: number,
    specialTiles: TileData[],
  ): ObstacleData[] {
    const count = getObstacleCount(level);
    if (count === 0) return [];

    const specialSet = new Set(specialTiles.map(t => `${t.tileX},${t.tileY}`));
    const obstacles: ObstacleData[] = [];

    for (let i = 0; i < count; i++) {
      // Patrol path: 4-6 tile döngüsel rota, sol bölgede (x=3..mapWidth/2-2)
      const pathLen = 4 + Math.floor(Math.random() * 3);
      const startX  = 3 + Math.floor(Math.random() * (Math.floor(mapWidth / 2) - 4));
      const startY  = 2 + Math.floor(Math.random() * (mapHeight - 4));
      const path: Array<{ tileX: number; tileY: number }> = [];

      // Basit dikdörtgen rota
      path.push({ tileX: startX,             tileY: startY });
      path.push({ tileX: startX + 2,         tileY: startY });
      path.push({ tileX: startX + 2,         tileY: startY + Math.min(2, mapHeight - startY - 2) });
      path.push({ tileX: startX,             tileY: startY + Math.min(2, mapHeight - startY - 2) });

      // Ekstra tile'lar gerekirse tekrar et
      for (let j = path.length; j < pathLen; j++) {
        path.push(path[j % 4]);
      }

      // Özel tile'larla çakışmayan başlangıç
      const adjustedStart = specialSet.has(`${startX},${startY}`)
        ? { tileX: startX + 1, tileY: startY }
        : { tileX: startX, tileY: startY };

      obstacles.push({
        id: `obstacle_${i}`,
        startX: adjustedStart.tileX,
        startY: adjustedStart.tileY,
        patrolPath: path,
      });
    }

    return obstacles;
  }
}
