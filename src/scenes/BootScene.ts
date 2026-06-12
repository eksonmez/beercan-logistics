import Phaser from 'phaser';

/** Temel başlangıç sahnesi — hemen PreloadScene'e geçer. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}
