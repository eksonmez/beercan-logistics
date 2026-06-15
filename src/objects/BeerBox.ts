import Phaser from 'phaser';
import type { IsoWorld } from '../systems/IsoWorld';
import type { BeerType } from '../types';
import { OBJECT_BASE_DEPTH } from '../utils/Constants';

/** Taşınabilir bira kutusu. */
export class BeerBox extends Phaser.GameObjects.Image {
  readonly beerType: BeerType;
  tileX: number;
  tileY: number;
  isCarried: boolean = false;

  private fragile: boolean = false;
  private ttl: number = 0;
  private ttlTotal: number = 0;
  private ttlBar?: Phaser.GameObjects.Graphics;
  private ttlTimer?: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene,
    world: IsoWorld,
    tileX: number,
    tileY: number,
    beerType: BeerType,
    textureKey: string
  ) {
    const { x, y } = world.tileToScreen(tileX, tileY);
    super(scene, x, y, textureKey);
    this.beerType = beerType;
    this.tileX = tileX;
    this.tileY = tileY;
    this.setDepth(OBJECT_BASE_DEPTH + world.getDepth(tileX, tileY) + 0.5);
    this.setOrigin(0.5, 1);
    scene.add.existing(this);
  }

  /** Kırılgan modu etkinleştirir — ttl saniye içinde teslim edilmezse emit('boxExpired'). */
  enableFragile(ttlSeconds: number): void {
    this.fragile = true;
    this.ttl      = ttlSeconds;
    this.ttlTotal = ttlSeconds;

    this.ttlBar = this.scene.add.graphics().setDepth(this.depth + 1);
    this._drawTTLBar();

    this.ttlTimer = this.scene.time.addEvent({
      delay: 1000,
      repeat: ttlSeconds - 1,
      callback: this._tickTTL,
      callbackScope: this,
    });
  }

  /** Pozisyonu günceller — floatX/floatY destekler. */
  updatePosition(world: IsoWorld, tileX: number, tileY: number, yOffset: number = 0): void {
    this.tileX = Math.round(tileX);
    this.tileY = Math.round(tileY);
    const { x, y } = world.tileToScreen(tileX, tileY);
    this.setPosition(x, y + yOffset);
    this.setDepth(OBJECT_BASE_DEPTH + world.getDepth(this.tileX, this.tileY) + 0.5);
    this._drawTTLBar();
  }

  destroyFragile(): void {
    this.ttlTimer?.remove();
    this.ttlBar?.destroy();
  }

  override destroy(fromScene?: boolean): void {
    this.ttlTimer?.remove();
    this.ttlBar?.destroy();
    super.destroy(fromScene);
  }

  private _tickTTL(): void {
    if (this.isCarried) return; // taşınırken dondurul
    this.ttl--;
    this._drawTTLBar();

    // Son 5 saniyede titret
    if (this.ttl <= 5 && this.ttl > 0) {
      this.scene.tweens.add({
        targets: this, x: this.x + 2, duration: 80, yoyo: true, repeat: 1,
      });
    }

    if (this.ttl <= 0) {
      this.scene.events.emit('boxExpired', this);
    }
  }

  private _drawTTLBar(): void {
    if (!this.ttlBar || !this.fragile) return;
    const bw = 24;
    const bh = 3;
    const bx = this.x - bw / 2;
    const by = this.y - this.displayHeight - 6;
    const pct = Math.max(0, this.ttl / this.ttlTotal);
    const barColor = pct > 0.5 ? 0x44ff44 : pct > 0.25 ? 0xffaa00 : 0xff3333;

    this.ttlBar.clear();
    this.ttlBar.fillStyle(0x000000, 0.5).fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    this.ttlBar.fillStyle(barColor, 0.9).fillRect(bx, by, bw * pct, bh);
    this.ttlBar.setDepth(this.depth + 1);
  }
}
