import Phaser from 'phaser';
import { BASE_TIME, MIN_TIME, TIME_DECREASE_PER_LEVEL } from '../utils/Constants';

/** Geri sayım zamanlayıcısı. UIScene tarafından dinlenir. */
export class TimerSystem {
  private scene: Phaser.Scene;
  private remaining: number = 0;
  private timer: Phaser.Time.TimerEvent | null = null;
  private onTickCb: ((remaining: number) => void) | null = null;
  private onExpireCb: (() => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Level numarasına göre başlangıç süresini hesaplar. */
  static calcTimeLimit(level: number, bonusTime: number = 0): number {
    return Math.max(BASE_TIME - (level - 1) * TIME_DECREASE_PER_LEVEL, MIN_TIME) + bonusTime;
  }

  /** Zamanlayıcıyı başlatır. */
  start(seconds: number, onTick: (remaining: number) => void, onExpire: () => void): void {
    this.stop();
    this.remaining = seconds;
    this.onTickCb = onTick;
    this.onExpireCb = onExpire;

    this.timer = this.scene.time.addEvent({
      delay: 1000,
      repeat: seconds - 1,
      callback: this._tick,
      callbackScope: this,
    });
  }

  stop(): void {
    if (this.timer) {
      this.timer.remove(false);
      this.timer = null;
    }
  }

  addTime(seconds: number): void {
    this.remaining = Math.max(0, this.remaining + seconds);
    this.onTickCb?.(this.remaining);
  }

  getRemaining(): number {
    return this.remaining;
  }

  private _tick(): void {
    this.remaining -= 1;
    this.onTickCb?.(this.remaining);
    if (this.remaining <= 0) {
      this.stop();
      this.onExpireCb?.();
    }
  }
}
