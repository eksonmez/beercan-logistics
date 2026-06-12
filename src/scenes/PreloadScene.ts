import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_WIDTH, TILE_HEIGHT, BEER_COLORS } from '../utils/Constants';
import { AssetKeys } from '../utils/AssetKeys';
import {
  ISO_DIRECTIONS,
  PlayerAnims,
  ForkliftAnims,
  PLAYER_FRAME,
  FORKLIFT_FRAME,
  playerFrameIndex,
  forkliftFrameIndex,
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

  private _darken(color: number, factor: number): number {
    const r = Math.round(((color >> 16) & 0xff) * factor);
    const g = Math.round(((color >> 8)  & 0xff) * factor);
    const b = Math.round(( color        & 0xff) * factor);
    return (r << 16) | (g << 8) | b;
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
  }

  private _registerAnimations(): void {
    for (const dir of ISO_DIRECTIONS) {
      this.anims.create({
        key: PlayerAnims.idle(dir),
        frames: [{ key: AssetKeys.PLAYER.SHEET, frame: playerFrameIndex(dir, 0) }],
        frameRate: 1,
      });
      this.anims.create({
        key: PlayerAnims.walk(dir),
        frames: this.anims.generateFrameNumbers(AssetKeys.PLAYER.SHEET, {
          start: playerFrameIndex(dir, 1),
          end: playerFrameIndex(dir, 4),
        }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: PlayerAnims.carry(dir),
        frames: this.anims.generateFrameNumbers(AssetKeys.PLAYER.SHEET, {
          start: playerFrameIndex(dir, 5),
          end: playerFrameIndex(dir, 8),
        }),
        frameRate: 8,
        repeat: -1,
      });

      this.anims.create({
        key: ForkliftAnims.idle(dir),
        frames: [{ key: AssetKeys.FORKLIFT.SHEET, frame: forkliftFrameIndex(dir, 0) }],
        frameRate: 1,
      });
      this.anims.create({
        key: ForkliftAnims.move(dir),
        frames: this.anims.generateFrameNumbers(AssetKeys.FORKLIFT.SHEET, {
          start: forkliftFrameIndex(dir, 1),
          end: forkliftFrameIndex(dir, 4),
        }),
        frameRate: 6,
        repeat: -1,
      });
    }
  }

  private _createProceduralTextures(): void {
    this._makeTile(AssetKeys.TILES.FLOOR,      0x4a7c59, 0x3a6049, 0x2d4d38);
    this._makeTile(AssetKeys.TILES.WALL,       0x8b6914, 0x6b4a0a, 0x4a3207);
    this._makeTile(AssetKeys.TILES.SHELF_BASE, 0x7a5c3a, 0x5c4020, 0x3d2a12);

    const types = ['lager', 'ale', 'stout', 'pilsner'] as const;
    const texKeys = [AssetKeys.BOXES.LAGER, AssetKeys.BOXES.ALE, AssetKeys.BOXES.STOUT, AssetKeys.BOXES.PILSNER];
    types.forEach((t, i) => this._makeIsoCube(texKeys[i], BEER_COLORS[t]));

    this._makeForkliftSheet();
  }

  /** İzometrik diamond zemin tile — üst yüz + iki yan yüz. */
  private _makeTile(key: string, top: number, left: number, right: number): void {
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

  /** İzometrik küp kutu — 3 görünür yüz. */
  private _makeIsoCube(key: string, baseColor: number): void {
    const cw = 28;
    const ch = 14;
    const cd = 18;
    const totalH = ch + cd + 4;

    const g = this.make.graphics({ x: 0, y: 0 }, false);

    const top   = baseColor;
    const left  = this._darken(baseColor, 0.72);
    const right = this._darken(baseColor, 0.55);

    g.fillStyle(top);
    g.fillPoints([
      { x: cw / 2, y: 0 },
      { x: cw,     y: ch / 2 },
      { x: cw / 2, y: ch },
      { x: 0,      y: ch / 2 },
    ], true);

    g.fillStyle(left);
    g.fillPoints([
      { x: 0,      y: ch / 2 },
      { x: cw / 2, y: ch },
      { x: cw / 2, y: ch + cd },
      { x: 0,      y: ch / 2 + cd },
    ], true);

    g.fillStyle(right);
    g.fillPoints([
      { x: cw / 2, y: ch },
      { x: cw,     y: ch / 2 },
      { x: cw,     y: ch / 2 + cd },
      { x: cw / 2, y: ch + cd },
    ], true);

    g.lineStyle(1, 0x000000, 0.5);
    g.strokePoints([
      { x: cw / 2, y: 0 }, { x: cw, y: ch / 2 }, { x: cw / 2, y: ch }, { x: 0, y: ch / 2 },
    ], true);
    g.strokePoints([
      { x: 0, y: ch / 2 }, { x: 0, y: ch / 2 + cd },
      { x: cw / 2, y: ch + cd }, { x: cw / 2, y: ch },
    ], false);
    g.strokePoints([
      { x: cw, y: ch / 2 }, { x: cw, y: ch / 2 + cd }, { x: cw / 2, y: ch + cd },
    ], false);

    g.generateTexture(key, cw, totalH);
    g.destroy();
  }

  /**
   * Forklift sprite sheet'ini procedural üretir (4 yön × 5 frame).
   * generateTexture tek bir image oluşturur ama animasyon için frame
   * data gereklidir — texture.add() ile her frame manuel eklenir.
   */
  private _makeForkliftSheet(): void {
    const fw   = FORKLIFT_FRAME.width;   // 48
    const fh   = FORKLIFT_FRAME.height;  // 32
    const cols = FORKLIFT_FRAME.cols;    // 5
    const numDirs = ISO_DIRECTIONS.length; // 4

    const g = this.make.graphics({ x: 0, y: 0 }, false);

    ISO_DIRECTIONS.forEach((dir, row) => {
      for (let col = 0; col < cols; col++) {
        this._drawForkliftFrame(g, col * fw, row * fh, dir, col);
      }
    });

    g.generateTexture(AssetKeys.FORKLIFT.SHEET, fw * cols, fh * numDirs);
    g.destroy();

    // Frame data ekle — olmadan animasyon tüm sheet'i tek frame gibi gösterir
    const tex = this.textures.get(AssetKeys.FORKLIFT.SHEET);
    ISO_DIRECTIONS.forEach((_, row) => {
      for (let col = 0; col < cols; col++) {
        tex.add(row * cols + col, 0, col * fw, row * fh, fw, fh);
      }
    });
  }

  /** Tek bir forklift frame'ini verilen sheet offset'ine çizer. */
  private _drawForkliftFrame(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    dir: IsoDirection,
    frame: number,
  ): void {
    const C_TOP    = 0xf5c542; // sarı üst yüz
    const C_SIDE_L = 0xcc9c28; // koyu sarı sol yüz
    const C_SIDE_R = 0x9e7a1c; // en koyu sarı sağ yüz
    const C_MAST   = 0x4a3008; // koyu kahve mast
    const C_GUARD  = 0xf0c840; // parlak sarı overhead guard
    const C_FORK   = 0xd8d8d8; // gümüş fork üstü
    const C_FORKD  = 0x909090; // koyu gümüş fork altı
    const C_CW     = 0x3a3a3a; // koyu gri karşı ağırlık
    const C_WHEEL  = 0x1c1c1c; // lastik
    const OUT      = 0x000000;

    // Yön bayrakları
    const fR = dir === 'se' || dir === 'ne'; // forklar sağa
    const fD = dir === 'se' || dir === 'sw'; // forklar aşağı

    // Hareket animasyonu: tek/çift frame'de 1px zıplama
    const bounce = (frame > 0 && frame % 2 === 1) ? 1 : 0;

    // Gövde merkezi — fork yönü için yer açacak şekilde kaydırılmış
    const bCX = ox + (fR ? 19 : 29);
    const bCY = oy + 16 - bounce;
    const bHW = 11; // iso diamond yarı-genişliği
    const bHH = 6;  // iso diamond yarı-yüksekliği
    const bSD = 10; // yan yüz görünür derinliği

    // Diamond 4 köşesi
    const vT = { x: bCX,       y: bCY - bHH };
    const vR = { x: bCX + bHW, y: bCY       };
    const vB = { x: bCX,       y: bCY + bHH };
    const vL = { x: bCX - bHW, y: bCY       };

    // Yan yüzlerin alt kenarları
    const vLB = { x: vL.x, y: vL.y + bSD };
    const vBB = { x: vB.x, y: vB.y + bSD };
    const vRB = { x: vR.x, y: vR.y + bSD };

    // ── Mast (arka tarafta, yukarı uzanan direk) ──────────────────────
    const mastX   = fR ? vL.x - 1 : vR.x - 4;
    const mastW   = 5;
    const mastTop = oy + 1;
    const mastBot = vT.y;
    if (mastBot > mastTop) {
      // Mast gövdesi — üç yüz (ince izometrik blok görünümü)
      g.fillStyle(C_MAST);
      g.fillRect(mastX, mastTop, mastW, mastBot - mastTop);
      // Küçük ön yüz vurgusu
      g.fillStyle(0x6a5010);
      g.fillRect(fR ? mastX + mastW - 1 : mastX, mastTop, 1, mastBot - mastTop);
      g.lineStyle(1, OUT, 0.55);
      g.strokeRect(mastX, mastTop, mastW, mastBot - mastTop);
    }

    // ── Overhead guard (mast tepesinden kabine uzanan koruma çerçevesi) ─
    const guardEndX = fR ? vR.x + 2 : vL.x - 2;
    const guardEndY = mastTop + (fD ? 3 : 0);
    g.lineStyle(3, C_GUARD, 1.0);
    g.lineBetween(mastX + mastW / 2, mastTop, guardEndX, guardEndY);
    g.lineStyle(1, OUT, 0.3);
    g.lineBetween(mastX + mastW / 2, mastTop, guardEndX, guardEndY);

    // ── Gövde (ISO kutu, 3 görünür yüz) ─────────────────────────────
    // Sol yüz (kameraya bakan daha açık yüz)
    g.fillStyle(C_SIDE_L);
    g.fillPoints([vL, vB, vBB, vLB], true);

    // Sağ / ön yüz (biraz daha koyu)
    g.fillStyle(C_SIDE_R);
    g.fillPoints([vR, vB, vBB, vRB], true);

    // Üst yüz
    g.fillStyle(C_TOP);
    g.fillPoints([vT, vR, vB, vL], true);

    // Kabin camı — ön yüzde küçük mavi dörtgen
    const winX = fR ? (vR.x + vB.x) / 2 - 3 : (vL.x + vB.x) / 2 - 3;
    const winY = bCY + 2;
    g.fillStyle(0x5599cc);
    g.fillRect(winX, winY, 6, 5);
    g.lineStyle(1, OUT, 0.5);
    g.strokeRect(winX, winY, 6, 5);

    // Gövde dış çizgileri
    g.lineStyle(1, OUT, 0.7);
    g.strokePoints([vT, vR, vB, vL], true);
    g.strokePoints([vL, vLB, vBB, vB], false);
    g.strokePoints([vR, vRB, vBB], false);

    // ── Karşı ağırlık bloğu (arka-alt) ──────────────────────────────
    const cwX = fR ? vLB.x - 5 : vRB.x;
    const cwY = vBB.y - 7;
    g.fillStyle(C_CW);
    g.fillRect(cwX, cwY, 5, 7);
    // Üst yüz vurgusu
    g.fillStyle(0x555555);
    g.fillPoints([
      { x: cwX,   y: cwY },
      { x: cwX+5, y: cwY - 2 },
      { x: cwX+5, y: cwY },
      { x: cwX,   y: cwY + 2 },
    ], true);
    g.lineStyle(1, OUT, 0.5);
    g.strokeRect(cwX, cwY, 5, 7);

    // ── Lastikler ───────────────────────────────────────────────────
    g.fillStyle(C_WHEEL);
    // Ön lastik (fork tarafı)
    g.fillEllipse(fR ? vRB.x - 5 : vLB.x + 5, vBB.y + 3, 10, 5);
    // Arka lastik (mast tarafı)
    g.fillEllipse(fR ? vLB.x + 3 : vRB.x - 3, vBB.y + 3, 10, 5);

    // ── Forklar (iki paralel çubuk) ──────────────────────────────────
    const fRootX = fR ? vR.x : vL.x;
    const fRootY = fR ? vR.y + bSD * 0.45 : vL.y + bSD * 0.45;
    const fDX    = (fR ? 14 : -14);
    const fDY    = (fD ? 7 : -7);

    // Üst çubuk (parlak)
    g.fillStyle(C_FORK);
    g.fillPoints([
      { x: fRootX,       y: fRootY - 3 },
      { x: fRootX + fDX, y: fRootY - 3 + fDY },
      { x: fRootX + fDX, y: fRootY - 1 + fDY },
      { x: fRootX,       y: fRootY - 1 },
    ], true);

    // Alt çubuk (gölgeli)
    g.fillStyle(C_FORKD);
    g.fillPoints([
      { x: fRootX,       y: fRootY + 2 },
      { x: fRootX + fDX, y: fRootY + 2 + fDY },
      { x: fRootX + fDX, y: fRootY + 4 + fDY },
      { x: fRootX,       y: fRootY + 4 },
    ], true);

    // Fork çizgileri
    g.lineStyle(1, OUT, 0.45);
    g.strokePoints([
      { x: fRootX, y: fRootY - 3 },
      { x: fRootX + fDX, y: fRootY - 3 + fDY },
      { x: fRootX + fDX, y: fRootY - 1 + fDY },
      { x: fRootX, y: fRootY - 1 },
    ], true);
    g.strokePoints([
      { x: fRootX, y: fRootY + 2 },
      { x: fRootX + fDX, y: fRootY + 2 + fDY },
      { x: fRootX + fDX, y: fRootY + 4 + fDY },
      { x: fRootX, y: fRootY + 4 },
    ], true);
  }
}
