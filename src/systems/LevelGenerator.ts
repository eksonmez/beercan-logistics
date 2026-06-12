import { TimerSystem } from './TimerSystem';
import { MAP_WIDTH, MAP_HEIGHT } from '../utils/Constants';
import type { BeerType, LevelConfig, ShelfData } from '../types';

const ALL_TYPES: BeerType[] = ['lager', 'ale', 'stout', 'pilsner'];

/** Prosedürel level verisi üretir. */
export class LevelGenerator {
  /** Level konfigürasyonunu hesaplar. */
  static buildConfig(level: number, bonusTime: number = 0): LevelConfig {
    const typeCount = Math.min(2 + Math.floor(level / 3), 4);
    const boxCount = 8 + level * 2;
    const timeLimit = TimerSystem.calcTimeLimit(level, bonusTime);
    const beerTypes = ALL_TYPES.slice(0, typeCount) as BeerType[];
    return { level, boxCount, beerTypes, timeLimit };
  }

  /** Raf pozisyonlarını ve konfigürasyonunu üretir.
   *  Raflar x=8 sütununda, y boyunca eşit dağılmış şekilde yerleşir. */
  static generateShelves(config: LevelConfig): ShelfData[] {
    const shelves: ShelfData[] = [];
    const boxesPerType = Math.ceil(config.boxCount / config.beerTypes.length);
    // Y pozisyonları: MAP_HEIGHT=10 için 1,3,5,7 → 4 raf tam sığar
    const shelfY = [1, 3, 5, 7];
    const shelfX = MAP_WIDTH - 4; // x=8 (merkeze yakın, gerçek engel oluşturur)

    config.beerTypes.forEach((type, i) => {
      shelves.push({
        id: `shelf_${type}`,
        tileX: shelfX,
        tileY: shelfY[i],
        acceptedType: type,
        capacity: boxesPerType,
        currentCount: 0,
      });
    });

    return shelves;
  }

  /** Kutu başlangıç pozisyonlarını üretir.
   *  Her tipe ayrı bir sütun atanır (x=2,3,4,5), kutular sütunda sıralanır. */
  static generateBoxPositions(config: LevelConfig): Array<{ tileX: number; tileY: number; type: BeerType }> {
    const positions: Array<{ tileX: number; tileY: number; type: BeerType }> = [];
    const used = new Set<string>();
    const ROWS = MAP_HEIGHT - 2; // y=1..MAP_HEIGHT-2 arası kullanılabilir satır sayısı
    const MAX_COL_X = MAP_WIDTH - 5; // x≤7: raf sütunuyla (x=8) çakışmaz

    const typeCount = config.beerTypes.length;
    // Her tipe düşen kutu sayısı (round-robin ile dağıtılmış)
    const countPerType = Array(typeCount).fill(0) as number[];
    for (let i = 0; i < config.boxCount; i++) countPerType[i % typeCount]++;

    for (let ti = 0; ti < typeCount; ti++) {
      const type = config.beerTypes[ti];
      const count = countPerType[ti];

      for (let j = 0; j < count; j++) {
        // Her tip için başlangıç sütunu: x=2,3,4,5; taşma durumunda sütun kaydırılır
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

        // Fallback: sol alanda rastgele boş tile bul
        let tileX: number, fbKey: string;
        do {
          tileX = 1 + Math.floor(Math.random() * 4);
          const fbY = 1 + Math.floor(Math.random() * ROWS);
          fbKey = `${tileX},${fbY}`;
        } while (used.has(fbKey));
        used.add(fbKey);
        const [fbX, fbYn] = fbKey.split(',').map(Number);
        positions.push({ tileX: fbX, tileY: fbYn, type });
      }
    }

    return positions;
  }
}
