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
    // Orijinal floor (geriye dönük uyum)
    this._makeTile(AssetKeys.TILES.FLOOR,      0xd4c89a, 0xb09060, 0x8c7040, 0xe8c84a);
    this._makeTile(AssetKeys.TILES.WALL,       0x8b5e2a, 0x6b4018, 0x4d2c0a);
    this._makeTile(AssetKeys.TILES.SHELF_BASE, 0x7a5c3a, 0x5c4020, 0x3d2a12);

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

    const types = ['lager', 'ale', 'stout', 'pilsner'] as const;
    const texKeys = [AssetKeys.BOXES.LAGER, AssetKeys.BOXES.ALE, AssetKeys.BOXES.STOUT, AssetKeys.BOXES.PILSNER];
    types.forEach((t, i) => this._makeIsoCube(texKeys[i], BEER_COLORS[t]));

    this._makeForkliftSheet();
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

    // Üst yüz vurgusu — kuzey köşesinde hafif aydınlık üçgen
    const highlightColor = this._darken(baseColor, 1.35);
    g.fillStyle(highlightColor, 0.45);
    g.fillPoints([
      { x: cw / 2, y: 0 },
      { x: cw * 0.72, y: ch * 0.36 },
      { x: cw / 2, y: ch * 0.5 },
      { x: cw * 0.28, y: ch * 0.36 },
    ], true);

    // Etiket bandı — sol ve sağ yüzün orta kısmında krem şerit
    const bandY = ch + cd * 0.42;
    const bandH = 3;
    g.fillStyle(0xf0ead8, 0.82);
    // Sol yüz bandı
    g.fillPoints([
      { x: 0,      y: bandY - 1 },
      { x: cw / 2, y: bandY + bandH - 1 },
      { x: cw / 2, y: bandY + bandH + 1 },
      { x: 0,      y: bandY + 1 },
    ], true);
    // Sağ yüz bandı
    g.fillPoints([
      { x: cw / 2, y: bandY + bandH - 1 },
      { x: cw,     y: bandY - 1 },
      { x: cw,     y: bandY + 1 },
      { x: cw / 2, y: bandY + bandH + 1 },
    ], true);

    g.lineStyle(1, 0x000000, 0.7);
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
    const fw   = FORKLIFT_FRAME.width;   // 72
    const fh   = FORKLIFT_FRAME.height;  // 56
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
    // ── Renk paleti (referans: sarı kabin + kırmızı alt gövde) ──────
    const C_CAB_TOP = 0xf5c233; // sarı üst yüz
    const C_CAB_L   = 0xd4a020; // sarı sol yüz
    const C_CAB_R   = 0xa87818; // sarı sağ/ön yüz (koyu)
    const C_RED_L   = 0xcc2211; // kırmızı sol yüz
    const C_RED_R   = 0x8a1606; // kırmızı sağ yüz (koyu)
    const C_MAST    = 0x1e1e1e; // siyah mast
    const C_GUARD   = 0xf0c030; // overhead guard (parlak sarı)
    const C_FORK    = 0xcccccc; // fork üstü (gümüş)
    const C_FORKD   = 0x888888; // fork altı (koyu gümüş)
    const C_WHEEL   = 0x1a1a1a; // lastik
    const C_RIM     = 0x7a6030; // jant (altın-kahve)
    const C_WIN     = 0x4488bb; // kabin camı
    const OUT       = 0x000000;

    const fR = dir === 'se' || dir === 'ne'; // forklar sağa
    const fD = dir === 'se' || dir === 'sw'; // forklar aşağı
    const bounce = (frame > 0 && frame % 2 === 1) ? 1 : 0;

    // ── Gövde geometrisi ─────────────────────────────────────────────
    // Fork yönüne göre gövdeyi kaydır, fork için yer aç
    const bCX  = ox + (fR ? 30 : 42);
    const bCY  = oy + 20 - bounce;
    const bHW  = 16; // iso diamond yarı-genişliği
    const bHH  = 8;  // iso diamond yarı-yüksekliği (2:1 oran)
    const cabH = 12; // sarı kabin yan yüz yüksekliği
    const redH = 8;  // kırmızı alt gövde yüksekliği

    const vT = { x: bCX,       y: bCY - bHH };
    const vR = { x: bCX + bHW, y: bCY       };
    const vB = { x: bCX,       y: bCY + bHH };
    const vL = { x: bCX - bHW, y: bCY       };

    // Kabin alt kenarları
    const vLB = { x: vL.x, y: vL.y + cabH };
    const vBB = { x: vB.x, y: vB.y + cabH };
    const vRB = { x: vR.x, y: vR.y + cabH };

    // Kırmızı alt gövde kenarları
    const vLR = { x: vL.x, y: vL.y + cabH + redH };
    const vBR = { x: vB.x, y: vB.y + cabH + redH };
    const vRR = { x: vR.x, y: vR.y + cabH + redH };

    // ── Mast (iki paralel direk) ──────────────────────────────────────
    const mastTop = oy + 3;
    const mastBot = vT.y + 1;
    const mast1X  = fR ? vL.x - 1  : vR.x - 7;
    const mast2X  = fR ? vL.x + 4  : vR.x - 2;
    const mastH   = mastBot - mastTop;
    if (mastH > 0) {
      // Sol direk
      g.fillStyle(C_MAST);
      g.fillRect(mast1X, mastTop, 4, mastH);
      g.fillStyle(0x3a3a3a);
      g.fillRect(fR ? mast1X + 3 : mast1X, mastTop, 1, mastH);
      g.lineStyle(1, OUT, 0.55);
      g.strokeRect(mast1X, mastTop, 4, mastH);
      // Sağ direk
      g.fillStyle(C_MAST);
      g.fillRect(mast2X, mastTop, 4, mastH);
      g.fillStyle(0x3a3a3a);
      g.fillRect(fR ? mast2X + 3 : mast2X, mastTop, 1, mastH);
      g.lineStyle(1, OUT, 0.55);
      g.strokeRect(mast2X, mastTop, 4, mastH);
      // Mastları birleştiren yatay bar
      g.fillStyle(C_MAST);
      g.fillRect(Math.min(mast1X, mast2X), mastTop + 3, Math.abs(mast2X - mast1X) + 4, 3);
    }

    // ── Overhead guard (kabinin üzerini kaplayan koruma çerçevesi) ───
    const guardSX = fR ? mast2X + 2 : mast1X + 2;
    const guardEX = fR ? vR.x + 4   : vL.x - 4;
    const guardEY = mastTop + (fD ? 5 : 1);
    g.lineStyle(4, C_GUARD);
    g.lineBetween(guardSX, mastTop, guardEX, guardEY);
    g.lineStyle(1, OUT, 0.35);
    g.lineBetween(guardSX, mastTop, guardEX, guardEY);

    // ── Kırmızı alt gövde yüzleri ────────────────────────────────────
    g.fillStyle(C_RED_L);
    g.fillPoints([vLB, vBB, vBR, vLR], true);
    g.fillStyle(C_RED_R);
    g.fillPoints([vRB, vBB, vBR, vRR], true);

    // ── Sarı kabin yüzleri ───────────────────────────────────────────
    g.fillStyle(C_CAB_L);
    g.fillPoints([vL, vB, vBB, vLB], true);
    g.fillStyle(C_CAB_R);
    g.fillPoints([vR, vB, vBB, vRB], true);

    // ── Üst yüz (diamond) ────────────────────────────────────────────
    g.fillStyle(C_CAB_TOP);
    g.fillPoints([vT, vR, vB, vL], true);

    // ── Kabin camı ───────────────────────────────────────────────────
    const winFaceX = fR ? (vR.x + vB.x) / 2 : (vL.x + vB.x) / 2;
    const winX = Math.round(winFaceX) - 4;
    const winY = bCY + 2;
    g.fillStyle(C_WIN);
    g.fillRect(winX, winY, 8, 7);
    g.fillStyle(0xaaddff, 0.5);
    g.fillRect(winX + 1, winY + 1, 3, 2);
    g.lineStyle(1, OUT, 0.45);
    g.strokeRect(winX, winY, 8, 7);

    // ── Dış çizgiler ─────────────────────────────────────────────────
    g.lineStyle(1, OUT, 0.8);
    g.strokePoints([vT, vR, vB, vL], true);
    g.strokePoints([vL, vLB], false);
    g.strokePoints([vR, vRB], false);
    g.strokePoints([vB, vBB], false);
    g.lineStyle(1, OUT, 0.6);
    g.strokePoints([vLB, vBB, vRB], false);
    g.strokePoints([vLB, vLR], false);
    g.strokePoints([vRB, vRR], false);
    g.strokePoints([vBB, vBR], false);
    g.strokePoints([vLR, vBR, vRR], false);

    // ── Lastikler (jantlı) ───────────────────────────────────────────
    const wheelY    = vBR.y + 5;
    const fWheelX   = fR ? vRR.x - 6  : vLR.x + 6;
    const rWheelX   = fR ? vLR.x + 6  : vRR.x - 6;
    [[fWheelX, wheelY], [rWheelX, wheelY]].forEach(([wx, wy]) => {
      g.fillStyle(C_WHEEL);
      g.fillEllipse(wx, wy, 14, 7);
      g.fillStyle(C_RIM);
      g.fillEllipse(wx, wy, 7, 4);
      g.fillStyle(0x222222);
      g.fillEllipse(wx, wy, 3, 2);
      g.lineStyle(1, OUT, 0.5);
      g.strokeEllipse(wx, wy, 14, 7);
    });

    // ── Forklar (iki paralel çubuk) ───────────────────────────────────
    const fRootX = fR ? vR.x       : vL.x;
    const fRootY = fR ? vRB.y - 2  : vLB.y - 2;
    const fDX    = fR ? 18  : -18;
    const fDY    = fD ? 9   : -9;
    const gap    = 6;

    // Birinci fork çubuğu (üstte)
    g.fillStyle(C_FORK);
    g.fillPoints([
      { x: fRootX,        y: fRootY - gap - 2 },
      { x: fRootX + fDX,  y: fRootY - gap - 2 + fDY },
      { x: fRootX + fDX,  y: fRootY - gap + 1 + fDY },
      { x: fRootX,        y: fRootY - gap + 1 },
    ], true);
    g.fillStyle(C_FORKD);
    g.fillPoints([
      { x: fRootX,        y: fRootY - gap + 1 },
      { x: fRootX + fDX,  y: fRootY - gap + 1 + fDY },
      { x: fRootX + fDX,  y: fRootY - gap + 3 + fDY },
      { x: fRootX,        y: fRootY - gap + 3 },
    ], true);

    // İkinci fork çubuğu (altta)
    g.fillStyle(C_FORK);
    g.fillPoints([
      { x: fRootX,        y: fRootY + 1 },
      { x: fRootX + fDX,  y: fRootY + 1 + fDY },
      { x: fRootX + fDX,  y: fRootY + 4 + fDY },
      { x: fRootX,        y: fRootY + 4 },
    ], true);
    g.fillStyle(C_FORKD);
    g.fillPoints([
      { x: fRootX,        y: fRootY + 4 },
      { x: fRootX + fDX,  y: fRootY + 4 + fDY },
      { x: fRootX + fDX,  y: fRootY + 6 + fDY },
      { x: fRootX,        y: fRootY + 6 },
    ], true);

    g.lineStyle(1, OUT, 0.4);
    g.lineBetween(fRootX, fRootY - gap - 2, fRootX + fDX, fRootY - gap - 2 + fDY);
    g.lineBetween(fRootX, fRootY + 1,       fRootX + fDX, fRootY + 1 + fDY);
  }
}
