# CLAUDE.md — Beercan Logistics

> Bu dosya Claude Code'un proje bağlamını anlaması için hazırlanmıştır.
> Her yeni Claude Code oturumunda bu dosya otomatik olarak yüklenir.

---

## 🎮 Proje Özeti

**Beercan Logistics**, izometrik bir bira deposu yönetim oyunudur. Oyuncu, depo içinde yürüyerek veya forklift kullanarak bira kutularını doğru raflara/bölgelere yerleştirmek zorundadır. Zamana karşı oynanan, sonsuz level sistemiyle giderek zorlaşan bir oyundur.

- **Platform:** Web tarayıcı (Chrome öncelikli)
- **Oynanış:** Tek oyunculu, zamana karşı depo lojistik yönetimi
- **Perspektif:** 2D İzometrik
- **Görsel Stil:** Pixel art (retro 8/16-bit)
- **Durum:** Sıfırdan geliştirme

---

## 🛠️ Teknoloji Stack

| Katman | Teknoloji | Versiyon |
|---|---|---|
| Oyun Motoru | Phaser 3 | `^3.80.x` |
| Dil | TypeScript | `^5.x` |
| Build Tool | Vite | `^5.x` |
| Piksel Art | Aseprite | — |
| Paket Yönetici | npm | — |

### Neden Bu Stack?
- **Phaser 3 + TypeScript:** Browser tabanlı 2D oyunlar için en olgun ekosistem; tip güvenliği hata yakalamayı kolaylaştırır.
- **Vite:** HMR (hot module reload) sayesinde hızlı geliştirme döngüsü.
- **Aseprite:** İzometrik piksel art için endüstri standardı; `.aseprite` dosyaları doğrudan tile sheet olarak export edilebilir.

---

## 📁 Proje Yapısı

```
beercan-logistics/
├── CLAUDE.md                  ← Bu dosya
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
│
├── src/
│   ├── main.ts                ← Phaser oyun config ve başlatma
│   │
│   ├── scenes/
│   │   ├── BootScene.ts       ← Temel asset yükleme
│   │   ├── PreloadScene.ts    ← Tüm asset yükleme + loading bar
│   │   ├── MenuScene.ts       ← Ana menü
│   │   ├── GameScene.ts       ← Ana oyun sahnesi (merkez)
│   │   ├── UIScene.ts         ← HUD (zamanlayıcı, skor, göstergeler)
│   │   └── GameOverScene.ts   ← Level sonu / game over ekranı
│   │
│   ├── objects/               ← Oyun nesneleri (Phaser GameObjects extend)
│   │   ├── Player.ts          ← Yürüyen oyuncu karakteri
│   │   ├── Forklift.ts        ← Oyuncunun binebileceği forklift
│   │   ├── BeerBox.ts         ← Taşınabilir bira kutusu
│   │   ├── Shelf.ts           ← Hedef raf / bölge
│   │   └── IsoTile.ts         ← İzometrik zemin tile'ı
│   │
│   ├── systems/               ← Oyun sistemleri (mantık katmanı)
│   │   ├── IsoWorld.ts        ← İzometrik koordinat dönüşümleri
│   │   ├── TimerSystem.ts     ← Geri sayım zamanlayıcısı
│   │   ├── LevelGenerator.ts  ← Prosedürel level üretimi
│   │   ├── ScoreSystem.ts     ← Puan hesaplama ve kaydetme
│   │   └── InputHandler.ts    ← Klavye girdi yönetimi
│   │
│   ├── utils/
│   │   ├── IsoUtils.ts        ← iso↔screen koordinat helpers
│   │   ├── Constants.ts       ← Oyun sabitleri (tile boyutu, hız vb.)
│   │   └── AssetKeys.ts       ← Asset key sabitleri (string literal hatalarını önler)
│   │
│   └── types/
│       └── index.ts           ← Paylaşılan TypeScript tipleri ve interface'ler
│
├── assets/
│   ├── sprites/
│   │   ├── player/            ← Oyuncu animasyon frame'leri
│   │   ├── forklift/          ← Forklift sprite'ları
│   │   ├── boxes/             ← Bira kutusu varyantları
│   │   ├── tiles/             ← İzometrik zemin, duvar, raf tile'ları
│   │   └── ui/                ← HUD ve menü elementleri
│   ├── tilemaps/              ← Tiled JSON level dosyaları (varsa)
│   └── audio/
│       ├── sfx/               ← Ses efektleri
│       └── music/             ← Arka plan müziği
│
└── public/                    ← Vite tarafından statik servis edilen dosyalar
```

