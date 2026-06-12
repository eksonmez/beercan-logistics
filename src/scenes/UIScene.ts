import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, BEER_COLORS } from '../utils/Constants';
import type { BeerType } from '../types';

const TYPE_TR: Record<BeerType, string> = {
  lager: 'Lager', ale: 'Ale', stout: 'Stout', pilsner: 'Pilsner',
};

export class UIScene extends Phaser.Scene {
  private timerText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private boxesText!: Phaser.GameObjects.Text;

  private carryBg!: Phaser.GameObjects.Rectangle;
  private carryDot!: Phaser.GameObjects.Arc;
  private carryLabel!: Phaser.GameObjects.Text;

  private modeBadge!: Phaser.GameObjects.Rectangle;
  private modeText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    this._buildTopBar();
    this._buildCarryIndicator();
    this._buildModeBadge();
    this._buildControlHints();
    this._listenEvents();
  }

  // ─── Kurulum ──────────────────────────────────────────────────────────────

  private _buildTopBar(): void {
    this.add.rectangle(GAME_WIDTH / 2, 22, GAME_WIDTH, 44, 0x000000, 0.65);

    this.levelText = this.add.text(14, 10, 'Level 1', {
      fontSize: '14px', color: '#cccccc', fontStyle: 'bold',
    });

    // Kalan kutu sayacı — level etiketinin altında
    this.boxesText = this.add.text(14, 28, 'Kalan: —', {
      fontSize: '11px', color: '#88aacc',
    });

    this.timerText = this.add.text(GAME_WIDTH / 2, 6, '2:00', {
      fontSize: '24px', color: '#44ff88', fontStyle: 'bold',
      stroke: '#002200', strokeThickness: 4,
    }).setOrigin(0.5, 0);

    this.scoreText = this.add.text(GAME_WIDTH - 14, 10, 'Skor: 0', {
      fontSize: '15px', color: '#f5c542',
    }).setOrigin(1, 0);
  }

  private _buildCarryIndicator(): void {
    const px = 14, py = GAME_HEIGHT - 50;
    this.carryBg  = this.add.rectangle(px + 72, py + 14, 148, 32, 0x000000, 0.7).setOrigin(0.5);
    this.carryDot = this.add.circle(px + 8,  py + 14, 8, 0x888888).setStrokeStyle(2, 0xffffff, 0.4);
    this.carryLabel = this.add.text(px + 22, py + 7, 'Boş el', { fontSize: '13px', color: '#888888' });
  }

  private _buildModeBadge(): void {
    const px = GAME_WIDTH - 14, py = GAME_HEIGHT - 50;
    this.modeBadge = this.add.rectangle(px - 58, py + 14, 120, 32, 0x223322, 0.85).setOrigin(0.5);
    this.modeText  = this.add.text(px - 58, py + 14, '🚶 YÜRÜYÜŞ', {
      fontSize: '12px', color: '#aaddff', fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private _buildControlHints(): void {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 4,
      'WASD · SPACE: al/bırak · E: forklift · SHIFT: yavaş', {
      fontSize: '9px', color: '#444466',
    }).setOrigin(0.5, 1);
  }

  // ─── Event dinleyiciler ───────────────────────────────────────────────────

  private _listenEvents(): void {
    const game = this.scene.get('GameScene');

    game.events.on('timerUpdate', (remaining: number) => {
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      this.timerText.setText(`${m}:${String(s).padStart(2, '0')}`);

      if (remaining <= 10) {
        this.timerText.setStyle({ color: '#ff2222' });
        this._pulseTimer();
      } else if (remaining <= 30) {
        this.timerText.setStyle({ color: '#ff8844' });
      } else {
        this.timerText.setStyle({ color: '#44ff88' });
      }
    });

    game.events.on('scoreUpdate', (score: number) => {
      this.scoreText.setText(`Skor: ${score}`);
      this.tweens.add({
        targets: this.scoreText, scaleX: 1.15, scaleY: 1.15,
        duration: 80, yoyo: true,
      });
    });

    game.events.on('levelUpdate', (level: number) => {
      this.levelText.setText(`Level ${level}`);
    });

    game.events.on('boxesUpdate', (remaining: number, total: number) => {
      this.boxesText.setText(`Kalan: ${remaining}/${total}`);
      const pct = remaining / total;
      const color = pct <= 0.25 ? '#44ff88' : pct <= 0.5 ? '#f5c542' : '#88aacc';
      this.boxesText.setStyle({ color });
      this.tweens.add({
        targets: this.boxesText, scaleX: 1.2, scaleY: 1.2,
        duration: 70, yoyo: true,
      });
    });

    game.events.on('carryUpdate', (type: BeerType | null) => {
      this._updateCarryIndicator(type);
    });

    game.events.on('modeUpdate', (mode: 'foot' | 'forklift') => {
      this._updateModeBadge(mode);
    });
  }

  // ─── Güncelleme ───────────────────────────────────────────────────────────

  private _updateCarryIndicator(type: BeerType | null): void {
    if (type) {
      const color = BEER_COLORS[type];
      this.carryDot.setFillStyle(color).setStrokeStyle(2, 0xffffff, 0.8);
      this.carryLabel.setText(TYPE_TR[type]).setStyle({ color: '#ffffff' });
      this.carryBg.setFillStyle(color, 0.25);
      this.tweens.add({
        targets: [this.carryDot, this.carryLabel],
        scaleX: 1.2, scaleY: 1.2, duration: 80, yoyo: true,
      });
    } else {
      this.carryDot.setFillStyle(0x888888).setStrokeStyle(2, 0x888888, 0.4);
      this.carryLabel.setText('Boş el').setStyle({ color: '#888888' });
      this.carryBg.setFillStyle(0x000000, 0.7);
    }
  }

  private _updateModeBadge(mode: 'foot' | 'forklift'): void {
    if (mode === 'forklift') {
      this.modeBadge.setFillStyle(0x443311, 0.9);
      this.modeText.setText('🚜 FORKLİFT').setStyle({ color: '#ffcc44' });
    } else {
      this.modeBadge.setFillStyle(0x223322, 0.85);
      this.modeText.setText('🚶 YÜRÜYÜŞ').setStyle({ color: '#aaddff' });
    }
    this.tweens.add({
      targets: [this.modeBadge, this.modeText],
      scaleX: 1.1, scaleY: 1.1, duration: 100, yoyo: true,
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
