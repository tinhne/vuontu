import { describe, expect, it } from 'vitest';
import { detectDelimiter, parseDelimited, parseWordCsv, toCsv } from './csv';

describe('parseDelimited', () => {
  it('handles quotes, escaped quotes and line breaks inside fields', () => {
    expect(parseDelimited('a,"b, c","say ""hi"""\r\nd,"e\nf",g', ',')).toEqual([
      ['a', 'b, c', 'say "hi"'],
      ['d', 'e\nf', 'g'],
    ]);
  });

  it('skips blank lines', () => {
    expect(parseDelimited('a,b\n\n\nc,d\n', ',')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });
});

describe('detectDelimiter', () => {
  it('picks tab, semicolon or comma from the first line', () => {
    expect(detectDelimiter('word\tmeaning\nx\ty')).toBe('\t');
    expect(detectDelimiter('word;meaning')).toBe(';');
    expect(detectDelimiter('word,meaning')).toBe(',');
    expect(detectDelimiter('justoneword')).toBe(',');
  });
});

describe('parseWordCsv', () => {
  it('maps columns by header name in any order', () => {
    const r = parseWordCsv('nghĩa,word,ipa\nkiên cường,resilient,rɪˈzɪliənt\n');
    expect(r.hasHeader).toBe(true);
    expect(r.words).toEqual([{ word: 'resilient', meaningVi: 'kiên cường', ipa: '/rɪˈzɪliənt/', example: '', exampleVi: '' }]);
  });

  it('uses word, meaning, example, translation order without a header', () => {
    const r = parseWordCsv('mitigate;giảm nhẹ;Trees mitigate heat.;Cây giảm nhiệt.\n;thiếu từ\n');
    expect(r.hasHeader).toBe(false);
    expect(r.skipped).toBe(1);
    expect(r.words[0]).toMatchObject({ word: 'mitigate', meaningVi: 'giảm nhẹ', example: 'Trees mitigate heat.', exampleVi: 'Cây giảm nhiệt.' });
  });

  it('ignores a byte-order mark from Excel', () => {
    expect(parseWordCsv('﻿word,meaning\nx,y').words).toHaveLength(1);
  });
});

describe('toCsv', () => {
  it('round-trips awkward fields', () => {
    const rows = [['a, b', 'say "hi"', 'line\nbreak', 'plain']];
    expect(parseDelimited(toCsv(rows), ',')).toEqual(rows);
  });
});
