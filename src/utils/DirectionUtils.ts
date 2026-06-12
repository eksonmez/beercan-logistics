import type { Direction } from '../types';
import type { IsoDirection } from './AnimationKeys';

/** 8 yönlü girdiyi 4 izometrik sprite yönüne indirger. */
export function directionToIso(dir: Direction): IsoDirection {
  switch (dir) {
    case 'n':
    case 'ne':
    case 'e':
      return 'ne';
    case 'se':
    case 's':
      return 'se';
    case 'sw':
    case 'w':
      return 'sw';
    case 'nw':
      return 'nw';
    default:
      return 'se';
  }
}
