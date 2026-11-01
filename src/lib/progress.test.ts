import { describe, expect, it } from 'vitest';
import { emptyProgress, lessonStatus, longestStreak, parseProgress, streak, newCardsToday, type Progress } from './progress';
import { checkFill, foldVi, normalizeAnswer } from './text';
import { stageFor, STAGES } from './xp';

const T = 20_000;

function withDays(days: Record<number, number>): Progress {
  const p = emptyProgress();
  p.days = Object.fromEntries(Object.entries(days).map(([k, v]) => [k, v]));
  return p;
}

describe('streak', () => {
  it('counts consecutive study days ending today', () => {
    expect(streak(withDays({ [T]: 5, [T - 1]: 3, [T - 2]: 1, [T - 4]: 9 }), T)).toBe(3);
  });

  it('keeps yesterday’s streak alive before studying today', () => {
    expect(streak(withDays({ [T - 1]: 3, [T - 2]: 1 }), T)).toBe(2);
  });

  it('is zero after a missed day', () => {
    expect(streak(withDays({ [T - 2]: 3 }), T)).toBe(0);
  });
});

describe('parseProgress', () => {
  it('rejects things that are not a save file', () => {
    expect(parseProgress(null)).toBeNull();
    expect(parseProgress({ foo: 1 })).toBeNull();
    expect(parseProgress({ version: 2, xp: 1, cards: {} })).toBeNull();
  });

  it('fills in missing fields and default settings', () => {
    const p = parseProgress({ version: 1, xp: 12, cards: {}, settings: { newPerDay: 20 } })!;
    expect(p.xp).toBe(12);
    expect(p.games).toEqual({});
    expect(p.settings.newPerDay).toBe(20);
    expect(p.settings.dailyGoal).toBe(emptyProgress().settings.dailyGoal);
  });
});

describe('progress helpers', () => {
  it('counts cards introduced today', () => {
    const p = emptyProgress();
    p.cards = {
      a: { reps: 1, lapses: 0, ease: 2.5, interval: 1, due: T + 1, added: T },
      b: { reps: 3, lapses: 0, ease: 2.5, interval: 8, due: T + 2, added: T - 10 },
    };
    expect(newCardsToday(p, T)).toBe(1);
  });

  it('marks a lesson done only when all three levels pass', () => {
    expect(lessonStatus(undefined)).toBe('new');
    expect(lessonStatus({ easy: 100, medium: 50 })).toBe('started');
    expect(lessonStatus({ easy: 100, medium: 75, hard: 75 })).toBe('done');
  });
});

describe('text helpers', () => {
  it('accepts answers regardless of case, spacing and apostrophe style', () => {
    expect(normalizeAnswer("  Aren’t  ")).toBe("aren't");
    expect(checkFill('ARE NOT', ["aren't", 'are not'])).toBe(true);
    expect(checkFill('is', ["aren't", 'are not'])).toBe(false);
    expect(checkFill('   ', [''])).toBe(false);
  });

  it('folds Vietnamese diacritics for search', () => {
    expect(foldVi('Giáo dục')).toBe('giao duc');
    expect(foldVi('Đô thị')).toBe('do thi');
  });
});

describe('stageFor', () => {
  it('maps XP to tree stages', () => {
    expect(stageFor(0)).toMatchObject({ index: 0, progress: 0 });
    expect(stageFor(30).index).toBe(1);
    expect(stageFor(75).progress).toBeCloseTo(0.5);
    expect(stageFor(99_999)).toMatchObject({ index: STAGES.length - 1, progress: 1, next: undefined });
  });
});

describe('personal decks', () => {
  it('creates decks, adds words without duplicates and cleans up on delete', async () => {
    const m = await import('./progress');
    const id = m.createDeck('Writing', '', '📒', 'blue');
    expect(m.addCustomWords(id, [{ word: 'resilient', meaningVi: 'kiên cường' }, { word: 'Resilient', meaningVi: 'trùng' }])).toBe(1);
    expect(m.addWordsToDeck(id, ['education-curriculum', 'education-curriculum'])).toBe(1);
    const deck = m.getProgress().decks[id];
    expect(deck.wordIds).toHaveLength(2);
    const customId = deck.wordIds[0];
    expect(m.getProgress().customWords[customId]).toMatchObject({ word: 'resilient', topicId: `custom:${id}` });

    m.removeWordFromDeck(id, customId);
    expect(m.getProgress().customWords[customId]).toBeUndefined();
    m.deleteDeck(id);
    expect(m.getProgress().decks[id]).toBeUndefined();
  });

  it('toggles saved words', async () => {
    const m = await import('./progress');
    m.toggleStar('w-x');
    expect(m.getProgress().starred['w-x']).toBeGreaterThan(0);
    m.toggleStar('w-x');
    expect(m.getProgress().starred['w-x']).toBeUndefined();
  });
});

describe('longestStreak', () => {
  it('finds the longest run of study days', () => {
    expect(longestStreak(withDays({ 1: 5, 2: 3, 3: 1, 7: 2, 8: 2 }))).toBe(3);
    expect(longestStreak(withDays({}))).toBe(0);
  });
});
