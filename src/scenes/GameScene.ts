import Phaser from 'phaser';
import { IsoWorld } from '../systems/IsoWorld';
import { InputHandler } from '../systems/InputHandler';
import { TimerSystem } from '../systems/TimerSystem';
import { LevelGenerator } from '../systems/LevelGenerator';
import { ScoreSystem } from '../systems/ScoreSystem';
import { IsoTile } from '../objects/IsoTile';
import { Player } from '../objects/Player';
import { Forklift } from '../objects/Forklift';
import { BeerBox } from '../objects/BeerBox';
import { Shelf } from '../objects/Shelf';
import { SoundSystem } from '../systems/SoundSystem';
import { AssetKeys } from '../utils/AssetKeys';
import { GAME_WIDTH, GAME_HEIGHT, MAP_WIDTH, MAP_HEIGHT, PENALTY_TIME, BEER_COLORS } from '../utils/Constants';
import { PLAYER_FRAME, FORKLIFT_FRAME } from '../utils/AnimationKeys';
import type { BeerType, LevelConfig } from '../types';

export class GameScene extends Phaser.Scene {
  private world!: IsoWorld;
  private input_!: InputHandler;
  private timer!: TimerSystem;
  private score!: ScoreSystem;

  private player!: Player;
  private forklift!: Forklift;
  private boxes: BeerBox[] = [];
  private shelves: Shelf[] = [];

  private carriedBox: BeerBox | null = null;
  private drivingForklift: boolean = false;
  private forkliftBoxes: BeerBox[] = [];

  private sound_!: SoundSystem;
  private level: number = 1;
  private totalBoxes: number = 0;
  private deliveredBoxes: number = 0;
  private levelConfig!: LevelConfig;
  private timerWarningPlayed: boolean = false;

  /** Intro countdown devam ederken input kilitli. */
  private introActive: boolean = true;

  private highlight!: Phaser.GameObjects.Ellipse;
  private actionHint!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.level = this.registry.get('level') ?? 1;
    this.boxes = [];
    this.shelves = [];
    this.carriedBox = null;
    this.drivingForklift = false;
    this.forkliftBoxes = [];
    this.deliveredBoxes = 0;
    this.introActive = true;

    this.sound_ = new SoundSystem();
    this.timerWarningPlayed = false;

    this.world = new IsoWorld(GAME_WIDTH, GAME_HEIGHT);
    this.input_ = new InputHandler(this);
    this.timer = new TimerSystem(this);
    this.score = new ScoreSystem();
    this.score.addPoints(this.registry.get('score') ?? 0);

