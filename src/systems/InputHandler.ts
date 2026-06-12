import Phaser from 'phaser';
import type { Direction } from '../types';

/** Klavye girdilerini izometrik yön vektörlerine çevirir. */
export class InputHandler {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private shiftKey: Phaser.Input.Keyboard.Key;
  private spaceKey: Phaser.Input.Keyboard.Key;
  private eKey: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.shiftKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.spaceKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.eKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  /** Mevcut hareket yönünü döner. */
  getDirection(): Direction {
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;
    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;

    if (up && right) return 'ne';
    if (up && left) return 'nw';
    if (down && right) return 'se';
    if (down && left) return 'sw';
    if (up) return 'n';
    if (down) return 's';
    if (right) return 'e';
    if (left) return 'w';
    return 'none';
  }

  /** İzometrik hareket vektörü döner (dx, dy grid birimlerinde). */
  getMovementVector(): { dx: number; dy: number } {
    const dir = this.getDirection();
    const vectors: Record<Direction, { dx: number; dy: number }> = {
      n:    { dx: -1, dy: -1 },
      ne:   { dx:  0, dy: -1 },
      e:    { dx:  1, dy: -1 },
      se:   { dx:  1, dy:  0 },
      s:    { dx:  1, dy:  1 },
      sw:   { dx:  0, dy:  1 },
      w:    { dx: -1, dy:  1 },
      nw:   { dx: -1, dy:  0 },
      none: { dx:  0, dy:  0 },
    };
    return vectors[dir];
  }

  isShiftDown(): boolean { return this.shiftKey.isDown; }
  isSpaceJustDown(): boolean { return Phaser.Input.Keyboard.JustDown(this.spaceKey); }
  isEJustDown(): boolean { return Phaser.Input.Keyboard.JustDown(this.eKey); }
}
