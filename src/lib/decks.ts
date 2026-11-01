import { topicById, topics, wordById, words, wordsAtLevel } from '../data';
import { CEFR_LEVELS, CEFR_NAMES, type Cefr, type Tone, type Word } from '../types';
import type { Progress } from './progress';
import { isDue } from './srs';

export type DeckKind = 'all' | 'level' | 'topic' | 'custom' | 'starred';

export interface DeckInfo {
  id: string;
  kind: DeckKind;
  title: string;
  subtitle: string;
  /** Emoji or short text shown in the deck's tile. */
  icon: string;
  tone: Tone;
}

const LEVEL_TONE: Record<Cefr, Tone> = { A1: 'emerald', A2: 'emerald', B1: 'blue', B2: 'blue', C1: 'violet', C2: 'violet' };

export function findWord(id: string, p: Progress): Word | undefined {
  return wordById.get(id) ?? p.customWords[id];
}

export function allWords(p: Progress): Word[] {
  const custom = Object.values(p.customWords);
  return custom.length ? [...words, ...custom] : words;
}

function split(id: string): [DeckKind, string] {
  const i = id.indexOf(':');
  return i === -1 ? [id as DeckKind, ''] : [id.slice(0, i) as DeckKind, id.slice(i + 1)];
}

export function deckInfo(id: string, p: Progress): DeckInfo | undefined {
  const [kind, key] = split(id);
  switch (kind) {
    case 'all':
      return { id, kind, title: 'Toàn bộ kho từ', subtitle: 'Mọi chủ đề và trình độ', icon: '🌱', tone: 'emerald' };
    case 'level': {
      if (!CEFR_LEVELS.includes(key as Cefr)) return undefined;
      const level = key as Cefr;
      return { id, kind, title: `Từ vựng ${level}`, subtitle: CEFR_NAMES[level], icon: level, tone: LEVEL_TONE[level] };
    }
    case 'topic': {
      const t = topicById.get(key);
      return t && { id, kind, title: t.nameVi, subtitle: t.nameEn, icon: t.icon, tone: t.tone ?? 'blue' };
    }
    case 'custom': {
      const d = p.decks[key];
      return d && { id, kind, title: d.name, subtitle: d.description || 'Bộ thẻ của bạn', icon: d.icon, tone: d.tone };
    }
    case 'starred':
      return { id, kind, title: 'Từ đã lưu', subtitle: 'Những từ bạn đánh dấu sao', icon: '⭐', tone: 'amber' };
  }
  return undefined;
}

export function deckWords(id: string, p: Progress): Word[] {
  const [kind, key] = split(id);
  switch (kind) {
    case 'all':
      return allWords(p);
    case 'level':
      return wordsAtLevel(key as Cefr);
    case 'topic':
      return topicById.get(key)?.words ?? [];
    case 'custom':
      return (p.decks[key]?.wordIds ?? []).map((wid) => findWord(wid, p)).filter((w): w is Word => !!w);
    case 'starred':
      return Object.entries(p.starred)
        .sort(([, a], [, b]) => b - a)
        .map(([wid]) => findWord(wid, p))
        .filter((w): w is Word => !!w);
  }
  return [];
}

export interface DeckCounts {
  /** Seen today or forgotten, waiting to be relearned. */
  learning: number;
  /** Learned cards whose review date has come. */
  due: number;
  /** Never studied. */
  fresh: number;
  /** Interval of three weeks or more. */
  mastered: number;
  total: number;
}

export function deckCounts(list: Word[], p: Progress, today: number): DeckCounts {
  const counts: DeckCounts = { learning: 0, due: 0, fresh: 0, mastered: 0, total: list.length };
  for (const w of list) {
    const c = p.cards[w.id];
    if (!c) counts.fresh += 1;
    else {
      if (isDue(c, today)) {
        if (c.reps === 0) counts.learning += 1;
        else counts.due += 1;
      }
      if (c.interval >= 21) counts.mastered += 1;
    }
  }
  return counts;
}

export function levelDeckIds(): string[] {
  return CEFR_LEVELS.map((l) => `level:${l}`);
}

export function topicDeckIds(): string[] {
  return topics.map((t) => `topic:${t.id}`);
}

export function customDeckIds(p: Progress): string[] {
  return Object.values(p.decks)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((d) => `custom:${d.id}`);
}

/** Decks you can pick as a source for games and flashcard practice. */
export function sourceDeckIds(p: Progress): string[] {
  const ids = ['all', ...levelDeckIds(), ...topicDeckIds(), ...customDeckIds(p)];
  if (Object.keys(p.starred).length) ids.splice(1, 0, 'starred');
  return ids;
}
