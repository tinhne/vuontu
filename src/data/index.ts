import { CEFR_LEVELS, type Cefr, type Lesson, type PartOfSpeech, type Topic, type Word } from '../types';
import { TOPIC_META } from './topics';

type RawTopic = Omit<Topic, 'words'> & { words: Omit<Word, 'topicId'>[] };
/** Compact bank row: headword, IPA, parts of speech, level, meaning, example, example translation, topic, collocations, synonyms. */
export type BankRow = [string, string, PartOfSpeech[], Cefr, string, string, string, string, string[]?, string[]?];

// Every data file is picked up automatically, so adding vocab-3.json or grammar-3.json needs no code change.
const vocabFiles = import.meta.glob<{ topics: RawTopic[] }>('./vocab-*.json', { eager: true, import: 'default' });
const grammarFiles = import.meta.glob<{ lessons: Lesson[] }>('./grammar-*.json', { eager: true, import: 'default' });
// The large word bank is split per level and loaded once at start-up (see loadBank).
const bankFiles = import.meta.glob<BankRow[]>('./bank/bank-*.json', { import: 'default' });

function inFileOrder<T>(files: Record<string, T>): T[] {
  return Object.keys(files)
    .sort()
    .map((name) => files[name]);
}

/** Hand-written words with collocations and synonyms. */
const richWords: Word[] = inFileOrder(vocabFiles).flatMap((file) =>
  file.topics.flatMap((t) => t.words.map((w) => ({ ...w, topicId: t.id }))),
);

export let words: Word[] = richWords;
export let wordById = new Map<string, Word>();
export let topics: Topic[] = [];
export let topicById = new Map<string, Topic>();
export let bankLoaded = false;

function index(all: Word[]) {
  words = all;
  wordById = new Map(all.map((w) => [w.id, w]));
  topics = TOPIC_META.map((meta) => ({ ...meta, words: all.filter((w) => w.topicId === meta.id) })).filter((t) => t.words.length > 0);
  topicById = new Map(topics.map((t) => [t.id, t]));
}
index(richWords);

export function bankId(headword: string): string {
  return `w-${headword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'x'}`;
}

export function bankRowToWord([word, ipa, pos, cefr, meaningVi, example, exampleVi, topicId, collocations = [], synonyms = []]: BankRow): Word {
  return {
    id: bankId(word),
    word,
    ipa,
    pos: pos[0] ?? 'noun',
    posAll: pos.length > 1 ? pos : undefined,
    cefr,
    meaningVi,
    example,
    exampleVi,
    collocations,
    synonyms,
    topicId,
  };
}

let loading: Promise<void> | null = null;

/** Loads the word bank and merges it with the hand-written words (those win on duplicates). */
export function loadBank(): Promise<void> {
  loading ??= Promise.all(inFileOrder(bankFiles).map((load) => load())).then((files) => {
    // Case matters: "May" (the month) and "may" (the verb) are different words.
    const seen = new Set(richWords.map((w) => w.word));
    const ids = new Set(richWords.map((w) => w.id));
    const extra: Word[] = [];
    for (const row of files.flat()) {
      if (seen.has(row[0])) continue;
      seen.add(row[0]);
      const w = bankRowToWord(row);
      let id = w.id;
      for (let n = 2; ids.has(id); n++) id = `${w.id}-${n}`;
      ids.add(id);
      extra.push({ ...w, id });
    }
    index([...richWords, ...extra]);
    bankLoaded = true;
  });
  return loading;
}

export const lessons: Lesson[] = inFileOrder(grammarFiles)
  .flatMap((file) => file.lessons)
  .sort((a, b) => CEFR_LEVELS.indexOf(a.level) - CEFR_LEVELS.indexOf(b.level) || a.order - b.order);

export const lessonById = new Map(lessons.map((l) => [l.id, l]));

export function wordsAtLevel(level: Cefr): Word[] {
  return words.filter((w) => w.cefr === level);
}