    // UIScene'i buradan başlat — her level geçişinde UIScene yeniden başlar
    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene');
    }

    this._buildMap();

    const bonusTime: number = this.registry.get('bonusTime') ?? 0;
    this.levelConfig = LevelGenerator.buildConfig(this.level, bonusTime);
    this.totalBoxes = this.levelConfig.boxCount;

    this._spawnShelves(this.levelConfig);
    this._spawnBoxes(this.levelConfig);
    this._spawnActors();
    this._setupCamera();
    this._setupHighlight();

    this.events.emit('levelUpdate', this.level);
    this.events.emit('scoreUpdate', this.score.getScore());
    this.events.emit('boxesUpdate', this.totalBoxes, this.totalBoxes);
    this.events.emit('modeUpdate', 'foot');

    // Kamera fade-in, ardından intro
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.time.delayedCall(300, () => this._showLevelIntro(this.levelConfig, bonusTime));
  }

  update(_time: number, delta: number): void {
    if (this.introActive) return;

    if (this.drivingForklift) {
      this._updateForkliftMode(delta);
    } else {
      this._updateFootMode(delta);
    }

    this._updateHighlight();
  }

  // ─── Kurulum ──────────────────────────────────────────────────────────────

  private _buildMap(): void {
    for (let x = 0; x < MAP_WIDTH; x++) {
      for (let y = 0; y < MAP_HEIGHT; y++) {
        new IsoTile(this, this.world, x, y, AssetKeys.TILES.FLOOR);
      }
    }
  }

  private _spawnShelves(config: LevelConfig): void {
    for (const data of LevelGenerator.generateShelves(config)) {
      this.shelves.push(new Shelf(this, this.world, data));
      this.world.addBlockedTile(data.tileX, data.tileY);
    }
  }

  private _spawnBoxes(config: LevelConfig): void {
    const texMap: Record<BeerType, string> = {
      lager:   AssetKeys.BOXES.LAGER,
      ale:     AssetKeys.BOXES.ALE,
      stout:   AssetKeys.BOXES.STOUT,
      pilsner: AssetKeys.BOXES.PILSNER,
    };
    for (const pos of LevelGenerator.generateBoxPositions(config)) {
      this.boxes.push(new BeerBox(this, this.world, pos.tileX, pos.tileY, pos.type, texMap[pos.type]));
    }
  }

  private _spawnActors(): void {
    this.player = new Player(this, this.world, 1, 1);
    this.forklift = new Forklift(this, this.world, Math.floor(MAP_WIDTH / 2), Math.floor(MAP_HEIGHT / 2));
  }

  private _setupCamera(): void {
    const topLeft  = this.world.tileToScreen(0, 0);
    const botRight = this.world.tileToScreen(MAP_WIDTH - 1, MAP_HEIGHT - 1);
    const pad = 120;

    this.cameras.main.setBounds(
      topLeft.x - GAME_WIDTH / 2 - pad, topLeft.y - pad,
      botRight.x - topLeft.x + GAME_WIDTH + pad * 2,
      botRight.y - topLeft.y + GAME_HEIGHT + pad * 2
    );
    this.cameras.main.startFollow(
      this.player, true, 0.1, 0.1, 0, -PLAYER_FRAME.height * 0.45,
    );
  }

  private _setupHighlight(): void {
    this.highlight = this.add.ellipse(0, 0, 40, 20, 0xffffff, 0.3)
      .setDepth(0.05).setVisible(false);

    this.actionHint = this.add.text(0, 0, '', {
      fontSize: '10px', color: '#ffffff',
      backgroundColor: '#000000cc',
      padding: { x: 5, y: 3 },
    }).setOrigin(0.5, 1).setDepth(100).setVisible(false);
  }

  // ─── Level intro ──────────────────────────────────────────────────────────

  private _showLevelIntro(config: LevelConfig, bonusTime: number): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Overlay nesneleri — scrollFactor 0 = kameradan bağımsız
    const bg = this.add.rectangle(cx, cy, 320, 200, 0x000000, 0.82)
      .setScrollFactor(0).setDepth(500);

    const titleTxt = this.add.text(cx, cy - 68, `LEVEL  ${config.level}`, {
      fontSize: '34px', color: '#f5c542', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501);

    this.add.rectangle(cx, cy - 42, 260, 1, 0x888888, 0.5)
      .setScrollFactor(0).setDepth(501);

    const lines = [
      `🍺  ${config.boxCount} kutu`,
      `⏱  ${config.timeLimit} saniye`,
    ];
    if (bonusTime > 0) lines.push(`⭐  +${bonusTime}sn bonus eklendi!`);

    lines.forEach((line, i) => {
      this.add.text(cx, cy - 22 + i * 22, line, {
        fontSize: '14px', color: '#ffffff',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
    });

    // Geri sayım metni
    const countTxt = this.add.text(cx, cy + 66, '', {
      fontSize: '42px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501);

    // Intro nesneleri listesi (fade için)
    const introObjs = [bg, titleTxt, countTxt];

    let count = 3;
    const tick = (): void => {
      if (count > 0) {
        countTxt.setText(String(count));
        this.tweens.add({
          targets: countTxt,
          scaleX: { from: 1.4, to: 1 }, scaleY: { from: 1.4, to: 1 },
          duration: 600, ease: 'Back.easeOut',
        });
        count--;
        this.time.delayedCall(800, tick);
      } else {
        // BAŞLA!
        countTxt.setText('BAŞLA!').setStyle({ color: '#44ff88' });
        this.tweens.add({
          targets: countTxt,
          scaleX: { from: 1.6, to: 1 }, scaleY: { from: 1.6, to: 1 },
          duration: 300, ease: 'Back.easeOut',
        });

        // Timer başlat
        this.timer.start(
          config.timeLimit,
          (remaining) => {
            this.events.emit('timerUpdate', remaining);
            if (remaining <= 10 && !this.timerWarningPlayed) {
              this.timerWarningPlayed = true;
            }
            if (remaining <= 10) this.sound_.timerTick();
          },
          () => this._onTimeExpired()
        );
        this.events.emit('timerUpdate', config.timeLimit);
        this.introActive = false;

        // Overlay sil
        this.time.delayedCall(500, () => {
          this.tweens.add({
            targets: introObjs,
            alpha: 0, duration: 300,
            onComplete: () => introObjs.forEach(o => o.destroy()),
          });
        });
      }
    };

    // Küçük gecikmeyle başlat
    this.time.delayedCall(600, tick);
  }

  // ─── Güncelleme döngüleri ─────────────────────────────────────────────────

  private _updateFootMode(delta: number): void {
    this.player.update(this.input_, delta);

    if (this.carriedBox) {
      this.carriedBox.updatePosition(
        this.world, this.player.floatX, this.player.floatY, -(PLAYER_FRAME.height + 8),
      );
      this.carriedBox.setDepth(this.player.depth + 0.5);
    }

    if (this.input_.isSpaceJustDown()) this._footPickDrop();
    if (this.input_.isEJustDown())    this._tryMountForklift();
  }

  private _updateForkliftMode(delta: number): void {
    this.forklift.update(this.input_, delta);

    this.player.setPosition(this.forklift.x, this.forklift.y - 10);
    this.player.setDepth(this.forklift.depth + 0.1);

    if (this.input_.isSpaceJustDown()) this._forkliftPickDrop();
    if (this.input_.isEJustDown())    this._dismountForklift();
  }

  // ─── Highlight ────────────────────────────────────────────────────────────

  private _updateHighlight(): void {
    const target = this.drivingForklift
      ? this._nearbyForkliftInteractable()
      : this._nearbyFootInteractable();

    if (target) {
      this.highlight.setPosition(target.x, target.y).setVisible(true);
      this.actionHint.setPosition(target.x, target.y - 28)
        .setText(target.hint).setVisible(true);
    } else {
      this.highlight.setVisible(false);
      this.actionHint.setVisible(false);
    }
  }

  private _nearbyFootInteractable(): { x: number; y: number; hint: string } | null {
    const px = this.player.tileX, py = this.player.tileY;
    const near = (tx: number, ty: number) => Math.abs(tx - px) <= 1 && Math.abs(ty - py) <= 1;

    if (!this.carriedBox && near(this.forklift.tileX, this.forklift.tileY))
      return { x: this.forklift.x, y: this.forklift.y, hint: 'E: Bin' };

    if (!this.carriedBox) {
      const box = this.boxes.find(b => !b.isCarried && near(b.tileX, b.tileY));
      if (box) return { x: box.x, y: box.y, hint: 'SPACE: Al' };
    } else {
      const shelf = this.shelves.find(s => near(s.tileX, s.tileY));
      if (shelf) return { x: shelf.x, y: shelf.y, hint: 'SPACE: Bırak' };
    }
    return null;
  }

  private _nearbyForkliftInteractable(): { x: number; y: number; hint: string } | null {
    const fx = this.forklift.tileX, fy = this.forklift.tileY;
    const near = (tx: number, ty: number) => Math.abs(tx - fx) <= 1 && Math.abs(ty - fy) <= 1;

    if (!this.forklift.isFull()) {
      const box = this.boxes.find(b => !b.isCarried && near(b.tileX, b.tileY));
      if (box) return { x: box.x, y: box.y, hint: 'SPACE: Al' };
    }
    if (this.forklift.carriedCount > 0) {
      const shelf = this.shelves.find(s => near(s.tileX, s.tileY));
      if (shelf) return { x: shelf.x, y: shelf.y, hint: 'SPACE: Bırak' };
    }
    return { x: this.forklift.x, y: this.forklift.y - 10, hint: 'E: İn' };
  }

  // ─── Yürüyüş etkileşimi ───────────────────────────────────────────────────

  private _footPickDrop(): void {
    this.carriedBox ? this._footTryDrop() : this._footTryPick();
  }

  private _footTryPick(): void {
    const px = this.player.tileX, py = this.player.tileY;
    const box = this.boxes.find(b => !b.isCarried && Math.abs(b.tileX - px) <= 1 && Math.abs(b.tileY - py) <= 1);
    if (!box) return;
    box.isCarried = true;
    this.carriedBox = box;
    this.player.isCarrying = true;
    this.sound_.pickup();
    this.events.emit('carryUpdate', box.beerType);
    this._floatText(this.player.x, this.player.y - 40, '↑ AL', '#aaffaa');
  }

  private _footTryDrop(): void {
    if (!this.carriedBox) return;
    const px = this.player.tileX, py = this.player.tileY;
    const shelf = this.shelves.find(s => Math.abs(s.tileX - px) <= 1 && Math.abs(s.tileY - py) <= 1);

    if (shelf) {
      if (shelf.addBox(this.carriedBox.beerType)) {
        this._onBoxDelivered(this.carriedBox, this.player.x, this.player.y);
        this.carriedBox = null;
        this.player.isCarrying = false;
        this.events.emit('carryUpdate', null);
        this._checkLevelComplete();
        return;
      }
      this._penalize(this.player.x, this.player.y);
    }

    this.carriedBox.isCarried = false;
    this.carriedBox.updatePosition(this.world, this.player.tileX, this.player.tileY);
    this.carriedBox = null;
    this.player.isCarrying = false;
    this.events.emit('carryUpdate', null);
  }

  // ─── Forklift biniş/iniş ──────────────────────────────────────────────────

  private _tryMountForklift(): void {
    const px = this.player.tileX, py = this.player.tileY;
    if (Math.abs(this.forklift.tileX - px) > 1 || Math.abs(this.forklift.tileY - py) > 1) return;

    if (this.carriedBox) {
      this.forklift.addCarriedType(this.carriedBox.beerType);
      this.forkliftBoxes.push(this.carriedBox);
      this.carriedBox.setVisible(false);
      this.carriedBox = null;
      this.player.isCarrying = false;
    }

    this.drivingForklift = true;
    this.forklift.mount();
    this.sound_.forkliftMount();
    this.player.setVisible(false);
    this.cameras.main.startFollow(
      this.forklift, true, 0.1, 0.1, 0, -FORKLIFT_FRAME.height * 0.4,
    );
    this.events.emit('modeUpdate', 'forklift');
    this.events.emit('carryUpdate', null);
    this._floatText(this.forklift.x, this.forklift.y - 50, '🚜 FORKLİFT', '#ffcc00');
  }

  private _dismountForklift(): void {
    this.drivingForklift = false;
    this.forklift.dismount();
    this.sound_.forkliftDismount();
    this.player.setVisible(true);

    // Forklift'ten çıkarken raf tile'ına denk gelme ihtimaline karşı farklı yönleri dene
    const candidates = [
      { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
    ];
    const fx = this.forklift.floatX, fy = this.forklift.floatY;
    const off = candidates.find(c => !this.world.isTileBlocked(Math.round(fx + c.dx), Math.round(fy + c.dy)))
      ?? { dx: -1, dy: 0 };
    this.player.floatX = fx + off.dx;
    this.player.floatY = fy + off.dy;
    this.player.tileX = Math.round(this.player.floatX);
    this.player.tileY = Math.round(this.player.floatY);
    const { x, y } = this.world.tileToScreen(this.player.floatX, this.player.floatY);
    this.player.setPosition(x, y);

    this.cameras.main.startFollow(
      this.player, true, 0.1, 0.1, 0, -PLAYER_FRAME.height * 0.45,
    );
    this.events.emit('modeUpdate', 'foot');
    this._floatText(this.forklift.x, this.forklift.y - 50, '🚶 YÜRÜYÜŞ', '#aaddff');
  }

  // ─── Forklift etkileşimi ──────────────────────────────────────────────────

  private _forkliftPickDrop(): void {
    const fx = this.forklift.tileX, fy = this.forklift.tileY;
    const near = (tx: number, ty: number) => Math.abs(tx - fx) <= 1 && Math.abs(ty - fy) <= 1;

    if (this.forklift.carriedCount > 0) {
      const shelf = this.shelves.find(s => near(s.tileX, s.tileY));
      if (shelf) { this._forkliftDropOnShelf(shelf); return; }
    }

    if (!this.forklift.isFull()) {
      const box = this.boxes.find(b => !b.isCarried && near(b.tileX, b.tileY));
      if (box) {
        box.isCarried = true;
        box.setVisible(false);
        this.forkliftBoxes.push(box);
        this.forklift.addCarriedType(box.beerType);
        this.sound_.pickup();
        this._floatText(this.forklift.x, this.forklift.y - 55,
          `↑ AL (${this.forklift.carriedCount}/3)`, '#aaffaa');
        this.events.emit('carryUpdate', box.beerType);
      }
    }
  }

  private _forkliftDropOnShelf(shelf: Shelf): void {
    const matching = this.forkliftBoxes.filter(b => b.beerType === shelf.acceptedType);
    if (matching.length === 0) {
      this._penalize(this.forklift.x, this.forklift.y);
      this._forkliftDumpBoxes();
      return;
    }

    let delivered = 0;
    for (const box of matching) {
      if (!shelf.isFull() && shelf.addBox(box.beerType)) {
        this._onBoxDelivered(box, this.forklift.x, this.forklift.y);
        this.forkliftBoxes = this.forkliftBoxes.filter(b => b !== box);
        this.forklift.removeCarriedType(box.beerType);
        delivered++;
      }
    }

    if (delivered > 0) {
      this.events.emit('scoreUpdate', this.score.getScore());
      this._floatText(this.forklift.x, this.forklift.y - 55, `+${delivered * 100}`, '#f5c542');
      this.events.emit('carryUpdate', this.forklift.carriedCount > 0 ? this.forklift.getCarriedTypes()[0] : null);
      this._checkLevelComplete();
    }

    if (this.forklift.carriedCount > 0) this._forkliftDumpBoxes();
  }

  private _forkliftDumpBoxes(): void {
    let offset = 0;
    for (const box of [...this.forkliftBoxes]) {
      box.isCarried = false;
      box.setVisible(true);
      box.updatePosition(this.world,
        this.forklift.tileX + (offset % 2 === 0 ? -1 : 1),
        this.forklift.tileY + Math.floor(offset / 2)
      );
      offset++;
    }
    this.forkliftBoxes = [];
    const types = this.forklift.getCarriedTypes();
    for (const t of types) this.forklift.removeCarriedType(t);
    this.events.emit('carryUpdate', null);
  }

  // ─── Ortak yardımcılar ────────────────────────────────────────────────────

  private _onBoxDelivered(box: BeerBox, cx: number, cy: number): void {
    this.deliveredBoxes++;
    const boxColor = BEER_COLORS[box.beerType];
    this._destroyBox(box);
    this.score.addPoints(100);
    this.sound_.deliver();
    this.events.emit('scoreUpdate', this.score.getScore());
    this.events.emit('boxesUpdate', this.totalBoxes - this.deliveredBoxes, this.totalBoxes);
    this._floatText(cx, cy - 40, '+100', '#f5c542');
    this._burst(cx, cy - 20, boxColor);
  }

  private _destroyBox(box: BeerBox): void {
    this.boxes = this.boxes.filter(b => b !== box);
    box.destroy();
  }

  private _penalize(cx: number, cy: number): void {
    this.timer.addTime(-PENALTY_TIME);
    this.sound_.wrongShelf();
    this.cameras.main.flash(200, 255, 80, 80);
    this.cameras.main.shake(150, 0.005);
    this._floatText(cx, cy - 40, `-${PENALTY_TIME} SN!`, '#ff4444');
  }

  /** Teslim parçacığı patlaması — renkli küçük kareler dışa fırlar. */
  private _burst(cx: number, cy: number, color: number): void {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 28 + Math.random() * 22;
      const p = this.add.rectangle(cx, cy, 5, 5, color)
        .setDepth(210).setAlpha(0.9);
      this.tweens.add({
        targets: p,
        x: cx + Math.cos(angle) * speed,
        y: cy + Math.sin(angle) * speed - 10,
        alpha: 0,
        scaleX: 0.2, scaleY: 0.2,
        duration: 420,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  private _floatText(x: number, y: number, msg: string, color: string): void {
    const t = this.add.text(x, y, msg, {
      fontSize: '14px', color, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(200);

    this.tweens.add({
      targets: t, y: y - 40, alpha: 0,
      duration: 900, ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  // ─── Level akışı ──────────────────────────────────────────────────────────

  private _checkLevelComplete(): void {
    if (!this.shelves.every(s => s.isFull())) return;

    this.timer.stop();
    const remaining = this.timer.getRemaining();
    const { points, bonusTime } = this.score.calcLevelBonus(remaining);
    this.score.addPoints(points);

    const prevHigh = this.score.getHighScore();
    this.score.saveHighScore();
    const isNewHighScore = this.score.getScore() > prevHigh;

    this.registry.set('bonusTime', bonusTime);
    this.registry.set('score', this.score.getScore());

    this.sound_.levelComplete();
    this.cameras.main.flash(400, 100, 255, 100);
    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(350, () => {
        this.scene.stop('UIScene');
        this.scene.launch('GameOverScene', {
          win: true,
          score: this.score.getScore(),
          level: this.level,
          delivered: this.deliveredBoxes,
          total: this.totalBoxes,
          bonusEarned: bonusTime,
          isNewHighScore,
        });
      });
    });
  }

  private _onTimeExpired(): void {
    const prevHigh = this.score.getHighScore();
    this.score.saveHighScore();
    const isNewHighScore = this.score.getScore() > prevHigh;

    this.cameras.main.flash(300, 255, 50, 50);
    this.time.delayedCall(400, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(350, () => {
        this.scene.stop('UIScene');
        this.scene.launch('GameOverScene', {
          win: false,
          score: this.score.getScore(),
          level: this.level,
          delivered: this.deliveredBoxes,
          total: this.totalBoxes,
          bonusEarned: 0,
          isNewHighScore,
        });
      });
    });
  }
}
