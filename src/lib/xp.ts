export interface Stage {
  min: number;
  name: string;
  hint: string;
}

export const STAGES: Stage[] = [
  { min: 0, name: 'Hạt giống', hint: 'Học vài từ đầu tiên để hạt nảy mầm.' },
  { min: 30, name: 'Nảy mầm', hint: 'Mầm đã nhú. Ôn tập đều đặn để cây lớn nhanh.' },
  { min: 120, name: 'Cây con', hint: 'Cây đang ra lá. Thử thêm một bài ngữ pháp nhé.' },
  { min: 300, name: 'Cây non', hint: 'Thân cây đã cứng cáp hơn.' },
  { min: 600, name: 'Ra hoa', hint: 'Vườn bắt đầu nở hoa.' },
  { min: 1000, name: 'Kết trái', hint: 'Trái ngọt từ những ngày học chăm chỉ.' },
  { min: 1600, name: 'Cổ thụ', hint: 'Cây đã thành cổ thụ. Giữ chuỗi ngày học để vườn luôn xanh.' },
];

export function stageFor(xp: number) {
  let index = 0;
  while (index + 1 < STAGES.length && xp >= STAGES[index + 1].min) index += 1;
  const stage = STAGES[index];
  const next = STAGES[index + 1];
  const progress = next ? (xp - stage.min) / (next.min - stage.min) : 1;
  return { index, stage, next, progress };
}
