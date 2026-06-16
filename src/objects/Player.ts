import Phaser from 'phaser';
import type { IsoWorld } from '../systems/IsoWorld';
import type { InputHandler } from '../systems/InputHandler';
import { PLAYER_SPEED, PLAYER_CARRY_SPEED, OBJECT_BASE_DEPTH } from '../utils/Constants';
import { AssetKeys } from '../utils/AssetKeys';
import { PlayerAnims, PLAYER_FRAME } from '../utils/AnimationKeys';
import { directionToIso } from '../utils/DirectionUtils';
import type { Direction } from '../types';
import type { IsoDirection } from '../utils/AnimationKeys';

/** Oyuncu karakteri — izometrik grid üzerinde smooth hareket eder. */
export class Player extends Phaser.GameObjects.Container {
  /** Tam sayı tile pozisyonu (interaksiyon için). */
  tileX: number = 0;
  tileY: number = 0;

  /** Kesirli tile pozisyonu (smooth hareket için). */
  floatX: number;
  floatY: number;

  isCarrying: boolean = false;

  /** Hız çarpanı — obstacle yavaşlatması için */
  private speedMultiplier: number = 1.0;

  /** Kaygan zemin momentum hız vektörü */
  slipVX: number = 0;
  slipVY: number = 0;

  private world: IsoWorld;
  private sprite: Phaser.GameObjects.Sprite;
  private lastIsoDir: IsoDirection = 'se';
  private currentAnimKey: string = '';

  constructor(scene: Phaser.Scene, world: IsoWorld, tileX: number, tileY: number) {
    const { x, y } = world.tileToScreen(tileX, tileY);
    super(scene, x, y);

    this.floatX = tileX;
    this.floatY = tileY;
    this.tileX = tileX;
    this.tileY = tileY;
    this.world = world;

    this.sprite = scene.add.sprite(0, 0, AssetKeys.PLAYER.IDLE_PNG, 0);
    this.sprite.setOrigin(0.5, 1);
    this.add(this.sprite);

    this.setDepth(OBJECT_BASE_DEPTH + world.getDepth(tileX, tileY) + 1);
    this._playAnim(PlayerAnims.idle(this.lastIsoDir));
    scene.add.existing(this);
  }

  setSpeedMultiplier(m: number): void {
    this.speedMultiplier = m;
  }

  /** Her frame çağrılır — smooth fractional-tile hareketi uygular. */
  update(input: InputHandler, delta: number): void {
    const dir = input.getDirection();
    const vec = input.getMovementVector();
    const speed = (this.isCarrying ? PLAYER_CARRY_SPEED : PLAYER_SPEED) * this.speedMultiplier;
    const slow = input.isShiftDown() ? 0.45 : 1;
    const dt = delta / 1000;

    const margin = 0.5;

    const nextX = Phaser.Math.Clamp(
      this.floatX + vec.dx * speed * slow * dt,
      margin, this.world.mapWidth - 1 - margin,
    );
    if (!this.world.isTileBlocked(Math.round(nextX), Math.round(this.floatY))) {
      this.floatX = nextX;
    }

    const nextY = Phaser.Math.Clamp(
      this.floatY + vec.dy * speed * slow * dt,
      margin, this.world.mapHeight - 1 - margin,
    );
    if (!this.world.isTileBlocked(Math.round(this.floatX), Math.round(nextY))) {
      this.floatY = nextY;
    }

    this.tileX = Math.round(this.floatX);
    this.tileY = Math.round(this.floatY);

    const isMoving = vec.dx !== 0 || vec.dy !== 0;
    this._syncVisuals(dir, isMoving);
  }

  /** Kamera takibi için oyuncunun görsel merkezini döner. */
  getCameraTarget(): { x: number; y: number } {
    return { x: this.x, y: this.y - PLAYER_FRAME.height * 0.45 };
  }

  private _syncVisuals(dir: Direction, isMoving: boolean): void {
    const { x, y } = this.world.tileToScreen(this.floatX, this.floatY);
    this.setPosition(x, y);
    this.setDepth(OBJECT_BASE_DEPTH + this.world.getDepth(this.floatX, this.floatY) + 1);

    if (dir !== 'none') {
      this.lastIsoDir = directionToIso(dir);
    }

    // sw/nw için se/ne texture'larını yatay aynalayarak kullan
    this.sprite.setFlipX(this.lastIsoDir === 'sw' || this.lastIsoDir === 'nw');

    const animKey = this._resolveAnimKey(isMoving);
    this._playAnim(animKey);
  }

  private _resolveAnimKey(isMoving: boolean): string {
    if (isMoving) {
      return this.isCarrying
        ? PlayerAnims.carry(this.lastIsoDir)
        : PlayerAnims.walk(this.lastIsoDir);
    }
    return this.isCarrying
      ? PlayerAnims.carry(this.lastIsoDir)
      : PlayerAnims.idle(this.lastIsoDir);
  }

  private _playAnim(key: string): void {
    if (this.currentAnimKey === key) return;
    this.currentAnimKey = key;
    if (this.scene.anims.exists(key)) {
      this.sprite.anims.play(key, true);
    }
  }
}
