/**
 * Dosyasız procedural ses sistemi — Web Audio API.
 * AudioContext kullanıcı etkileşiminden sonra lazy-init edilir.
 */
export class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private muted: boolean = false;

  private _ensureCtx(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.35;
        this.masterGain.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.35;
    }
    return this.muted;
  }

  isMuted(): boolean { return this.muted; }

  // ─── Sesler ───────────────────────────────────────────────────────────────

  /** Kutu alma: kısa yükselen ton. */
  pickup(): void {
    this._tone(220, 380, 'sine', 0.09, 0.0, 0.09);
  }

  /** Başarılı teslim: C majör arpej. */
  deliver(): void {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      this.time.delayedCall(i * 55, () => this._tone(freq, freq, 'sine', 0.14, 0.0, 0.18));
    });
  }

  /** Yanlış raf: alçalan rahatsız edici bip. */
  wrongShelf(): void {
    this._tone(220, 110, 'sawtooth', 0.18, 0.0, 0.18, 0.4);
  }

  /** Level tamamlandı: yükselen zafer arpeji. */
  levelComplete(): void {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      this.time.delayedCall(i * 80, () => this._tone(freq, freq * 1.05, 'sine', 0.2, 0.0, 0.3));
    });
  }

  /** Forklift biniş: çift mekanik bip. */
  forkliftMount(): void {
    this._tone(880, 880, 'square', 0.1, 0.0, 0.06);
    this.time.delayedCall(90, () => this._tone(1100, 1100, 'square', 0.1, 0.0, 0.06));
  }

  /** Forklift iniş: alçalan mekanik bip. */
  forkliftDismount(): void {
    this._tone(1100, 1100, 'square', 0.1, 0.0, 0.06);
    this.time.delayedCall(90, () => this._tone(880, 880, 'square', 0.1, 0.0, 0.06));
  }

  /** Zamanlayıcı uyarısı: tick sesi. */
  timerTick(): void {
    this._tone(800, 800, 'square', 0.08, 0.0, 0.04, 0.7);
  }

  /** Menü seçim sesi. */
  menuSelect(): void {
    this._tone(440, 550, 'sine', 0.12, 0.0, 0.08);
  }

  // ─── Yardımcılar ──────────────────────────────────────────────────────────

  /**
   * Basit envelope'lu ton üretir.
   * @param startFreq Başlangıç frekansı (Hz)
   * @param endFreq   Bitiş frekansı (Hz, glide için)
   * @param type      Oscillator tipi
   * @param volume    0-1 peak ses
   * @param attackT   Attack süresi (s)
   * @param decayT    Decay süresi (s)
   * @param detune    Detuning (cent, opsiyonel)
   */
  private _tone(
    startFreq: number, endFreq: number,
    type: OscillatorType,
    volume: number, attackT: number, decayT: number,
    detune: number = 0
  ): void {
    const ctx = this._ensureCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.linearRampToValueAtTime(endFreq, now + attackT + decayT);
    osc.detune.value = detune;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + Math.max(attackT, 0.005));
    gain.gain.linearRampToValueAtTime(0, now + attackT + decayT);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + attackT + decayT + 0.01);
  }

  // Web Audio notaları için basit scheduler (Phaser time olmadan)
  private readonly time = {
    delayedCall: (ms: number, cb: () => void) => {
      setTimeout(cb, ms);
    },
  };
}
