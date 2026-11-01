import { describe, expect, it } from 'vitest';
import { dayNumber, formatInterval, mastery, MIN_EASE, schedule, type CardState } from './srs';

const T = 20_000;

function run(ratings: Parameters<typeof schedule>[1][]): CardState {
  let card: CardState | undefined;
  let today = T;
  for (const r of ratings) {
    card = schedule(card, r, today);
    today = card.due;
  }
  return card!;
}

describe('schedule', () => {
  it('starts new cards at 1 day for good and 3 days for easy', () => {
    expect(schedule(undefined, 'good', T)).toMatchObject({ reps: 1, interval: 1, due: T + 1, added: T });
    expect(schedule(undefined, 'easy', T)).toMatchObject({ reps: 1, interval: 3, due: T + 3 });
  });

  it('keeps a forgotten new card due today without counting a lapse', () => {
    expect(schedule(undefined, 'again', T)).toMatchObject({ reps: 0, lapses: 0, interval: 0, due: T });
  });

  it('grows intervals on repeated good answers', () => {
    const intervals: number[] = [];
    let card: CardState | undefined;
    let today = T;
    for (let i = 0; i < 5; i++) {
      card = schedule(card, 'good', today);
      intervals.push(card.interval);
      today = card.due;
    }
    expect(intervals).toEqual([1, 3, 8, 20, 50]);
  });

  it('resets reps and records a lapse when a learned card is forgotten', () => {
    const card = schedule(run(['good', 'good', 'good']), 'again', T + 100);
    expect(card).toMatchObject({ reps: 0, lapses: 1, interval: 0, due: T + 100 });
    expect(card.ease).toBeCloseTo(2.3);
  });

  it('never lets ease drop below the minimum or intervals exceed a year', () => {
    expect(run(Array(20).fill('again')).ease).toBe(MIN_EASE);
    expect(run(Array(30).fill('easy')).interval).toBe(365);
  });

  it('keeps the day the card was first added', () => {
    expect(run(['good', 'hard', 'easy']).added).toBe(T);
  });
});

describe('helpers', () => {
  it('counts local calendar days', () => {
    expect(dayNumber(new Date(2026, 10, 2, 0, 5)) - dayNumber(new Date(2026, 10, 1, 23, 55))).toBe(1);
  });

  it('describes mastery and intervals', () => {
    expect(mastery(undefined)).toBe('new');
    expect(mastery(run(['good']))).toBe('learning');
    expect(mastery(run(['good', 'good', 'good']))).toBe('familiar');
    expect(mastery(run(['good', 'good', 'good', 'good']))).toBe('familiar');
    expect(mastery(run(['good', 'good', 'good', 'good', 'good']))).toBe('mastered');
    expect(formatInterval(0)).toBe('Hôm nay');
    expect(formatInterval(8)).toBe('8 ngày');
    expect(formatInterval(90)).toBe('3 tháng');
  });
});
