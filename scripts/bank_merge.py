"""Merges finished chunks (data-src/bank/out and data-src/bank/extra) into src/data/bank/bank-<LEVEL>.json.

Usage: python3 -I scripts/bank_merge.py
Each row is [headword, ipa, [parts of speech], level, meaning, example, example translation, topic,
[collocations], [synonyms]]. Chunks that are missing or don't line up with their input are skipped and reported.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
IN = ROOT / 'data-src' / 'bank' / 'in'
OUT = ROOT / 'data-src' / 'bank' / 'out'
EXTRA = ROOT / 'data-src' / 'bank' / 'extra'
DEST = ROOT / 'src' / 'data' / 'bank'
LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
# Typos and wrong parts of speech in the source lists: headword -> (fixed headword, fixed parts of speech or None).
CORRECTIONS = {
    'porten': ('portent', None),
    'misdemanour': ('misdemeanour', None),
    'flatout': ('flat out', None),
    'taste-maker': ('tastemaker', None),
    'minster': ('minster', ['noun']),
    'automatic': ('automatic', ['adjective']),
    'weep': ('weep', ['verb']),
    'exaggerate': ('exaggerate', ['verb']),
    'chauffer': ('chauffeur', None),
    'wornout': ('worn-out', None),
    'enviable': ('enviable', ['adjective']),
    'blurt': ('blurt', ['verb']),
    'bombard': ('bombard', ['verb']),
    'brag': ('brag', ['verb']),
    'anticancer': ('anticancer', ['adjective']),
    'antipollution': ('antipollution', ['adjective']),
    'wizard': ('wizard', ['noun']),
}
# Entries rewritten by hand after review: headword -> fields to replace.
FIELD_OVERRIDES = {
    'wizard': {
        'm': 'phù thuỷ, pháp sư; người cực giỏi (về việc gì)',
        'e': 'She is a real wizard with numbers and spreadsheets.',
        'ev': 'Cô ấy đúng là bậc thầy về con số và bảng tính.',
        'col': ['a computer wizard', 'a financial wizard', 'a wizard with numbers'],
        'syn': ['expert', 'genius'],
    },
}
# Slurs and words that are not real English, left out of the app.
DROP = {'gook', 'retard', 'unscathing', 'bereftly'}


def load_extra(name, expected):
    """Collocations and synonyms for one chunk, or None if not written yet or misaligned."""
    path = EXTRA / name
    if not path.exists():
        return None
    try:
        rows = json.loads(path.read_text())
    except json.JSONDecodeError:
        return None
    if len(rows) != len(expected) or any(r.get('h') != e['h'] for r, e in zip(rows, expected)):
        return None
    return rows


def main():
    by_level = {lvl: [] for lvl in LEVELS}
    missing, broken, missing_extra = [], [], []
    for in_path in sorted(IN.glob('chunk-*.json')):
        out_path = OUT / in_path.name
        if not out_path.exists():
            missing.append(in_path.stem)
            continue
        expected = json.loads(in_path.read_text())
        try:
            got = json.loads(out_path.read_text())
        except json.JSONDecodeError:
            broken.append(in_path.stem)
            continue
        if len(got) != len(expected) or any(g.get('h') != e['h'] for g, e in zip(got, expected)):
            broken.append(in_path.stem)
            continue
        extra = load_extra(in_path.name, expected)
        if extra is None:
            missing_extra.append(in_path.stem)
        for i, (e, g) in enumerate(zip(expected, got)):
            if e['h'] in DROP:
                continue
            ipa = g['ipa'].strip().replace('\u0261', 'g')  # IPA script g -> plain g, as in the hand-written words
            head, pos = CORRECTIONS.get(e['h'], (e['h'], None))
            g = {**g, **FIELD_OVERRIDES.get(e['h'], {})}
            col, syn = (extra[i]['col'], extra[i]['syn']) if extra else ([], [])
            col, syn = g.get('col', col), g.get('syn', syn)
            col = [c.strip() for c in col if c.strip()]
            syn = [x.strip() for x in syn if x.strip() and x.strip().lower() != head.lower()]
            by_level[e['c']].append([head, ipa, pos or e['p'], e['c'], g['m'].strip(), g['e'].strip(), g['ev'].strip(), g['t'], col, syn])

    DEST.mkdir(parents=True, exist_ok=True)
    total = 0
    for lvl, rows in by_level.items():
        (DEST / f'bank-{lvl}.json').write_text(json.dumps(rows, ensure_ascii=False, separators=(',', ':')))
        total += len(rows)
        print(f'bank-{lvl}.json: {len(rows)} words')
    print(f'total {total} words')
    if missing:
        print('missing chunks:', ', '.join(missing))
    if broken:
        print('BROKEN chunks (skipped):', ', '.join(broken))
    if missing_extra:
        print(f'chunks without collocations yet ({len(missing_extra)}):', ', '.join(missing_extra))


if __name__ == '__main__':
    main()
