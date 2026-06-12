import Phaser from 'phaser';
import type { IsoWorld } from '../systems/IsoWorld';
import type { InputHandler } from '../systems/InputHandler';
import { FORKLIFT_SPEED, FORKLIFT_CAPACITY, BEER_COLORS, OBJECT_BASE_DEPTH } from '../utils/Constants';
import { AssetKeys } from '../utils/AssetKeys';
import { ForkliftAnims, FORKLIFT_FRAME } from '../utils/AnimationKeys';
import { directionToIso } from '../utils/DirectionUtils';
import type { BeerType } from '../types';
import type { IsoDirection } from '../utils/AnimationKeys';

/**
 * Forklift — oyuncu `E` ile biner/iner.
 * Yığındaki kutu tiplerini takip eder ve görsel olarak gösterir.
 */
export class Forklift extends Phaser.GameObjects.Container {
  tileX: number;
  tileY: number;
  floatX: number;
  floatY: number;
  isOccupied: boolean = false;

  private world: IsoWorld;
  private sprite: Phaser.GameObjects.Sprite;
  private occupiedLight: Phaser.GameObjects.Arc;
  private stackDots: Phaser.GameObjects.Arc[] = [];
  private countText: Phaser.GameObjects.Text;
  private lastIsoDir: IsoDirection = 'se';
  private currentAnimKey: string = '';

  private carriedTypes: BeerType[] = [];

  constructor(scene: Phaser.Scene, world: IsoWorld, tileX: number, tileY: number) {
    const { x, y } = world.tileToScreen(tileX, tileY);
    super(scene, x, y);

    this.tileX = tileX;
    this.tileY = tileY;
    this.floatX = tileX;
    this.floatY = tileY;
    this.world = world;

    this.sprite = scene.add.sprite(0, 0, AssetKeys.FORKLIFT.SHEET, 0);
    this.sprite.setOrigin(0.5, 1);
    this.add(this.sprite);

    this.occupiedLight = scene.add.circle(-18, -FORKLIFT_FRAME.height + 6, 4, 0x44ff44);
    this.add(this.occupiedLight);

    for (let i = 0; i < FORKLIFT_CAPACITY; i++) {
      const dot = scene.add.circle(-8 + i * 10, -FORKLIFT_FRAME.height - 8, 5, 0x333333)
        .setStrokeStyle(1, 0x888888);
      this.stackDots.push(dot);
      this.add(dot);
    }

    this.countText = scene.add.text(0, -FORKLIFT_FRAME.height - 18, '', {
      fontSize: '9px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0.5);
    this.add(this.countText);

    this.setDepth(OBJECT_BASE_DEPTH + world.getDepth(tileX, tileY) + 0.8);
    this._playAnim(ForkliftAnims.idle(this.lastIsoDir));
    scene.add.existing(this);
  }

  mount(): void {
    this.isOccupied = true;
    this.occupiedLight.setFillStyle(0xff4444);
    this.sprite.setTint(0xffe066);
    this.scene.tweens.add({
      targets: this, scaleX: 1.08, scaleY: 1.08,
      duration: 80, yoyo: true,
    });
  }

  dismount(): void {
    this.isOccupied = false;
    this.occupiedLight.setFillStyle(0x44ff44);
    this.sprite.clearTint();
  }

  addCarriedType(type: BeerType): boolean {
    if (this.carriedTypes.length >= FORKLIFT_CAPACITY) return false;
    this.carriedTypes.push(type);
    this._refreshStack();
    return true;
  }

  removeCarriedType(type: BeerType): number {
    const before = this.carriedTypes.length;
    this.carriedTypes = this.carriedTypes.filter(t => t !== type);
    const removed = before - this.carriedTypes.length;
    if (removed > 0) this._refreshStack();
    return removed;
  }

  getCarriedTypes(): BeerType[] {
    return [...this.carriedTypes];
  }

  get carriedCount(): number {
    return this.carriedTypes.length;
  }

  isFull(): boolean {
    return this.carriedTypes.length >= FORKLIFT_CAPACITY;
  }

  hasType(type: BeerType): boolean {
    return this.carriedTypes.includes(type);
  }

  update(input: InputHandler, delta: number): void {
    if (!this.isOccupied) return;

    const dir = input.getDirection();
    const vec = input.getMovementVector();
    const dt = delta / 1000;
    const margin = 0.5;

    const nextX = Phaser.Math.Clamp(
      this.floatX + vec.dx * FORKLIFT_SPEED * dt,
      margin, this.world.mapWidth - 1 - margin,
    );
    if (!this.world.isTileBlocked(Math.round(nextX), Math.round(this.floatY))) {
      this.floatX = nextX;
    }

    const nextY = Phaser.Math.Clamp(
      this.floatY + vec.dy * FORKLIFT_SPEED * dt,
      margin, this.world.mapHeight - 1 - margin,
    );
    if (!this.world.isTileBlocked(Math.round(this.floatX), Math.round(nextY))) {
      this.floatY = nextY;
    }

    this.tileX = Math.round(this.floatX);
    this.tileY = Math.round(this.floatY);

    const { x, y } = this.world.tileToScreen(this.floatX, this.floatY);
    this.setPosition(x, y);
    this.setDepth(OBJECT_BASE_DEPTH + this.world.getDepth(this.floatX, this.floatY) + 0.8);

    const isMoving = vec.dx !== 0 || vec.dy !== 0;
    if (dir !== 'none') {
      this.lastIsoDir = directionToIso(dir);
    }
    this._playAnim(isMoving ? ForkliftAnims.move(this.lastIsoDir) : ForkliftAnims.idle(this.lastIsoDir));
  }

  /** Kamera takibi için forklift görsel merkezini döner. */
  getCameraTarget(): { x: number; y: number } {
    return { x: this.x, y: this.y - FORKLIFT_FRAME.height * 0.4 };
  }

  private _playAnim(key: string): void {
    if (this.currentAnimKey === key) return;
    this.currentAnimKey = key;
    if (this.scene.anims.exists(key)) {
      this.sprite.anims.play(key, true);
    }
  }

  private _refreshStack(): void {
    this.stackDots.forEach((dot, i) => {
      const type = this.carriedTypes[i];
      if (type) {
        dot.setFillStyle(BEER_COLORS[type]).setStrokeStyle(1, 0xffffff, 0.7);
      } else {
        dot.setFillStyle(0x333333).setStrokeStyle(1, 0x888888);
      }
    });

    const n = this.carriedTypes.length;
    this.countText.setText(n > 0 ? `${n}/${FORKLIFT_CAPACITY}` : '');

    if (n > 0) {
      this.scene.tweens.add({
        targets: this.stackDots,
        scaleX: 1.3, scaleY: 1.3,
        duration: 70, yoyo: true,
      });
    }
  }
}
