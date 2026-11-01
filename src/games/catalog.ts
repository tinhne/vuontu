import { Headphones, Puzzle, Shuffle, Zap, CircleHelp, type LucideIcon } from 'lucide-react';
import type { Tone } from '../types';

export interface GameInfo {
  id: string;
  name: string;
  tag: string;
  tone: Tone;
  icon: LucideIcon;
  desc: string;
  rules: string[];
  skill: string;
  unit: string;
  lowerIsBetter?: boolean;
  needsSpeech?: boolean;
}

export const GAMES: GameInfo[] = [
  {
    id: 'match',
    name: 'Ghép đôi',
    tag: 'Phản xạ',
    tone: 'rose',
    icon: Puzzle,
    desc: 'Nối 6 từ tiếng Anh với nghĩa tiếng Việt nhanh nhất có thể.',
    rules: [
      'Bấm một từ tiếng Anh rồi bấm nghĩa tiếng Việt tương ứng (hoặc ngược lại).',
      'Ghép đúng thì cặp đó mờ đi, ghép sai thì hai ô rung đỏ và tính một lần nhầm.',
      'Đồng hồ dừng khi ghép xong 6 cặp. Kỷ lục là thời gian ngắn nhất.',
      'XP: 1 điểm mỗi cặp, thưởng thêm tối đa 5 điểm nếu ít nhầm.',
    ],
    skill: 'Liên kết nhanh giữa mặt chữ và nghĩa.',
    unit: 'giây',
    lowerIsBetter: true,
  },
  {
    id: 'scramble',
    name: 'Xếp chữ',
    tag: 'Chính tả',
    tone: 'cyan',
    icon: Shuffle,
    desc: 'Nhìn nghĩa và loại từ, sắp xếp các chữ cái bị xáo trộn thành từ đúng.',
    rules: [
      'Bấm các ô chữ (hoặc gõ phím) theo đúng thứ tự để tạo thành từ.',
      'Bấm vào một ô đã đặt để xoá từ vị trí đó trở đi; phím Backspace xoá chữ cuối.',
      '“Gợi ý” điền giúp chữ cái đúng tiếp theo; “Bỏ qua” hiện đáp án.',
      'Mỗi từ đúng không dùng gợi ý được 3 điểm, có dùng gợi ý được 1 điểm. 10 từ mỗi lượt.',
    ],
    skill: 'Nhớ chính tả để viết đúng trong IELTS Writing.',
    unit: 'điểm',
  },
  {
    id: 'speed',
    name: 'Tốc độ 60 giây',
    tag: 'Tốc độ',
    tone: 'amber',
    icon: Zap,
    desc: 'Chọn nghĩa đúng cho càng nhiều từ càng tốt trong 60 giây.',
    rules: [
      'Mỗi câu có một từ tiếng Anh và 4 nghĩa. Bấm hoặc nhấn phím 1–4 để chọn.',
      'Trả lời đúng liên tiếp 3 câu trở lên để có chuỗi combo.',
      'Chọn sai không bị trừ điểm nhưng mất thời gian xem đáp án.',
      'Mỗi câu đúng được 1 điểm và 1 XP.',
    ],
    skill: 'Nhận diện nghĩa tức thì khi đọc.',
    unit: 'điểm',
  },
  {
    id: 'truefalse',
    name: 'Đúng hay Sai?',
    tag: 'Quyết đoán',
    tone: 'orange',
    icon: CircleHelp,
    desc: '5 giây cho mỗi câu: nghĩa hiện ra là đúng hay sai? Bạn có 3 mạng.',
    rules: [
      'Mỗi câu hiện một từ và một nghĩa tiếng Việt, có thể đúng hoặc sai.',
      'Bấm “Đúng” / “Sai”, hoặc dùng phím ← và →.',
      'Hết 5 giây hoặc trả lời sai thì mất một mạng. Hết 3 mạng là kết thúc.',
      'Mỗi câu đúng được 1 điểm và 1 XP. Thời gian rút ngắn dần khi điểm tăng.',
    ],
    skill: 'Ra quyết định nhanh về nghĩa của từ.',
    unit: 'điểm',
  },
  {
    id: 'dictation',
    name: 'Nghe chép',
    tag: 'Nghe',
    tone: 'violet',
    icon: Headphones,
    desc: 'Nghe phát âm rồi gõ lại từ cho đúng chính tả.',
    rules: [
      'Bấm loa để nghe lại, bấm biểu tượng ốc sên để nghe chậm.',
      'Gõ từ bạn nghe được rồi nhấn Enter để kiểm tra.',
      '“Xem nghĩa” giúp bạn đoán nhưng chỉ còn 2 điểm thay vì 3.',
      '10 từ mỗi lượt.',
    ],
    skill: 'Nối âm thanh với chính tả, hữu ích cho IELTS Listening.',
    unit: 'điểm',
    needsSpeech: true,
  },
];

export const gameById = new Map(GAMES.map((g) => [g.id, g]));
