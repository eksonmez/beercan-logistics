import Phaser from 'phaser';
import type { IsoWorld } from './IsoWorld';
import type { ObstacleData } from '../types';
import { OBJECT_BASE_DEPTH } from '../utils/Constants';

const OBSTACLE_SPEED = 1.8; // tile/sn

class ObstacleActor {
  floatX: number;
  floatY: number;
  tileX: number;
  tileY: number;

  private sprite: Phaser.GameObjects.Rectangle;
  private world: IsoWorld;
  private path: Array<{ tileX: number; tileY: number }>;
  private targetIdx: number = 0;
  private moveTimer: number = 0;
  readonly PAUSE_TIME = 400; // ms durakla

  constructor(
    scene: Phaser.Scene,
    world: IsoWorld,
    data: ObstacleData,
  ) {
    this.world  = world;
    this.path   = data.patrolPath;
    this.floatX = data.startX;
    this.floatY = data.startY;
    this.tileX  = data.startX;
    this.tileY  = data.startY;

    const { x, y } = world.tileToScreen(data.startX, data.startY);

    // Küçük kırmızı-sarı engel robotu (dikdörtgen placeholder)
    this.sprite = scene.add.rectangle(x, y - 12, 18, 14, 0xdd2222)
      .setStrokeStyle(2, 0xffaa00)
      .setOrigin(0.5, 1)
      .setDepth(OBJECT_BASE_DEPTH + world.getDepth(data.startX, data.startY) + 2);

    // Robot üstüne küçük ikon
    scene.add.text(x, y - 18, '⚠', { fontSize: '8px' })
      .setOrigin(0.5, 1)
      .setDepth(OBJECT_BASE_DEPTH + world.getDepth(data.startX, data.startY) + 3);
  }

  update(delta: number): void {
    if (this.path.length === 0) return;

    const target = this.path[this.targetIdx % this.path.length];
    const dx = target.tileX - this.floatX;
    const dy = target.tileY - this.floatY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.08) {
      // Hedefe ulaşıldı, kısa durakla
      this.floatX = target.tileX;
      this.floatY = target.tileY;
      this.tileX = target.tileX;
      this.tileY = target.tileY;
      this.moveTimer += delta;
      if (this.moveTimer >= this.PAUSE_TIME) {
        this.moveTimer = 0;
        this.targetIdx = (this.targetIdx + 1) % this.path.length;
      }
    } else {
      const dt = delta / 1000;
      const step = OBSTACLE_SPEED * dt;
      this.floatX += (dx / dist) * Math.min(step, dist);
      this.floatY += (dy / dist) * Math.min(step, dist);
      this.tileX = Math.round(this.floatX);
      this.tileY = Math.round(this.floatY);
    }

    const { x, y } = this.world.tileToScreen(this.floatX, this.floatY);
    this.sprite.setPosition(x, y - 12);
    this.sprite.setDepth(OBJECT_BASE_DEPTH + this.world.getDepth(this.floatX, this.floatY) + 2);
  }
}

export class ObstacleSystem {
  private actors: ObstacleActor[] = [];

  constructor(scene: Phaser.Scene, world: IsoWorld, obstacles: ObstacleData[]) {
    for (const data of obstacles) {
      this.actors.push(new ObstacleActor(scene, world, data));
    }
  }

  update(delta: number): void {
    for (const actor of this.actors) {
      actor.update(delta);
    }
  }

  /** Oyuncu ile herhangi bir engel çakışıyor mu? */
  checkCollision(playerTileX: number, playerTileY: number): boolean {
    return this.actors.some(a =>
      Math.abs(a.tileX - playerTileX) <= 1 && Math.abs(a.tileY - playerTileY) <= 1
    );
  }
}
