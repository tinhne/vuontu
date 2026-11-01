# data-src

Source files for the word bank. The app itself only reads `src/data/bank/*.json`, which `scripts/bank_merge.py` builds from here.

- `cefrj-vocabulary-profile-1.5.csv`: The CEFR-J Wordlist Version 1.5, compiled by Yukio Tono, Tokyo University of Foreign Studies. Free for research and commercial use with citation. Obtained from https://github.com/openlanguageprofiles/olp-en-cefrj.
- `octanove-vocabulary-profile-c1c2-1.0.csv`: Octanove Vocabulary Profile C1/C2 1.0 by Octanove Labs, licensed under CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/).
- `bank/in/`: the word lists split into chunks by `scripts/bank_prepare.py`.
- `bank/out/`: IPA, Vietnamese meaning, example, translation and topic for each word (written for this project).
- `bank/extra/`: collocations and synonyms for each word (written for this project).
