import Phaser from 'phaser';
import type { IsoWorld } from '../systems/IsoWorld';

/** İzometrik zemin tile'ı. */
export class IsoTile extends Phaser.GameObjects.Image {
  readonly tileX: number;
  readonly tileY: number;

  constructor(scene: Phaser.Scene, world: IsoWorld, tileX: number, tileY: number, textureKey: string) {
    const { x, y } = world.tileToScreen(tileX, tileY);
    super(scene, x, y, textureKey);
    this.tileX = tileX;
    this.tileY = tileY;
    this.setDepth(world.getDepth(tileX, tileY));
    this.setOrigin(0.5, 1);
    scene.add.existing(this);
  }
}
