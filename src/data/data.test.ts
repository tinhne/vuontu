import { beforeAll, describe, expect, it } from 'vitest';
import { bankId, bankRowToWord, lessons, loadBank, topics, words } from './index';
import { TOPIC_META } from './topics';
import { CEFR_LEVELS, DIFFICULTIES, POS_VI } from '../types';

beforeAll(() => loadBank());

describe('vocabulary data', () => {
  it('files every word under a known topic', () => {
    const known = new Set(TOPIC_META.map((t) => t.id));
    expect(topics.length).toBeGreaterThanOrEqual(12);
    for (const w of words) expect(known.has(w.topicId), `${w.word} → ${w.topicId}`).toBe(true);
  });

  it('has unique word ids and headwords', () => {
    expect(new Set(words.map((w) => w.id)).size).toBe(words.length);
    expect(new Set(words.map((w) => w.word)).size).toBe(words.length);
    expect(words.filter((w) => w.word.toLowerCase() === 'may').map((w) => w.word).sort()).toEqual(['May', 'may']);
  });

  it('has complete entries', () => {
    const bad = words.filter(
      (w) =>
        !/\S/.test(w.word) ||
        !/^\/.+\/$/.test(w.ipa) ||
        !(w.pos in POS_VI) ||
        !CEFR_LEVELS.includes(w.cefr) ||
        !/\S/.test(w.meaningVi) ||
        !/\S/.test(w.example) ||
        !/\S/.test(w.exampleVi),
    );
    expect(bad.map((w) => w.id)).toEqual([]);
  });

  it('gives every word collocations, and most of them synonyms', () => {
    expect(words.filter((w) => !w.id.startsWith('w-')).length).toBe(288);
    expect(words.filter((w) => w.collocations.length === 0).map((w) => w.word)).toEqual([]);
    expect(words.filter((w) => w.synonyms.length > 0).length / words.length).toBeGreaterThan(0.75);
    expect(words.filter((w) => w.synonyms.some((s) => s.toLowerCase() === w.word.toLowerCase())).map((w) => w.word)).toEqual([]);
  });
});

describe('bank rows', () => {
  it('turn compact rows into words', () => {
    const w = bankRowToWord(['look after', '/lʊk ˈɑːftə/', ['verb', 'phrase'], 'A2', 'chăm sóc', 'She looks after her grandmother.', 'Cô ấy chăm sóc bà.', 'family']);
    expect(w).toMatchObject({ id: 'w-look-after', pos: 'verb', posAll: ['verb', 'phrase'], cefr: 'A2', topicId: 'family', collocations: [], synonyms: [] });
    const full = bankRowToWord(['frugal', '/ˈfruːɡl/', ['adjective'], 'B2', 'tiết kiệm', 'She lives a frugal life.', 'Cô ấy sống tiết kiệm.', 'economy', ['a frugal life'], ['thrifty']]);
    expect(full).toMatchObject({ collocations: ['a frugal life'], synonyms: ['thrifty'] });
    expect(bankId("'m")).toBe('w-m');
    expect(bankId('a.m.')).toBe('w-a-m');
  });
});

describe('grammar data', () => {
  it('has unique lesson ids', () => {
    expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length);
  });

  for (const lesson of lessons) {
    describe(lesson.id, () => {
      it('has content', () => {
        expect(CEFR_LEVELS).toContain(lesson.level);
        expect(lesson.sections.length).toBeGreaterThan(0);
        for (const s of lesson.sections) expect(s.bodyVi).toMatch(/\S/);
      });

      it('has well-formed quizzes', () => {
        for (const d of DIFFICULTIES) {
          const qs = lesson.quiz[d];
          expect(qs.length, `${d} count`).toBeGreaterThan(0);
          for (const q of qs) {
            if (q.type === 'mcq') {
              expect(q.options.length).toBeGreaterThanOrEqual(2);
              expect(q.answer).toBeGreaterThanOrEqual(0);
              expect(q.answer).toBeLessThan(q.options.length);
              expect(new Set(q.options).size, `duplicate options in "${q.prompt}"`).toBe(q.options.length);
            } else {
              expect(q.prompt.split('___').length, `gap in "${q.prompt}"`).toBe(2);
              expect(q.answers.length).toBeGreaterThan(0);
            }
          }
        }
      });
    });
  }
});
