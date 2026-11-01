import { useSyncExternalStore } from 'react';
import type { CustomDeck, Difficulty, Tone, Word } from '../types';
import { dayNumber, newCard, schedule, isDue, type CardState, type Rating } from './srs';

export type Theme = 'dark' | 'light' | 'system';

export interface Settings {
  dailyGoal: number;
  newPerDay: number;
  autoSpeak: boolean;
  voiceURI: string;
  rate: number;
  theme: Theme;
  name: string;
}

export type LogKind = 'study' | 'practice' | 'quiz' | 'game';

export interface LogEntry {
  t: number;
  kind: LogKind;
  title: string;
  detail: string;
  xp: number;
}

export interface Progress {
  version: 1;
  xp: number;
  cards: Record<string, CardState>;
  /** Best quiz score (0–100) per lesson and difficulty. */
  grammar: Record<string, Partial<Record<Difficulty, number>>>;
  /** XP earned per day, keyed by dayNumber(). */
  days: Record<string, number>;
  /** Flashcard answers per day, keyed by dayNumber(). */
  reviews: Record<string, number>;
  /** Best score per game id. */
  games: Record<string, number>;
  /** Saved words: word id -> time saved. */
  starred: Record<string, number>;
  decks: Record<string, CustomDeck>;
  /** Words the learner typed in or imported, referenced from decks. */
  customWords: Record<string, Word>;
  /** Most recent activity first. */
  log: LogEntry[];
  settings: Settings;
}

const STORAGE_KEY = 'vuon-tu:progress:v1';
const MAX_LOG = 300;

export const DEFAULT_SETTINGS: Settings = {
  dailyGoal: 50,
  newPerDay: 20,
  autoSpeak: true,
  voiceURI: '',
  rate: 0.9,
  theme: 'dark',
  name: 'Học viên',
};

export function emptyProgress(): Progress {
  return {
    version: 1,
    xp: 0,
    cards: {},
    grammar: {},
    days: {},
    reviews: {},
    games: {},
    starred: {},
    decks: {},
    customWords: {},
    log: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Accepts anything parsed from storage or a backup file; returns null if it isn't a Vườn Từ save. */
export function parseProgress(raw: unknown): Progress | null {
  if (!isRecord(raw) || raw.version !== 1 || typeof raw.xp !== 'number' || !isRecord(raw.cards)) return null;
  const base = emptyProgress();
  const rec = <K extends keyof Progress>(key: K): Progress[K] => (isRecord(raw[key]) ? (raw[key] as Progress[K]) : base[key]);
  return {
    version: 1,
    xp: Math.max(0, raw.xp),
    cards: raw.cards as Progress['cards'],
    grammar: rec('grammar'),
    days: rec('days'),
    reviews: rec('reviews'),
    games: rec('games'),
    starred: rec('starred'),
    decks: rec('decks'),
    customWords: rec('customWords'),
    log: Array.isArray(raw.log) ? (raw.log as LogEntry[]).slice(0, MAX_LOG) : base.log,
    settings: { ...base.settings, ...(isRecord(raw.settings) ? raw.settings : {}) },
  };
}

function load(): Progress {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (text) return parseProgress(JSON.parse(text)) ?? emptyProgress();
  } catch {
    // Storage blocked (private mode) or corrupted: start fresh in memory.
  }
  return emptyProgress();
}

let state: Progress = load();
const listeners = new Set<() => void>();

function commit(next: Progress) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Progress still works for this visit even if it can't be saved.
  }
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  // Keep several open tabs in sync.
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    state = load();
    listeners.forEach((l) => l());
  });
}

export function getProgress(): Progress {
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, getProgress);
}

function withXp(p: Progress, amount: number, today = dayNumber()): Progress {
  if (amount <= 0) return p;
  const key = String(today);
  return { ...p, xp: p.xp + amount, days: { ...p.days, [key]: (p.days[key] ?? 0) + amount } };
}

export function addXp(amount: number) {
  commit(withXp(state, amount));
}

