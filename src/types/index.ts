/** Bira kutusu türleri */
export type BeerType = 'lager' | 'ale' | 'stout' | 'pilsner';

/** Zemin tile türleri */
export type TileType = 'floor' | 'conveyor_n' | 'conveyor_s' | 'conveyor_e' | 'conveyor_w' | 'slippery';

/** Özel tile verisi */
export interface TileData {
  tileX: number;
  tileY: number;
  type: TileType;
}

/** NPC engel verisi */
export interface ObstacleData {
  id: string;
  startX: number;
  startY: number;
  patrolPath: Array<{ tileX: number; tileY: number }>;
}

/** İzometrik grid pozisyonu */
export interface IsoPosition {
  tileX: number;
  tileY: number;
}

/** Level konfigürasyonu */
export interface LevelConfig {
  level: number;
  boxCount: number;
  beerTypes: BeerType[];
  timeLimit: number;
  mapWidth: number;
  mapHeight: number;
  obstacleCount: number;
  fragileBoxRatio: number;
  fragileBoxTTL: number;
  hasConveyor: boolean;
  hasSlippery: boolean;
  floorPaletteIndex: number;
  specialTiles: TileData[];
  obstacles: ObstacleData[];
}

/** Oyun durumu (registry'de tutulur) */
export interface GameState {
  level: number;
  score: number;
  bonusTime: number;
  highScore: number;
}

/** Raf verisi */
export interface ShelfData {
  id: string;
  tileX: number;
  tileY: number;
  acceptedType: BeerType;
  capacity: number;
  currentCount: number;
}

/** Yön enum'u */
export type Direction = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | 'none';
