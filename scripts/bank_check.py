"""Checks one generated chunk against its input list.

Usage: python3 -I scripts/bank_check.py data-src/bank/out/chunk-07.json
Prints ERROR lines (must fix) and WARN lines (look at them), then a summary.
"""
import json
import pathlib
import re
import sys

TOPICS = {
    'education', 'environment', 'technology', 'health', 'work', 'crime', 'media', 'travel', 'cities',
    'family', 'economy', 'science', 'food', 'sport', 'arts', 'shopping', 'transport', 'nature',
    'people', 'government', 'language', 'home', 'general',
}
FIELDS = ['h', 'ipa', 'm', 'e', 'ev', 't']


def main(path_str: str) -> int:
    out_path = pathlib.Path(path_str)
    in_path = out_path.parent.parent / 'in' / out_path.name
    expected = json.loads(in_path.read_text())
    try:
        got = json.loads(out_path.read_text())
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
        err('top level must be a JSON array')
        return 1
    if len(got) != len(expected):
        err(f'{len(got)} entries, expected {len(expected)}')
    for i, (want, entry) in enumerate(zip(expected, got)):
        label = f'#{i + 1} {want["h"]!r}'
        if not isinstance(entry, dict):
            err(f'{label}: not an object')
            continue
        missing = [f for f in FIELDS if not isinstance(entry.get(f), str) or not entry[f].strip()]
        if missing:
            err(f'{label}: missing/empty {missing}')
            continue
        extra = set(entry) - set(FIELDS)
        if extra:
            err(f'{label}: unexpected keys {sorted(extra)}')
        if entry['h'] != want['h']:
            err(f'{label}: headword changed to {entry["h"]!r} (keep input order and spelling)')
        if not re.fullmatch(r'/[^/]+/', entry['ipa']) or 'ɹ' in entry['ipa']:
            err(f'{label}: ipa must look like /ɪnˈvaɪrənmənt/ (got {entry["ipa"]!r})')
        if entry['t'] not in TOPICS:
            err(f'{label}: unknown topic {entry["t"]!r}')
        if len(entry['m']) > 90:
            warn(f'{label}: meaning is long ({len(entry["m"])} chars)')
        n_words = len(entry['e'].split())
        if not 4 <= n_words <= 22:
            warn(f'{label}: example has {n_words} words')
        stem = want['h'].lower().strip("'.")[:4]
        if stem and stem not in entry['e'].lower():
            warn(f'{label}: example may not contain the headword (fine for irregular forms)')
        if not re.search(r'[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]', entry['m'].lower()):
            warn(f'{label}: meaning has no Vietnamese diacritics')

    print(f'SUMMARY {out_path.name}: {len(got)} entries, {errors} errors, {warnings} warnings')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
