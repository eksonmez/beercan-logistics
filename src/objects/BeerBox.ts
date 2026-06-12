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

  /** Pozisyonu günceller — floatX/floatY destekler. */
  updatePosition(world: IsoWorld, tileX: number, tileY: number, yOffset: number = 0): void {
    this.tileX = Math.round(tileX);
    this.tileY = Math.round(tileY);
    const { x, y } = world.tileToScreen(tileX, tileY);
    this.setPosition(x, y + yOffset);
    this.setDepth(OBJECT_BASE_DEPTH + world.getDepth(this.tileX, this.tileY) + 0.5);
  }
}
