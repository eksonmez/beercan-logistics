import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_WIDTH, TILE_HEIGHT } from '../utils/Constants';
import { AssetKeys } from '../utils/AssetKeys';
import {
  ISO_DIRECTIONS,
  PlayerAnims,
  ForkliftAnims,
  PLAYER_FRAME,
  type IsoDirection,
} from '../utils/AnimationKeys';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this._showLoadingBar();
    this._loadSpriteSheets();
  }

  create(): void {
    this._createProceduralTextures();
    this._registerAnimations();
    this.scene.start('MenuScene');
  }

  private _showLoadingBar(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const bg = this.add.graphics();
    const bar = this.add.graphics();
    bg.fillStyle(0x222222).fillRect(cx - 160, cy - 15, 320, 30);
    this.load.on('progress', (v: number) => {
      bar.clear().fillStyle(0x44aa44).fillRect(cx - 158, cy - 13, 316 * v, 26);
    });
    this.add.text(cx, cy - 40, 'Yükleniyor...', { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
  }

  private _loadSpriteSheets(): void {
    this.load.spritesheet(AssetKeys.PLAYER.SHEET, '/assets/sprites/player/player_sheet.png', {
      frameWidth: PLAYER_FRAME.width,
      frameHeight: PLAYER_FRAME.height,
    });
    // Forklift sheet procedural olarak _createProceduralTextures'da oluşturuluyor

    // Aseprite PNG'leri — yön başına ayrı texture
    this.load.image(AssetKeys.PLAYER.IDLE_PNG,     '/assets/sprites/player/player_idle.png');
    this.load.image(AssetKeys.PLAYER.CARRY_SE_PNG, '/assets/sprites/player/player_carry_se.png');
    this.load.image(AssetKeys.PLAYER.CARRY_NE_PNG, '/assets/sprites/player/player_carry_ne.png');
    this.load.spritesheet(AssetKeys.PLAYER.WALK_SE_PNG, '/assets/sprites/player/player_walk_se.png', {
      frameWidth: PLAYER_FRAME.width,
      frameHeight: PLAYER_FRAME.height,
    });
    this.load.spritesheet(AssetKeys.PLAYER.WALK_NE_PNG, '/assets/sprites/player/player_walk_ne.png', {
      frameWidth: PLAYER_FRAME.width,
      frameHeight: PLAYER_FRAME.height,
    });

    // Boxes (4 tip) — aynı key'i ezdir, procedural _makeIsoCube kaldırıldı
    this.load.image(AssetKeys.BOXES.LAGER,   '/assets/sprites/boxes/box_lager.png');
    this.load.image(AssetKeys.BOXES.ALE,     '/assets/sprites/boxes/box_ale.png');
    this.load.image(AssetKeys.BOXES.STOUT,   '/assets/sprites/boxes/box_stout.png');
    this.load.image(AssetKeys.BOXES.PILSNER, '/assets/sprites/boxes/box_pilsner.png');

    // Zemin + raf base — aynı key'i ezdir
    this.load.image(AssetKeys.TILES.FLOOR,       '/assets/sprites/tiles/floor.png');
    this.load.image(AssetKeys.TILES.SHELF_BASE,  '/assets/sprites/tiles/shelf.png');

    // Forklift (4 yön) — per-direction PNG, procedural _makeForkliftSheet kaldırıldı
    this.load.image(AssetKeys.FORKLIFT.NE_PNG, '/assets/sprites/forklift/forklift_ne.png');
    this.load.image(AssetKeys.FORKLIFT.SE_PNG, '/assets/sprites/forklift/forklift_se.png');
    this.load.image(AssetKeys.FORKLIFT.SW_PNG, '/assets/sprites/forklift/forklift_sw.png');
    this.load.image(AssetKeys.FORKLIFT.NW_PNG, '/assets/sprites/forklift/forklift_nw.png');
  }

  private _registerAnimations(): void {
    // ne/nw → ne PNG kullan, se/sw → se PNG kullan (sw/nw runtime'da flipX ile aynalanır)
    const walkSheetFor = (dir: IsoDirection) =>
      (dir === 'ne' || dir === 'nw') ? AssetKeys.PLAYER.WALK_NE_PNG : AssetKeys.PLAYER.WALK_SE_PNG;
    const carryTexFor = (dir: IsoDirection) =>
      (dir === 'ne' || dir === 'nw') ? AssetKeys.PLAYER.CARRY_NE_PNG : AssetKeys.PLAYER.CARRY_SE_PNG;

    for (const dir of ISO_DIRECTIONS) {
      this.anims.create({
        key: PlayerAnims.idle(dir),
        frames: [{ key: AssetKeys.PLAYER.IDLE_PNG }],
        frameRate: 1,
      });
      this.anims.create({
        key: PlayerAnims.walk(dir),
        frames: this.anims.generateFrameNumbers(walkSheetFor(dir), { start: 0, end: 2 }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: PlayerAnims.carry(dir),
        frames: [{ key: carryTexFor(dir) }],
        frameRate: 1,
      });

      const forkliftKey = {
        ne: AssetKeys.FORKLIFT.NE_PNG,
        se: AssetKeys.FORKLIFT.SE_PNG,
        sw: AssetKeys.FORKLIFT.SW_PNG,
        nw: AssetKeys.FORKLIFT.NW_PNG,
      }[dir];
      this.anims.create({
        key: ForkliftAnims.idle(dir),
        frames: [{ key: forkliftKey }],
        frameRate: 1,
      });
      this.anims.create({
        key: ForkliftAnims.move(dir),
        frames: [{ key: forkliftKey }],
        frameRate: 1,
      });
    }
  }

  private _createProceduralTextures(): void {
    // FLOOR ve SHELF_BASE artık PNG'den yükleniyor — procedural sadece WALL için
    this._makeTile(AssetKeys.TILES.WALL,       0x8b5e2a, 0x6b4018, 0x4d2c0a);

    // 5 zemin paleti (level eşiklerine göre)
    this._makeTile(AssetKeys.TILES.FLOOR_P0, 0xd4a843, 0xb08830, 0x8c6a20, 0xe8c84a); // sarı-sıcak
    this._makeTile(AssetKeys.TILES.FLOOR_P1, 0xc07830, 0x9a5820, 0x7a3a10, 0xe8a030); // turuncu
    this._makeTile(AssetKeys.TILES.FLOOR_P2, 0x4a6fa5, 0x3a5585, 0x2a3f6a, 0x7a9fd4); // mavi-gri
    this._makeTile(AssetKeys.TILES.FLOOR_P3, 0x5a3a7a, 0x422a5a, 0x2e1a40, 0x8a60cc); // mor-karanlık
    this._makeTile(AssetKeys.TILES.FLOOR_P4, 0x8b2020, 0x6b1818, 0x4d0e0e, 0xcc4444); // kırmızı-alarm

    // Konveyör bant tile'ları
    this._makeConveyorTile(AssetKeys.TILES.CONVEYOR_H, true);
    this._makeConveyorTile(AssetKeys.TILES.CONVEYOR_V, false);

    // Kaygan zemin tile
    this._makeSlipperyTile(AssetKeys.TILES.SLIPPERY);

    // Boxes ve forklift artık PNG'den yükleniyor — procedural üretim atlandı
  }

  /** İzometrik diamond zemin tile — üst yüz + iki yan yüz. */
  private _makeTile(key: string, top: number, left: number, right: number, stripeColor?: number): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const w = TILE_WIDTH;
    const h = TILE_HEIGHT;
    const d = 10;

    g.fillStyle(top);
    g.fillPoints([
      { x: w / 2, y: 0 },
      { x: w,     y: h / 2 },
      { x: w / 2, y: h },
      { x: 0,     y: h / 2 },
    ], true);

    g.fillStyle(left);
    g.fillPoints([
      { x: 0,     y: h / 2 },
      { x: w / 2, y: h },
      { x: w / 2, y: h + d },
      { x: 0,     y: h / 2 + d },
    ], true);

    g.fillStyle(right);
    g.fillPoints([
      { x: w / 2, y: h },
      { x: w,     y: h / 2 },
      { x: w,     y: h / 2 + d },
      { x: w / 2, y: h + d },
    ], true);

    // Şerit rengi verilmişse depo yer işareti çiz
    if (stripeColor !== undefined) {
      g.lineStyle(2, stripeColor, 0.55);
      g.lineBetween(w * 0.18, h * 0.59, w * 0.5, h * 0.28);
      g.lineBetween(w * 0.5, h * 0.72, w * 0.82, h * 0.41);
    }

    g.lineStyle(1, 0x000000, 0.4);
    g.strokePoints([
      { x: w / 2, y: 0 }, { x: w, y: h / 2 }, { x: w / 2, y: h }, { x: 0, y: h / 2 },
    ], true);
    g.strokePoints([
      { x: 0, y: h / 2 }, { x: 0, y: h / 2 + d }, { x: w / 2, y: h + d }, { x: w / 2, y: h },
    ], false);
    g.strokePoints([
      { x: w, y: h / 2 }, { x: w, y: h / 2 + d }, { x: w / 2, y: h + d },
    ], false);

    g.generateTexture(key, w, h + d);
    g.destroy();
  }

  /** Konveyör bant tile — sarı ok işaretli zemin. */
  private _makeConveyorTile(key: string, horizontal: boolean): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const w = TILE_WIDTH;
    const h = TILE_HEIGHT;
    const d = 10;

    // Koyu sarı-turuncu üst yüz
    g.fillStyle(0xb8900a);
    g.fillPoints([
      { x: w / 2, y: 0 }, { x: w, y: h / 2 }, { x: w / 2, y: h }, { x: 0, y: h / 2 },
    ], true);
    g.fillStyle(0x8a6808);
    g.fillPoints([
      { x: 0, y: h / 2 }, { x: w / 2, y: h }, { x: w / 2, y: h + d }, { x: 0, y: h / 2 + d },
    ], true);
    g.fillStyle(0x6a5005);
    g.fillPoints([
      { x: w / 2, y: h }, { x: w, y: h / 2 }, { x: w, y: h / 2 + d }, { x: w / 2, y: h + d },
    ], true);

    // Ok işaretleri
    g.lineStyle(2, 0xffdd00, 0.9);
    if (horizontal) {
      // Sağa ok (ne yönü)
      const midY = h / 2;
      g.lineBetween(w * 0.28, midY + 2, w * 0.55, midY - 5);
      g.lineBetween(w * 0.55, midY - 5, w * 0.45, midY - 1);
      g.lineBetween(w * 0.55, midY - 5, w * 0.5, midY);
    } else {
      // Güneye ok (se yönü)
      const midX = w / 2;
      g.lineBetween(midX - 8, h * 0.35, midX, h * 0.65);
      g.lineBetween(midX, h * 0.65, midX - 4, h * 0.55);
      g.lineBetween(midX, h * 0.65, midX + 4, h * 0.52);
    }

    g.lineStyle(1, 0x000000, 0.4);
    g.strokePoints([
      { x: w / 2, y: 0 }, { x: w, y: h / 2 }, { x: w / 2, y: h }, { x: 0, y: h / 2 },
    ], true);

    g.generateTexture(key, w, h + d);
    g.destroy();
  }

  /** Kaygan zemin tile — açık mavi buzlu görünüm. */
  private _makeSlipperyTile(key: string): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const w = TILE_WIDTH;
    const h = TILE_HEIGHT;
    const d = 10;

    g.fillStyle(0x8ad4f0);
    g.fillPoints([
      { x: w / 2, y: 0 }, { x: w, y: h / 2 }, { x: w / 2, y: h }, { x: 0, y: h / 2 },
    ], true);
    g.fillStyle(0x5aa8cc);
    g.fillPoints([
      { x: 0, y: h / 2 }, { x: w / 2, y: h }, { x: w / 2, y: h + d }, { x: 0, y: h / 2 + d },
    ], true);
    g.fillStyle(0x3a80a8);
    g.fillPoints([
      { x: w / 2, y: h }, { x: w, y: h / 2 }, { x: w, y: h / 2 + d }, { x: w / 2, y: h + d },
    ], true);

    // Buz parıltısı çizgileri
    g.lineStyle(1, 0xeef8ff, 0.65);
    g.lineBetween(w * 0.3, h * 0.38, w * 0.5, h * 0.28);
    g.lineBetween(w * 0.5, h * 0.52, w * 0.7, h * 0.42);
    g.lineStyle(1, 0xffffff, 0.45);
    g.lineBetween(w * 0.22, h * 0.55, w * 0.38, h * 0.46);

    g.lineStyle(1, 0x5599bb, 0.5);
    g.strokePoints([
      { x: w / 2, y: 0 }, { x: w, y: h / 2 }, { x: w / 2, y: h }, { x: 0, y: h / 2 },
    ], true);

    g.generateTexture(key, w, h + d);
    g.destroy();
  }

}
