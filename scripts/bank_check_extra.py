"""Checks one collocations/synonyms chunk against its input list.

Usage: python3 -I scripts/bank_check_extra.py data-src/bank/extra/chunk-07.json
Prints ERROR lines (must fix) and WARN lines (look at them), then a summary.
"""
import json
import pathlib
import sys


def main(path_str: str) -> int:
    path = pathlib.Path(path_str)
    expected = json.loads((path.parent.parent / 'in' / path.name).read_text())
    try:
        got = json.loads(path.read_text())
    except json.JSONDecodeError as exc:
        print(f'ERROR not valid JSON: {exc}')
        return 1

    errors = warnings = 0

    def err(msg):
        nonlocal errors
        errors += 1
        print('ERROR', msg)

    def warn(msg):
        nonlocal warnings
        warnings += 1
        print('WARN ', msg)

    if not isinstance(got, list):
        print('ERROR top level must be a JSON array')
        return 1
    if len(got) != len(expected):
        err(f'{len(got)} entries, expected {len(expected)}')
    for i, (want, entry) in enumerate(zip(expected, got)):
        head = want['h']
        label = f'#{i + 1} {head!r}'
        if not isinstance(entry, dict) or set(entry) != {'h', 'col', 'syn'}:
            err(f'{label}: must be an object with exactly the keys h, col, syn')
            continue
        if entry['h'] != head:
            err(f'{label}: headword changed to {entry["h"]!r} (keep input order and spelling)')
        col, syn = entry['col'], entry['syn']
        if not isinstance(col, list) or not 1 <= len(col) <= 3 or not all(isinstance(c, str) and c.strip() for c in col):
            err(f'{label}: col must be 1-3 non-empty strings')
        else:
            for c in col:
                if len(c) > 40 or not 1 <= len(c.split()) <= 6:
                    err(f'{label}: collocation too long: {c!r}')
                if c != c.strip() or c.endswith(('.', ',', ';')):
                    err(f'{label}: trim spaces/punctuation in {c!r}')
            stem = head.lower().strip("'.")[:4]
            if stem and not any(stem in c.lower() for c in col):
                warn(f'{label}: no collocation seems to contain the headword (fine for irregular forms)')
            if len(set(c.lower() for c in col)) != len(col):
                err(f'{label}: duplicate collocations')
        if not isinstance(syn, list) or len(syn) > 2 or not all(isinstance(s, str) and s.strip() for s in syn):
            err(f'{label}: syn must be 0-2 non-empty strings')
        elif any(s.strip().lower() == head.lower() for s in syn):
            err(f'{label}: a synonym repeats the headword')

    print(f'SUMMARY {path.name}: {len(got)} entries, {errors} errors, {warnings} warnings')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
