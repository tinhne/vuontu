import type { NewWord } from './progress';

/** Splits CSV/TSV text into rows, handling quoted fields with commas, quotes and line breaks. */
export function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"' && field === '') quoted = true;
    else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.map((r) => r.map((f) => f.trim())).filter((r) => r.some((f) => f !== ''));
}

export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const counts: [string, number][] = ['\t', ';', ','].map((d) => [d, firstLine.split(d).length - 1]);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ',';
}

const HEADER_ALIASES: Record<keyof ParsedColumns, string[]> = {
  word: ['word', 'term', 'english', 'từ', 'tu', 'từ vựng', 'front'],
  meaningVi: ['meaning', 'nghĩa', 'nghia', 'vietnamese', 'definition', 'back', 'meaningvi'],
  ipa: ['ipa', 'phiên âm', 'phien am', 'pronunciation'],
  pos: ['pos', 'loại từ', 'loai tu', 'type'],
  example: ['example', 'ví dụ', 'vi du', 'sentence'],
  exampleVi: ['example_vi', 'examplevi', 'dịch', 'dich', 'ví dụ dịch', 'translation'],
};

type ParsedColumns = { word: number; meaningVi: number; ipa: number; pos: number; example: number; exampleVi: number };

export interface CsvResult {
  words: NewWord[];
  skipped: number;
  hasHeader: boolean;
}

/**
 * Reads a word list. With a header row, columns are matched by name; without one the order is
 * word, meaning, example, example translation, IPA.
 */
export function parseWordCsv(text: string): CsvResult {
  const rows = parseDelimited(text.replace(/^﻿/, ''), detectDelimiter(text));
  if (rows.length === 0) return { words: [], skipped: 0, hasHeader: false };

  const header = rows[0].map((h) => h.toLowerCase());
  const find = (key: keyof ParsedColumns) => header.findIndex((h) => HEADER_ALIASES[key].includes(h));
  const hasHeader = find('word') !== -1 && find('meaningVi') !== -1;
  const cols: ParsedColumns = hasHeader
    ? { word: find('word'), meaningVi: find('meaningVi'), ipa: find('ipa'), pos: find('pos'), example: find('example'), exampleVi: find('exampleVi') }
    : { word: 0, meaningVi: 1, example: 2, exampleVi: 3, ipa: 4, pos: -1 };

  const out: NewWord[] = [];
  let skipped = 0;
  for (const r of hasHeader ? rows.slice(1) : rows) {
    const get = (i: number) => (i >= 0 ? (r[i] ?? '').trim() : '');
    const word = get(cols.word);
    const meaningVi = get(cols.meaningVi);
    if (!word || !meaningVi) {
      skipped += 1;
      continue;
    }
    const ipaRaw = get(cols.ipa);
    out.push({
      word,
      meaningVi,
      ipa: ipaRaw && !ipaRaw.startsWith('/') ? `/${ipaRaw}/` : ipaRaw,
      example: get(cols.example),
      exampleVi: get(cols.exampleVi),
    });
  }
  return { words: out, skipped, hasHeader };
}

function escape(field: string): string {
  return /[",\n\r]/.test(field) ? `"${field.replace(/"/g, '""')}"` : field;
}

export function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map(escape).join(',')).join('\n');
}