---

## ⚙️ Geliştirme Komutları

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat (http://localhost:5173)
npm run dev

# Production build
npm run build

# Build önizleme
npm run preview

# Tip kontrolü
npm run typecheck
```

---

## 🗺️ İzometrik Koordinat Sistemi

Bu proje **"2:1 isometric projection"** kullanır (en yaygın piksel art izometrik stili).

### Temel Dönüşüm Formülleri (`IsoUtils.ts`)

```typescript
// Dünya (grid) koordinatından ekran koordinatına
function isoToScreen(tileX: number, tileY: number): { x: number; y: number } {
  return {
    x: (tileX - tileY) * (TILE_WIDTH / 2),
    y: (tileX + tileY) * (TILE_HEIGHT / 2),
  };
}

// Ekran koordinatından dünya (grid) koordinatına
function screenToIso(screenX: number, screenY: number): { x: number; y: number } {
  return {
    x: (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2,
    y: (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2,
  };
}
```

### Tile Boyutları (Constants.ts)

```typescript
export const TILE_WIDTH = 64;   // Piksel — izometrik tile genişliği
export const TILE_HEIGHT = 32;  // Piksel — izometrik tile yüksekliği
export const TILE_DEPTH = 16;   // Piksel — kutu/nesne yüksekliği (z-eksen görünümü)
```

### Render Sırası (Depth Sorting)
İzometrik sahnelerde nesneler `y` koordinatına göre sıralanmalıdır:
```typescript
// Her update döngüsünde çağrılır
gameObject.setDepth(isoTileY + isoTileX);
```

---

## 🎯 Temel Oyun Mekaniği

### 1. Oyuncu (Player)
- WASD veya ok tuşlarıyla 4 yönde hareket (izometrik eksende)
- Yavaş hareket modu: `Shift` tuşu
- Kutu taşırken hareket hızı düşer
- Forklift'e biniş: `E` tuşu (yakındaysa)

### 2. Forklift
- Oyuncu ile aynı kontroller, daha hızlı hareket
- Tek seferde birden fazla kutu taşıyabilir (kapasite: 3 kutu)
- Dönüş animasyonu: Yön değişiminde gecikmeli
- Yakıt sistemi (ileriki levellarda): Belirli sayıda hamleden sonra dolar

### 3. Bira Kutuları (BeerBox)
- Her kutunun bir `type` değeri var (renk/marka ile belirtilir): `lager | ale | stout | pilsner`
- Her kutunun bir hedef rafı var (etiket rengiyle eşleşir)
- Oyuncu yanındayken `Space` ile alınır / bırakılır
- Yanlış rafa bırakma: Ceza süresi eklenir (+5 saniye)

### 4. Raflar / Hedef Bölgeler (Shelf)
- Her raf belirli bir kutu tipi bekler (UI'da gösterilir)
- Doluluk göstergesi: Kaç kutu kaldığı rafın üzerinde görünür
- Tüm raflar dolduğunda level tamamlanır

### 5. Zamanlayıcı
- Her level başlangıç süresi: `BASE_TIME = 120` saniye
- Her geçilen levelda süre `5` saniye azalır (minimum `45` saniye)
- Bonus süre: Hızlı tamamlamada +10 saniye sonraki levela aktarılır

---

## 📊 Level Sistemi

```
Level 1 → 2 kutu tipi, 8 kutu, 120sn
Level 2 → 2 kutu tipi, 10 kutu, 115sn
Level 3 → 3 kutu tipi, 12 kutu, 110sn
...
Level N → min(2 + floor(N/3), 4) kutu tipi, 8+(N*2) kutu, max(120-(N*5), 45)sn
```

`LevelGenerator.ts` bu formülleri kullanarak her level için prosedürel olarak harita oluşturur.

---

## 🖼️ Asset Kılavuzu

### Sprite Sheet Formatı
- **Tile sheet:** 64×32px (izometrik diamond) per tile
- **Karakter sprite:** 32×48px per frame, 8 yön animasyonu (yürüyüş: 4 frame)
- **Format:** `.png` (transparent background)
- **Renk paleti:** Max 32 renk per sprite (retro his için)

### Animasyon İsimlendirme (Aseprite tag isimleri)
```
player_walk_n  → Kuzeye yürüyüş
player_walk_ne → Kuzeydoğuya yürüyüş
player_walk_e  → Doğuya yürüyüş
player_walk_se → Güneydoğuya yürüyüş
player_idle    → Boşta bekleme
player_carry   → Kutu taşıma (her yön için)
forklift_idle  → Forklift boşta
forklift_move  → Forklift hareket
```

---

## 💡 Kod Kuralları

### TypeScript
- **Strict mode** açık (`tsconfig.json`'da `"strict": true`)
- `any` tipi yasak — bilinmeyen tipler için `unknown` kullan
- Her public metod ve interface'e JSDoc yorumu ekle

### Phaser Kullanımı
- Scene'ler arası veri paylaşımı için `this.registry` kullan (global state)
- Asset yükleme **sadece** `PreloadScene`'de yapılır
- `update()` metodunda ağır hesaplama yapma — sistemlere delege et

### Dosya/Sınıf İsimlendirme
- Sınıflar: `PascalCase` (ör. `BeerBox`, `IsoWorld`)
- Dosyalar: `PascalCase.ts` (sınıf adıyla aynı)
- Sabitler: `UPPER_SNAKE_CASE` (ör. `TILE_WIDTH`, `BASE_TIME`)
- Metodlar/değişkenler: `camelCase`

### Commit Mesajı Formatı
```
feat: forklift binme/inme mekaniği eklendi
fix: izometrik derinlik sıralaması hatası düzeltildi
refactor: LevelGenerator prosedürel sisteme geçirildi
assets: oyuncu yürüyüş animasyonu eklendi
```

---

## 🚫 Bilinen Kısıtlamalar & Notlar

1. **İzometrik Depth Sorting:** Her frame'de tüm nesnelerin `depth` değeri güncellenmeli — performans için nesneleri sadece hareket ettiklerinde güncelle.
2. **Tile Çakışması:** Forklift ile oyuncu aynı tile'da olamaz — çarpışma sistemi izometrik grid üzerinden çalışmalı (ekran koordinatları değil).
3. **Beta Hedefi:** İlk versiyon için ses sistemi opsiyonel — önce core mekanik çalışır hale getirilmeli.
4. **Tarayıcı Desteği:** Chrome öncelikli — Safari/Firefox için polyfill gerekmeyecek şekilde standart API kullan.
5. **Kayıt Sistemi:** `localStorage` ile high score kaydı — sunucu tarafı yok (beta için).

---

## 🗺️ Geliştirme Yol Haritası (Beta)

- [ ] **Faz 1 — Altyapı:** Vite + Phaser + TS kurulumu, izometrik tile render
- [ ] **Faz 2 — Oyuncu:** Hareket, animasyon, kamera takibi
- [ ] **Faz 3 — Mekanik:** Kutu al/bırak, raf sistemi, tip eşleşmesi
- [ ] **Faz 4 — Forklift:** Biniş/iniş, çoklu kutu taşıma
- [ ] **Faz 5 — Oyun Döngüsü:** Zamanlayıcı, level geçişi, game over
- [ ] **Faz 6 — Cila:** UI/HUD, ses efektleri, high score

---

*Son güncelleme: 2026-06 | Hazırlayan: Claude Code bağlam dosyası*
