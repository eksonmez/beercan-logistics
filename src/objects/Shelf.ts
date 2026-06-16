import Phaser from 'phaser';
import type { IsoWorld } from '../systems/IsoWorld';
import { BEER_COLORS, OBJECT_BASE_DEPTH } from '../utils/Constants';
import { AssetKeys } from '../utils/AssetKeys';
import type { BeerType, ShelfData } from '../types';

const TYPE_LABELS: Record<BeerType, string> = {
  lager:   'LAGER',
  ale:     'ALE',
  stout:   'STOUT',
  pilsner: 'PILSNER',
};

/**
 * Hedef raf — Container olarak yapılandırılmış.
 * Üst kısımda renkli bant, tip etiketi ve slot göstergesi içerir.
 */
export class Shelf extends Phaser.GameObjects.Container {
  readonly shelfId: string;
  readonly acceptedType: BeerType;
  capacity: number;
  readonly tileX: number;
  readonly tileY: number;

  private currentCount: number;
  private slots: Phaser.GameObjects.Arc[] = [];
  private typeColor: number;
  private fullFlag: boolean = false;

  constructor(scene: Phaser.Scene, world: IsoWorld, data: ShelfData) {
    const { x, y } = world.tileToScreen(data.tileX, data.tileY);
    super(scene, x, y);

    this.shelfId = data.id;
    this.acceptedType = data.acceptedType;
    this.capacity = data.capacity;
    this.tileX = data.tileX;
    this.tileY = data.tileY;
    this.currentCount = data.currentCount;
    this.typeColor = BEER_COLORS[data.acceptedType];

    this.setDepth(OBJECT_BASE_DEPTH + world.getDepth(data.tileX, data.tileY) + 0.1);
    this._buildVisual(scene);
    scene.add.existing(this);
  }

  /** Kutu eklenir. Yanlış tip veya doluysa false döner. */
  addBox(type: BeerType): boolean {
    if (type !== this.acceptedType) return false;
    if (this.currentCount >= this.capacity) return false;

    this.currentCount++;
    this._updateSlots();

    if (this.isFull()) {
      this._playFullAnim();
    } else {
      this._playAddAnim();
    }
    return true;
  }

  isFull(): boolean {
    return this.currentCount >= this.capacity;
  }

  /** Kapasiteyi 1 azaltır (örn. kırılgan kutu bozulduğunda) ve slot görselini günceller. */
  reduceCapacity(): void {
    if (this.capacity <= this.currentCount) return;
    this.capacity--;
    const removed = this.slots.pop();
    removed?.destroy();
    if (this.isFull()) this._playFullAnim();
  }

  getRemainingCapacity(): number {
    return this.capacity - this.currentCount;
  }

  // ─── Görsel inşa ──────────────────────────────────────────────────────────

  private _buildVisual(scene: Phaser.Scene): void {
    // Zemin tile (raf tabanı)
    const base = scene.add.image(0, 0, AssetKeys.TILES.SHELF_BASE).setOrigin(0.5, 1);
    this.add(base);

    // Renkli tür bandı (üst kısımda belirgin renk şeridi)
    const band = scene.add.rectangle(0, -38, 44, 10, this.typeColor, 0.9)
      .setOrigin(0.5, 0.5);
    this.add(band);

    // Tür etiketi
    const label = scene.add.text(0, -52, TYPE_LABELS[this.acceptedType], {
      fontSize: '9px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5);
    this.add(label);

    // Slot göstergeleri — capacity sayısı kadar daire
    this._buildSlots(scene);
  }

  private _buildSlots(scene: Phaser.Scene): void {
    const slotSize = 5;
    const gap = 8;
    const totalW = (this.capacity - 1) * gap;
    const startX = -totalW / 2;

    for (let i = 0; i < this.capacity; i++) {
      const dot = scene.add.circle(startX + i * gap, -24, slotSize / 2, 0x333333)
        .setStrokeStyle(1, 0x888888);
      this.slots.push(dot);
      this.add(dot);
    }

    this._updateSlots();
  }

  private _updateSlots(): void {
    this.slots.forEach((dot, i) => {
      if (i < this.currentCount) {
        dot.setFillStyle(this.typeColor);
        dot.setStrokeStyle(1, 0xffffff, 0.6);
      } else {
        dot.setFillStyle(0x333333);
        dot.setStrokeStyle(1, 0x888888);
      }
    });
  }

  // ─── Animasyonlar ─────────────────────────────────────────────────────────

  private _playAddAnim(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.06, scaleY: 1.06,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  private _playFullAnim(): void {
    if (this.fullFlag) return;
    this.fullFlag = true;

    // Beyaz flash
    const flash = this.scene.add.rectangle(this.x, this.y - 30, 60, 60, 0xffffff, 0.7)
      .setDepth(this.depth + 2);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });

    // Büyüme titremesi
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.12, scaleY: 1.12,
      duration: 100,
      yoyo: true,
      repeat: 1,
      ease: 'Bounce.easeOut',
    });
  }
}