export function logActivity(kind: LogKind, title: string, detail: string, xp: number) {
  const entry: LogEntry = { t: Date.now(), kind, title, detail, xp };
  commit({ ...state, log: [entry, ...state.log].slice(0, MAX_LOG) });
}

/** Records a flashcard answer and returns the XP it earned. */
export function reviewCard(wordId: string, rating: Rating): number {
  const today = dayNumber();
  const key = String(today);
  const prev = state.cards[wordId];
  const xp = (rating === 'again' ? 1 : 2) + (prev ? 0 : 3);
  const cards = { ...state.cards, [wordId]: schedule(prev, rating, today) };
  const reviews = { ...state.reviews, [key]: (state.reviews[key] ?? 0) + 1 };
  commit(withXp({ ...state, cards, reviews }, xp, today));
  return xp;
}

export function addToReview(wordId: string) {
  if (state.cards[wordId]) return;
  commit({ ...state, cards: { ...state.cards, [wordId]: newCard(dayNumber()) } });
}

export function toggleStar(wordId: string) {
  const starred = { ...state.starred };
  if (starred[wordId]) delete starred[wordId];
  else starred[wordId] = Date.now();
  commit({ ...state, starred });
}

export function saveQuizResult(lessonId: string, difficulty: Difficulty, percent: number, xp: number, log?: { title: string; detail: string }) {
  const prev = state.grammar[lessonId] ?? {};
  const best = Math.max(prev[difficulty] ?? 0, percent);
  const grammar = { ...state.grammar, [lessonId]: { ...prev, [difficulty]: best } };
  const entries = log ? [{ t: Date.now(), kind: 'quiz' as const, ...log, xp }, ...state.log].slice(0, MAX_LOG) : state.log;
  commit(withXp({ ...state, grammar, log: entries }, xp));
}

/** Saves a game result and logs it; returns true when it beats the previous best. */
export function saveGameResult(
  gameId: string,
  score: number,
  xp: number,
  opts: { title: string; detail: string; lowerIsBetter?: boolean },
): boolean {
  const prev = state.games[gameId];
  const record = prev === undefined ? score > 0 : opts.lowerIsBetter ? score < prev : score > prev;
  const games = record ? { ...state.games, [gameId]: score } : state.games;
  const entry: LogEntry = { t: Date.now(), kind: 'game', title: opts.title, detail: opts.detail, xp };
  commit(withXp({ ...state, games, log: [entry, ...state.log].slice(0, MAX_LOG) }, xp));
  return record;
}

// ---- personal decks ----

function newId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function createDeck(name: string, description: string, icon: string, tone: Tone): string {
  const id = newId('d');
  const deck: CustomDeck = { id, name, description, icon, tone, createdAt: Date.now(), wordIds: [] };
  commit({ ...state, decks: { ...state.decks, [id]: deck } });
  return id;
}

export function updateDeck(id: string, patch: Partial<Pick<CustomDeck, 'name' | 'description' | 'icon' | 'tone'>>) {
  const deck = state.decks[id];
  if (!deck) return;
  commit({ ...state, decks: { ...state.decks, [id]: { ...deck, ...patch } } });
}

export function deleteDeck(id: string) {
  const deck = state.decks[id];
  if (!deck) return;
  const decks = { ...state.decks };
  delete decks[id];
  // Drop words that only this deck used.
  const stillUsed = new Set(Object.values(decks).flatMap((d) => d.wordIds));
  const customWords = { ...state.customWords };
  for (const wid of deck.wordIds) if (customWords[wid] && !stillUsed.has(wid)) delete customWords[wid];
  commit({ ...state, decks, customWords });
}

/** Adds existing words (built-in or custom) to a deck; returns how many were new to it. */
export function addWordsToDeck(deckId: string, wordIds: string[]): number {
  const deck = state.decks[deckId];
  if (!deck) return 0;
  const have = new Set(deck.wordIds);
  const fresh = [...new Set(wordIds)].filter((id) => !have.has(id));
  if (fresh.length === 0) return 0;
  commit({ ...state, decks: { ...state.decks, [deckId]: { ...deck, wordIds: [...deck.wordIds, ...fresh] } } });
  return fresh.length;
}

