export type Cefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export const CEFR_LEVELS: Cefr[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const CEFR_NAMES: Record<Cefr, string> = {
  A1: 'Sơ cấp',
  A2: 'Sơ trung cấp',
  B1: 'Trung cấp',
  B2: 'Trung cao cấp',
  C1: 'Cao cấp',
  C2: 'Thành thạo',
};

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'phrase'
  | 'pronoun'
  | 'preposition'
  | 'determiner'
  | 'conjunction'
  | 'number'
  | 'modal'
  | 'interjection'
  | 'particle';

export const POS_VI: Record<PartOfSpeech, string> = {
  noun: 'danh từ',
  verb: 'động từ',
  adjective: 'tính từ',
  adverb: 'trạng từ',
  phrase: 'cụm từ',
  pronoun: 'đại từ',
  preposition: 'giới từ',
  determiner: 'từ hạn định',
  conjunction: 'liên từ',
  number: 'số từ',
  modal: 'động từ khuyết thiếu',
  interjection: 'thán từ',
  particle: 'tiểu từ',
};

export interface Word {
  id: string;
  word: string;
  ipa: string;
  pos: PartOfSpeech;
  /** Every part of speech when the word has more than one (bank words). */
  posAll?: PartOfSpeech[];
  cefr: Cefr;
  meaningVi: string;
  example: string;
  exampleVi: string;
  collocations: string[];
  synonyms: string[];
  /** Topic id for built-in words, `custom:<deckId>` for words the learner typed in. */
  topicId: string;
}

export function posLabel(w: Pick<Word, 'pos' | 'posAll'>): string {
  return (w.posAll ?? [w.pos]).map((p) => POS_VI[p] ?? p).join(', ');
}

export interface Topic {
  id: string;
  nameVi: string;
  nameEn: string;
  icon: string;
  tone?: Tone;
  descriptionVi: string;
  words: Word[];
}

export interface Example {
  en: string;
  vi: string;
}

export interface LessonSection {
  headingVi: string;
  bodyVi: string;
  examples: Example[];
}

export interface Mistake {
  wrong: string;
  right: string;
  noteVi: string;
}

export interface McqQuestion {
  type: 'mcq';
  prompt: string;
  options: string[];
  answer: number;
  explanationVi: string;
}

export interface FillQuestion {
  type: 'fill';
  prompt: string;
  answers: string[];
  explanationVi: string;
}

export type Question = McqQuestion | FillQuestion;

export type Difficulty = 'easy' | 'medium' | 'hard';
export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
export const DIFFICULTY_VI: Record<Difficulty, string> = { easy: 'Dễ', medium: 'Vừa', hard: 'Khó' };

export interface Lesson {
  id: string;
  level: Cefr;
  order: number;
  titleVi: string;
  titleEn: string;
  summaryVi: string;
  sections: LessonSection[];
  mistakes: Mistake[];
  quiz: Record<Difficulty, Question[]>;
}

export const TONES = ['emerald', 'blue', 'violet', 'amber', 'rose', 'cyan', 'orange', 'pink'] as const;
export type Tone = (typeof TONES)[number];

export interface CustomDeck {
  id: string;
  name: string;
  description: string;
  icon: string;
  tone: Tone;
  createdAt: number;
  wordIds: string[];
}
