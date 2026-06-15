import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, BEER_COLORS } from '../utils/Constants';
import type { BeerType } from '../types';

const TYPE_TR: Record<BeerType, string> = {
  lager: 'LAGER', ale: 'ALE', stout: 'STOUT', pilsner: 'PILSNR',
};

const FONT = "'Press Start 2P'";
const TOP_H  = 38;
const BOT_H  = 32;
const GOLD   = 0xd4a830;

export class UIScene extends Phaser.Scene {
  private timerText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private boxesText!: Phaser.GameObjects.Text;

  private carryDot!: Phaser.GameObjects.Arc;
  private carryLabel!: Phaser.GameObjects.Text;
  private carryBg!: Phaser.GameObjects.Rectangle;

  private modeText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    this._buildTopBar();
    this._buildBottomBar();
    this._listenEvents();
  }

  // ─── Top bar ──────────────────────────────────────────────────────────────

  private _buildTopBar(): void {
    const cx = GAME_WIDTH / 2;
    const cy = TOP_H / 2;

    // Arka plan + alt altın çizgi
    this.add.rectangle(cx, cy, GAME_WIDTH, TOP_H, 0x0d0d1a, 0.90).setScrollFactor(0);
    this.add.rectangle(cx, TOP_H, GAME_WIDTH, 1, GOLD, 0.55).setScrollFactor(0);

    this.levelText = this.add.text(10, cy, 'LVL 1', {
      fontFamily: FONT, fontSize: '8px', color: '#c8b87a',
    }).setOrigin(0, 0.5).setScrollFactor(0);

    this.timerText = this.add.text(cx, cy, '2:00', {
      fontFamily: FONT, fontSize: '12px', color: '#44ff88',
      stroke: '#001800', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0);

    this.scoreText = this.add.text(GAME_WIDTH - 10, cy, '★ 0', {
      fontFamily: FONT, fontSize: '8px', color: '#f5c542',
    }).setOrigin(1, 0.5).setScrollFactor(0);
  }

  // ─── Bottom bar ───────────────────────────────────────────────────────────

  private _buildBottomBar(): void {
    const cx   = GAME_WIDTH / 2;
    const botY = GAME_HEIGHT - BOT_H / 2;

    // Arka plan + üst ince çizgi
    this.add.rectangle(cx, botY, GAME_WIDTH, BOT_H, 0x0d0d1a, 0.90).setScrollFactor(0);
    this.add.rectangle(cx, GAME_HEIGHT - BOT_H, GAME_WIDTH, 1, GOLD, 0.35).setScrollFactor(0);

    // Sol — kalan kutu
    this.boxesText = this.add.text(10, botY, '📦 —', {
      fontFamily: FONT, fontSize: '7px', color: '#88aacc',
    }).setOrigin(0, 0.5).setScrollFactor(0);

    // Merkez — taşınan kutu göstergesi
    this.carryBg = this.add.rectangle(cx, botY, 100, BOT_H - 6, 0x000000, 0.0)
      .setScrollFactor(0);
    this.carryDot = this.add.circle(cx - 30, botY, 6, 0x555555)
      .setStrokeStyle(1.5, 0x888888, 0.5).setScrollFactor(0);
    this.carryLabel = this.add.text(cx - 18, botY, 'BOŞ EL', {
      fontFamily: FONT, fontSize: '7px', color: '#555555',
    }).setOrigin(0, 0.5).setScrollFactor(0);

    // Sağ — mod
    this.modeText = this.add.text(GAME_WIDTH - 10, botY, '🚶YÜR', {
      fontFamily: FONT, fontSize: '7px', color: '#aaddff',
    }).setOrigin(1, 0.5).setScrollFactor(0);
  }

  // ─── Event dinleyiciler ───────────────────────────────────────────────────

  private _listenEvents(): void {
    const game = this.scene.get('GameScene');

    game.events.on('timerUpdate', (remaining: number) => {
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      this.timerText.setText(`${m}:${String(s).padStart(2, '0')}`);

      if (remaining <= 10) {
        this.timerText.setStyle({ color: '#ff3030' });
        this._pulseTimer();
      } else if (remaining <= 30) {
        this.timerText.setStyle({ color: '#ff8844' });
      } else {
        this.timerText.setStyle({ color: '#44ff88' });
      }
    });

    game.events.on('scoreUpdate', (score: number) => {
      this.scoreText.setText(`★ ${score}`);
      this.tweens.add({
        targets: this.scoreText, scaleX: 1.15, scaleY: 1.15,
        duration: 80, yoyo: true,
      });
    });

    game.events.on('levelUpdate', (level: number) => {
      this.levelText.setText(`LVL ${level}`);
    });

    game.events.on('boxesUpdate', (remaining: number, total: number) => {
      this.boxesText.setText(`📦 ${remaining}/${total}`);
      const pct = remaining / total;
      const color = pct <= 0.25 ? '#44ff88' : pct <= 0.5 ? '#f5c542' : '#88aacc';
      this.boxesText.setStyle({ color });
      this.tweens.add({
        targets: this.boxesText, scaleX: 1.2, scaleY: 1.2,
        duration: 70, yoyo: true,
      });
    });

    game.events.on('carryUpdate', (type: BeerType | null) => {
      this._updateCarry(type);
    });

    game.events.on('modeUpdate', (mode: 'foot' | 'forklift') => {
      this._updateMode(mode);
    });
  }

  // ─── Güncelleme ───────────────────────────────────────────────────────────

  private _updateCarry(type: BeerType | null): void {
    if (type) {
      const color = BEER_COLORS[type];
      this.carryDot.setFillStyle(color).setStrokeStyle(1.5, 0xffffff, 0.7);
      this.carryLabel.setText(TYPE_TR[type]).setStyle({ color: '#ffffff' });
      this.carryBg.setFillStyle(color, 0.18);
      this.tweens.add({
        targets: [this.carryDot, this.carryLabel],
        scaleX: 1.2, scaleY: 1.2, duration: 80, yoyo: true,
      });
    } else {
      this.carryDot.setFillStyle(0x555555).setStrokeStyle(1.5, 0x888888, 0.5);
      this.carryLabel.setText('BOŞ EL').setStyle({ color: '#555555' });
      this.carryBg.setFillStyle(0x000000, 0.0);
    }
  }

  private _updateMode(mode: 'foot' | 'forklift'): void {
    if (mode === 'forklift') {
      this.modeText.setText('🚜FRK').setStyle({ color: '#ffcc44' });
    } else {
      this.modeText.setText('🚶YÜR').setStyle({ color: '#aaddff' });
    }
    this.tweens.add({
      targets: this.modeText,
      scaleX: 1.15, scaleY: 1.15, duration: 100, yoyo: true,
    });
  }

  private _pulseTimer(): void {
    if (this.tweens.isTweening(this.timerText)) return;
    this.tweens.add({
      targets: this.timerText,
      scaleX: 1.2, scaleY: 1.2, duration: 130,
      yoyo: true, ease: 'Sine.easeInOut',
    });
  }
}
