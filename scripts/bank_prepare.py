"""Builds data-src/bank/in/chunk-NN.json from the CEFR-J (A1–B2) and Octanove (C1–C2) word lists.

Usage: python3 -I scripts/bank_prepare.py
"""
import csv
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'data-src'
OUT = SRC / 'bank' / 'in'
CHUNK = 200
LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
POS_MAP = {
    'modal auxiliary': 'modal', 'be-verb': 'verb', 'do-verb': 'verb', 'have-verb': 'verb',
    'infinitive-to': 'particle', 'vern': 'verb',
}


def pick_spelling(raw: str) -> str:
    """'color/colour' -> 'colour' (British spelling for IELTS); 'a.m./A.M./am/AM' -> 'a.m.'."""
    parts = [p.strip() for p in raw.split('/') if p.strip()]
    if len(parts) == 2 and ' ' not in parts[0] + parts[1] and abs(len(parts[0]) - len(parts[1])) <= 3 \
            and parts[0][:3].lower() == parts[1][:3].lower():
        return parts[1]
    return parts[0]


def main():
    merged = {}
    for name in ['cefrj-vocabulary-profile-1.5.csv', 'octanove-vocabulary-profile-c1c2-1.0.csv']:
        for row in csv.DictReader(open(SRC / name, encoding='utf-8-sig')):
            pos = POS_MAP.get(row['pos'].strip(), row['pos'].strip())
            level = row['CEFR'].strip()
            if not pos or level not in LEVELS:
                continue
            head = pick_spelling(row['headword'])
            entry = merged.setdefault(head, {'h': head, 'p': [], 'c': level})
            if pos not in entry['p']:
                entry['p'].append(pos)
            if LEVELS.index(level) < LEVELS.index(entry['c']):
                entry['c'] = level

    words = sorted(merged.values(), key=lambda e: (LEVELS.index(e['c']), e['h'].lower()))
    for old in OUT.glob('chunk-*.json'):
        old.unlink()
    for i in range(0, len(words), CHUNK):
        chunk = words[i:i + CHUNK]
        (OUT / f'chunk-{i // CHUNK + 1:02d}.json').write_text(json.dumps(chunk, ensure_ascii=False, indent=0))
    print(f'{len(words)} words -> {(len(words) + CHUNK - 1) // CHUNK} chunks')


if __name__ == '__main__':
    main()
