import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_WIDTH, TILE_HEIGHT, BEER_COLORS } from '../utils/Constants';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SoundSystem } from '../systems/SoundSystem';
import { isoToScreen } from '../utils/IsoUtils';

const MEDALS = ['🥇', '🥈', '🥉'];

export class MenuScene extends Phaser.Scene {
  private sound_!: SoundSystem;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.sound_ = new SoundSystem();
    this.cameras.main.fadeIn(500, 0, 0, 0);

    this._buildBackground();
    this._buildFloatingBoxes();
    this._buildTitle();
    this._buildScoreTable();
    this._buildStartButton();
    this._buildFooter();
  }

  // ─── Arka plan ────────────────────────────────────────────────────────────

  private _buildBackground(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d0d1a);

    // İzometrik ızgara zemin efekti
    const g = this.add.graphics();
    g.lineStyle(1, 0x1a1a33, 0.6);
    const cols = 10, rows = 8;
    const ox = GAME_WIDTH / 2, oy = 40;

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const s = isoToScreen(x, y);
        const pts = [
          { x: s.x + ox,                    y: s.y + oy + TILE_HEIGHT / 2 },
          { x: s.x + ox + TILE_WIDTH / 2,   y: s.y + oy },
          { x: s.x + ox + TILE_WIDTH,       y: s.y + oy + TILE_HEIGHT / 2 },
          { x: s.x + ox + TILE_WIDTH / 2,   y: s.y + oy + TILE_HEIGHT },
        ];
        g.strokePoints(pts, true);
      }
    }
    g.setAlpha(0.4);
  }

  private _buildFloatingBoxes(): void {
    const types = Object.values(BEER_COLORS);
    for (let i = 0; i < 6; i++) {
      const color = types[i % types.length];
      const x = 60 + Math.random() * (GAME_WIDTH - 120);
      const y = 80 + Math.random() * (GAME_HEIGHT - 160);
      const box = this.add.rectangle(x, y, 22, 18, color, 0.18)
        .setStrokeStyle(1, color, 0.4);

      this.tweens.add({
        targets: box,
        y: y - 18 - Math.random() * 20,
        alpha: { from: 0.08, to: 0.28 },
        duration: 2200 + Math.random() * 1800,
        yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 1500,
      });
    }
  }

  // ─── Başlık ───────────────────────────────────────────────────────────────

  private _buildTitle(): void {
    const cx = GAME_WIDTH / 2;

    this.add.text(cx + 2, 88, 'BEERCAN', {
      fontFamily: "'Press Start 2P'", fontSize: '26px', color: '#7a6200',
    }).setOrigin(0.5).setAlpha(0.5);

    const title = this.add.text(cx, 86, 'BEERCAN', {
      fontFamily: "'Press Start 2P'", fontSize: '26px', color: '#f5c542',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scaleX: 1.02, scaleY: 1.02,
      duration: 1800, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.text(cx, 128, 'L O G I S T I C S', {
      fontFamily: "'Press Start 2P'", fontSize: '11px', color: '#aaaacc',
    }).setOrigin(0.5);

    const line = this.add.graphics();
    line.lineStyle(1, 0x444466, 0.8);
    line.lineBetween(cx - 160, 154, cx + 160, 154);
  }

  // ─── Skor tablosu ─────────────────────────────────────────────────────────

  private _buildScoreTable(): void {
    const cx = GAME_WIDTH / 2;
    const ss = new ScoreSystem();
    const top = ss.getTopScores();

    if (top.length === 0) {
      this.add.text(cx, 196, 'Henüz skor yok!', {
        fontFamily: "'Press Start 2P'", fontSize: '9px', color: '#555577',
      }).setOrigin(0.5);
      return;
    }

    this.add.text(cx, 180, 'EN YÜKSEK SKORLAR', {
      fontFamily: "'Press Start 2P'", fontSize: '8px', color: '#666688',
    }).setOrigin(0.5);

    const rowH   = 32;
    const panelH = top.length * rowH + 24;
    const panelY = 218 + (top.length - 1) * rowH / 2;

    this.add.rectangle(cx, panelY, 300, panelH, 0x111122, 0.8).setOrigin(0.5);

    top.forEach((score, i) => {
      const y = 210 + i * rowH;
      const isFirst = i === 0;
      this.add.text(cx - 130, y, `${MEDALS[i] ?? '  '} #${i + 1}`, {
        fontFamily: "'Press Start 2P'",
        fontSize: isFirst ? '9px' : '8px',
        color: isFirst ? '#f5c542' : '#888888',
      }).setOrigin(0, 0.5);
      this.add.text(cx + 130, y, score.toLocaleString(), {
        fontFamily: "'Press Start 2P'",
        fontSize: isFirst ? '9px' : '8px',
        color: isFirst ? '#f5c542' : '#aaaaaa',
      }).setOrigin(1, 0.5);
    });
  }

  // ─── Başlat butonu ────────────────────────────────────────────────────────

  private _buildStartButton(): void {
    const cx = GAME_WIDTH / 2;
    const ss = new ScoreSystem();
    const hasScore = ss.getTopScores().length > 0;
    const btnY = hasScore ? 400 : 310;

    const btnBg = this.add.rectangle(cx, btnY, 260, 52, 0x224422, 0.9)
      .setStrokeStyle(1, 0x44ff88, 0.7);

    const btn = this.add.text(cx, btnY, '▶  BAŞLA', {
      fontFamily: "'Press Start 2P'", fontSize: '13px', color: '#44ff88',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setStyle({ color: '#aaffcc' });
      btnBg.setFillStyle(0x336633, 0.95);
      this.sound_.menuSelect();
    });
    btn.on('pointerout', () => {
      btn.setStyle({ color: '#44ff88' });
      btnBg.setFillStyle(0x224422, 0.9);
    });
    btn.on('pointerdown', () => this._startGame());

    const hint = this.add.text(cx, btnY + 38, 'SPACE  veya  ENTER', {
      fontFamily: "'Press Start 2P'", fontSize: '7px', color: '#335533',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: hint, alpha: 0.15,
      duration: 800, yoyo: true, repeat: -1,
    });

    this.input.keyboard!.once('keydown-SPACE', () => this._startGame());
    this.input.keyboard!.once('keydown-ENTER', () => this._startGame());
  }

  private _buildFooter(): void {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 12,
      'v0.6-beta', {
      fontFamily: "'Press Start 2P'", fontSize: '6px', color: '#2a2a44',
    }).setOrigin(0.5, 1);
  }

  private _startGame(): void {
    this.sound_.menuSelect();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(320, () => {
      this.registry.set('level', 1);
      this.registry.set('score', 0);
      this.registry.set('bonusTime', 0);
      this.scene.stop('UIScene');
      this.scene.start('GameScene');
    });
  }
}