export type NewWord = Pick<Word, 'word' | 'meaningVi'> & Partial<Pick<Word, 'ipa' | 'pos' | 'cefr' | 'example' | 'exampleVi'>>;

/** Creates learner-typed words inside a deck; returns how many were added. */
export function addCustomWords(deckId: string, items: NewWord[]): number {
  const deck = state.decks[deckId];
  if (!deck || items.length === 0) return 0;
  const existing = new Set(deck.wordIds.map((id) => state.customWords[id]?.word.toLowerCase()).filter(Boolean));
  const customWords = { ...state.customWords };
  const ids: string[] = [];
  for (const item of items) {
    const key = item.word.trim().toLowerCase();
    if (!key || existing.has(key)) continue;
    existing.add(key);
    const id = newId('c');
    customWords[id] = {
      id,
      word: item.word.trim(),
      meaningVi: item.meaningVi.trim(),
      ipa: item.ipa?.trim() ?? '',
      pos: item.pos ?? 'phrase',
      cefr: item.cefr ?? 'B1',
      example: item.example?.trim() ?? '',
      exampleVi: item.exampleVi?.trim() ?? '',
      collocations: [],
      synonyms: [],
      topicId: `custom:${deckId}`,
    };
    ids.push(id);
  }
  commit({ ...state, customWords, decks: { ...state.decks, [deckId]: { ...deck, wordIds: [...deck.wordIds, ...ids] } } });
  return ids.length;
}

export function removeWordFromDeck(deckId: string, wordId: string) {
  const deck = state.decks[deckId];
  if (!deck) return;
  const decks = { ...state.decks, [deckId]: { ...deck, wordIds: deck.wordIds.filter((id) => id !== wordId) } };
  const customWords = { ...state.customWords };
  if (customWords[wordId] && !Object.values(decks).some((d) => d.wordIds.includes(wordId))) delete customWords[wordId];
  commit({ ...state, decks, customWords });
}

export function updateSettings(patch: Partial<Settings>) {
  commit({ ...state, settings: { ...state.settings, ...patch } });
}

export function replaceProgress(next: Progress) {
  commit(next);
}

export function resetProgress() {
  // Personal decks are the learner's own content, so they survive a progress reset.
  commit({ ...emptyProgress(), settings: state.settings, decks: state.decks, customWords: state.customWords });
}

// ---- derived values ----

export function dueWordIds(p: Progress, today: number): string[] {
  return Object.entries(p.cards)
    .filter(([, c]) => isDue(c, today))
    .sort(([, a], [, b]) => a.due - b.due)
    .map(([id]) => id);
}

export function newCardsToday(p: Progress, today: number): number {
  return Object.values(p.cards).filter((c) => c.added === today).length;
}

export function newLeftToday(p: Progress, today: number): number {
  return Math.max(0, p.settings.newPerDay - newCardsToday(p, today));
}

export function streak(p: Progress, today: number): number {
  const studied = (day: number) => (p.days[String(day)] ?? 0) > 0;
  // An unfinished today doesn't break a streak that ran through yesterday.
  let day = studied(today) ? today : today - 1;
  let count = 0;
  while (studied(day)) {
    count += 1;
    day -= 1;
  }
  return count;
}

export function longestStreak(p: Progress): number {
  const days = Object.keys(p.days)
    .filter((d) => p.days[d] > 0)
    .map(Number)
    .sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  days.forEach((d, i) => {
    run = i > 0 && d === days[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

export const PASS_PERCENT = 75;

export function lessonStatus(scores: Partial<Record<Difficulty, number>> | undefined): 'new' | 'started' | 'done' {
  if (!scores || Object.keys(scores).length === 0) return 'new';
  return (['easy', 'medium', 'hard'] as const).every((d) => (scores[d] ?? 0) >= PASS_PERCENT) ? 'done' : 'started';
}
