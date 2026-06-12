import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SoundSystem } from '../systems/SoundSystem';

const MEDALS = ['🥇', '🥈', '🥉'];

interface GameOverData {
  win: boolean;
  score: number;
  level: number;
  delivered: number;
  total: number;
  bonusEarned: number;
  isNewHighScore: boolean;
}

export class GameOverScene extends Phaser.Scene {
  private sound_!: SoundSystem;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    this.sound_ = new SoundSystem();
    this.cameras.main.fadeIn(350, 0, 0, 0);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Koyu overlay
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.88);

    if (data.win) {
      this._buildWinScreen(cx, cy, data);
    } else {
      this._buildLoseScreen(cx, cy, data);
    }
  }

  // ─── Win ──────────────────────────────────────────────────────────────────

  private _buildWinScreen(cx: number, cy: number, data: GameOverData): void {
    // Başlık
    this.add.text(cx, cy - 120, '✓ LEVEL TAMAMLANDI!', {
      fontSize: '30px', color: '#44ff88', fontStyle: 'bold',
      stroke: '#003300', strokeThickness: 3,
    }).setOrigin(0.5);

    this._showLevelBadge(cx, cy - 78, data.level);

    // Yeni rekor
    if (data.isNewHighScore) {
      const rec = this.add.text(cx, cy - 42, '🏆 YENİ REKOR!', {
        fontSize: '18px', color: '#f5c542', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.tweens.add({
        targets: rec,
        scaleX: 1.1, scaleY: 1.1, duration: 400,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    // İstatistikler
    this._buildStatsBox(cx, cy, [
      { label: 'Teslim edilen', value: `${data.delivered} / ${data.total} kutu` },
      { label: 'Skor',          value: String(data.score), highlight: true },
      { label: 'Bonus süre',   value: data.bonusEarned > 0 ? `+${data.bonusEarned} sn → sonraki level` : '—' },
    ]);

    // Butonlar
    this._buildTopScores(cx, cy + 100);

    this._buildButton(cx, cy + 152, '[ SONRAKİ LEVEL  › ]', '#44ff88',
      () => this._nextLevel(data.level + 1, data.score));
    this._buildButton(cx, cy + 188, '[ Ana Menü ]', '#888888', () => this._menu());

    this.input.keyboard!.once('keydown-SPACE', () => this._nextLevel(data.level + 1, data.score));
    this.input.keyboard!.once('keydown-ESCAPE', () => this._menu());
  }

  // ─── Lose ─────────────────────────────────────────────────────────────────

  private _buildLoseScreen(cx: number, cy: number, data: GameOverData): void {
    this.add.text(cx, cy - 120, '✗ SÜRE DOLDU!', {
      fontSize: '30px', color: '#ff4444', fontStyle: 'bold',
      stroke: '#330000', strokeThickness: 3,
    }).setOrigin(0.5);

    this._showLevelBadge(cx, cy - 78, data.level);

    if (data.isNewHighScore) {
      const rec = this.add.text(cx, cy - 42, '🏆 YENİ REKOR!', {
        fontSize: '18px', color: '#f5c542', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.tweens.add({
        targets: rec,
        scaleX: 1.1, scaleY: 1.1, duration: 400,
        yoyo: true, repeat: -1,
      });
    }

    this._buildStatsBox(cx, cy, [
      { label: 'Teslim edilen', value: `${data.delivered} / ${data.total} kutu` },
      { label: 'Skor',          value: String(data.score), highlight: true },
    ]);

    this._buildTopScores(cx, cy + 100);

    this._buildButton(cx, cy + 152, '[ TEKRAR DENE ]', '#ff8844', () => this._restart());
    this._buildButton(cx, cy + 188, '[ Ana Menü ]',    '#888888', () => this._menu());

    this.input.keyboard!.once('keydown-SPACE', () => this._restart());
    this.input.keyboard!.once('keydown-ESCAPE', () => this._menu());
  }

  // ─── Ortak bileşenler ─────────────────────────────────────────────────────

  private _showLevelBadge(cx: number, y: number, level: number): void {
    this.add.rectangle(cx, y, 130, 28, 0x333355, 0.9).setOrigin(0.5);
    this.add.text(cx, y, `LEVEL  ${level}`, {
      fontSize: '15px', color: '#aaaacc',
    }).setOrigin(0.5);
  }

  private _buildStatsBox(
    cx: number, cy: number,
    rows: { label: string; value: string; highlight?: boolean }[]
  ): void {
    const boxH = rows.length * 26 + 20;
    this.add.rectangle(cx, cy, 300, boxH, 0x111122, 0.85).setOrigin(0.5);

    rows.forEach((row, i) => {
      const y = cy - boxH / 2 + 18 + i * 26;
      this.add.text(cx - 130, y, row.label, {
        fontSize: '13px', color: '#999999',
      }).setOrigin(0, 0.5);
      this.add.text(cx + 130, y, row.value, {
        fontSize: '13px',
        color: row.highlight ? '#f5c542' : '#ffffff',
        fontStyle: row.highlight ? 'bold' : 'normal',
      }).setOrigin(1, 0.5);
    });
  }

  private _buildTopScores(cx: number, y: number): void {
    const top = new ScoreSystem().getTopScores();
    if (top.length === 0) return;

    this.add.rectangle(cx, y + 18, 280, 14 + top.length * 20, 0x111122, 0.75).setOrigin(0.5);
    this.add.text(cx, y + 4, 'EN YÜKSEK SKORLAR', {
      fontSize: '9px', color: '#555577',
    }).setOrigin(0.5);

    top.forEach((s, i) => {
      const ry = y + 18 + i * 20;
      this.add.text(cx - 120, ry, `${MEDALS[i] ?? '  '} #${i + 1}`, {
        fontSize: '12px', color: i === 0 ? '#f5c542' : '#777777',
      }).setOrigin(0, 0.5);
      this.add.text(cx + 120, ry, s.toLocaleString(), {
        fontSize: '12px', color: i === 0 ? '#f5c542' : '#999999',
      }).setOrigin(1, 0.5);
    });
  }

  private _buildButton(cx: number, y: number, label: string, color: string, cb: () => void): void {
    const btn = this.add.text(cx, y, label, {
      fontSize: '18px', color,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover',  () => { btn.setAlpha(0.7); this.sound_.menuSelect(); });
    btn.on('pointerout',   () => btn.setAlpha(1));
    btn.on('pointerdown',  cb);
  }

  // ─── Geçişler ─────────────────────────────────────────────────────────────

  private _nextLevel(level: number, score: number): void {
    this.registry.set('level', level);
    this.registry.set('score', score);
    this._transitionTo(() => {
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('GameScene');
    });
  }

  private _restart(): void {
    this.registry.set('level', 1);
    this.registry.set('score', 0);
    this.registry.set('bonusTime', 0);
    this._transitionTo(() => {
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('GameScene');
    });
  }

  private _menu(): void {
    this._transitionTo(() => {
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('MenuScene');
    });
  }

  private _transitionTo(cb: () => void): void {
    // Tekrar basışları engelle
    this.input.keyboard!.removeAllListeners();
    this.input.removeAllListeners();

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(320, cb);
  }
}
