import { BONUS_TIME } from '../utils/Constants';

const TOP_SCORES_KEY = 'beercan_topscores';

/** Puan hesaplama ve localStorage kayıt — top-3 tablosu. */
export class ScoreSystem {
  private score: number = 0;

  addPoints(points: number): void {
    this.score += points;
  }

  getScore(): number {
    return this.score;
  }

  reset(): void {
    this.score = 0;
  }

  calcLevelBonus(remainingSeconds: number): { points: number; bonusTime: number } {
    const bonusTime = remainingSeconds > 30 ? BONUS_TIME : 0;
    const points = remainingSeconds * 10;
    return { points, bonusTime };
  }

  /** Skoru top-3 listesine kaydeder. */
  saveHighScore(): void {
    const top = this.getTopScores();
    top.push(this.score);
    top.sort((a, b) => b - a);
    localStorage.setItem(TOP_SCORES_KEY, JSON.stringify(top.slice(0, 3)));
  }

  /** İlk sıradaki (en yüksek) skoru döner. */
  getHighScore(): number {
    return this.getTopScores()[0] ?? 0;
  }

  /** En yüksek 3 skoru döner (azalan sıra). */
  getTopScores(): number[] {
    try {
      return JSON.parse(localStorage.getItem(TOP_SCORES_KEY) ?? '[]') as number[];
    } catch {
      return [];
    }
  }
}
