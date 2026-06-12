/** Bira kutusu türleri */
export type BeerType = 'lager' | 'ale' | 'stout' | 'pilsner';

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
