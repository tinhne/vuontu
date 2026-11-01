export function normalizeAnswer(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/, '');
}

export function checkFill(input: string, answers: string[]): boolean {
  const given = normalizeAnswer(input);
  return given.length > 0 && answers.some((a) => normalizeAnswer(a) === given);
}

/** Lowercase and strip Vietnamese diacritics so "giao duc" finds "giáo dục". */
export function foldVi(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();
}

export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function sample<T>(items: readonly T[], n: number): T[] {
  return shuffle(items).slice(0, n);
}
