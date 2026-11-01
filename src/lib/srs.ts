// Spaced repetition based on SM-2, counted in whole days so "due today" is stable for the whole day.

export type Rating = 'again' | 'hard' | 'good' | 'easy';
export const RATINGS: Rating[] = ['again', 'hard', 'good', 'easy'];
export const RATING_VI: Record<Rating, string> = { again: 'Quên', hard: 'Khó', good: 'Nhớ', easy: 'Dễ' };

export interface CardState {
  reps: number;
  lapses: number;
  ease: number;
  interval: number;
  due: number;
  added: number;
}

export const START_EASE = 2.5;
export const MIN_EASE = 1.3;
export const MAX_INTERVAL = 365;

export function dayNumber(date = new Date()): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

export function newCard(today: number): CardState {
  return { reps: 0, lapses: 0, ease: START_EASE, interval: 0, due: today, added: today };
}

export function schedule(prev: CardState | undefined, rating: Rating, today: number): CardState {
  const card = prev ?? newCard(today);
  let { reps, lapses, ease, interval } = card;

  switch (rating) {
    case 'again':
      if (reps > 0) lapses += 1;
      reps = 0;
      interval = 0;
      ease = Math.max(MIN_EASE, ease - 0.2);
      break;
    case 'hard':
      interval = reps === 0 ? 1 : Math.max(interval + 1, Math.round(interval * 1.2));
      ease = Math.max(MIN_EASE, ease - 0.15);
      reps += 1;
      break;
    case 'good':
      interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.max(interval + 1, Math.round(interval * ease));
      reps += 1;
      break;
    case 'easy':
      interval = reps === 0 ? 3 : Math.max(interval + 2, Math.round(interval * ease * 1.3));
      ease += 0.15;
      reps += 1;
      break;
  }

  interval = Math.min(interval, MAX_INTERVAL);
  return { reps, lapses, ease: Math.round(ease * 100) / 100, interval, due: today + interval, added: card.added };
}

export function isDue(card: CardState, today: number): boolean {
  return card.due <= today;
}

export type Mastery = 'new' | 'learning' | 'familiar' | 'mastered';
export const MASTERY_VI: Record<Mastery, string> = {
  new: 'Chưa học',
  learning: 'Đang học',
  familiar: 'Đã quen',
  mastered: 'Thuộc lòng',
};

export function mastery(card: CardState | undefined): Mastery {
  if (!card) return 'new';
  if (card.interval >= 21) return 'mastered';
  if (card.interval >= 7) return 'familiar';
  return 'learning';
}

export function formatInterval(days: number): string {
  if (days <= 0) return 'Hôm nay';
  if (days < 30) return `${days} ngày`;
  if (days < 365) return `${Math.round(days / 30)} tháng`;
  return '1 năm';
}
