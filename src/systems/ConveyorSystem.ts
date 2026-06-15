import Phaser from 'phaser';
import type { IsoWorld } from './IsoWorld';
import type { TileType } from '../types';
import type { Player } from '../objects/Player';
import type { BeerBox } from '../objects/BeerBox';
import { CONVEYOR_SPEED } from '../utils/Constants';

/** Konveyör yönünü vektöre çevirir. */
function typeToVec(type: TileType): { dx: number; dy: number } | null {
  switch (type) {
    case 'conveyor_n': return { dx: 0,  dy: -1 };
    case 'conveyor_s': return { dx: 0,  dy:  1 };
    case 'conveyor_e': return { dx: 1,  dy:  0 };
    case 'conveyor_w': return { dx: -1, dy:  0 };
    default: return null;
  }
}

export class ConveyorSystem {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor() {}

  /** Oyuncuyu konveyör bant varsa kaydır. */
  applyToPlayer(player: Player, delta: number, world: IsoWorld): void {
    const type = world.getTileType(player.tileX, player.tileY);
    const vec  = typeToVec(type);
    if (!vec) return;

    const dt   = delta / 1000;
    const step = CONVEYOR_SPEED * dt;
    const margin = 0.5;

    const nextX = Phaser.Math.Clamp(
      player.floatX + vec.dx * step,
      margin, world.mapWidth - 1 - margin,
    );
    const nextY = Phaser.Math.Clamp(
      player.floatY + vec.dy * step,
      margin, world.mapHeight - 1 - margin,
    );

    if (!world.isTileBlocked(Math.round(nextX), Math.round(player.floatY))) {
      player.floatX = nextX;
    }
    if (!world.isTileBlocked(Math.round(player.floatX), Math.round(nextY))) {
      player.floatY = nextY;
    }
    player.tileX = Math.round(player.floatX);
    player.tileY = Math.round(player.floatY);
  }

  /** Yerde duran kutulara konveyör etkisi uygula. */
  applyToBoxes(boxes: BeerBox[], delta: number, world: IsoWorld): void {
    const dt = delta / 1000;
    for (const box of boxes) {
      if (box.isCarried) continue;
      const type = world.getTileType(box.tileX, box.tileY);
      const vec  = typeToVec(type);
      if (!vec) continue;

      const step = CONVEYOR_SPEED * dt;
      const margin = 0.5;
      const newX = Phaser.Math.Clamp(box.tileX + vec.dx * step, margin, world.mapWidth  - 1 - margin);
      const newY = Phaser.Math.Clamp(box.tileY + vec.dy * step, margin, world.mapHeight - 1 - margin);

      if (!world.isTileBlocked(Math.round(newX), Math.round(newY))) {
        box.updatePosition(world, newX, newY);
      }
    }
  }
}
