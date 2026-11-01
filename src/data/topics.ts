import type { Tone } from '../types';

export interface TopicMeta {
  id: string;
  nameVi: string;
  nameEn: string;
  icon: string;
  tone: Tone;
  descriptionVi: string;
}

/** Every IELTS topic a word can be filed under. The first twelve also have hand-written word sets. */
export const TOPIC_META: TopicMeta[] = [
  { id: 'education', nameVi: 'Giáo dục', nameEn: 'Education', icon: '🎓', tone: 'blue', descriptionVi: 'Trường học, việc học và hệ thống giáo dục.' },
  { id: 'environment', nameVi: 'Môi trường', nameEn: 'Environment', icon: '🌿', tone: 'emerald', descriptionVi: 'Ô nhiễm, biến đổi khí hậu và bảo vệ môi trường.' },
  { id: 'technology', nameVi: 'Công nghệ', nameEn: 'Technology', icon: '💻', tone: 'cyan', descriptionVi: 'Máy tính, internet, mạng xã hội và đổi mới.' },
  { id: 'health', nameVi: 'Sức khỏe', nameEn: 'Health', icon: '🩺', tone: 'rose', descriptionVi: 'Bệnh tật, y tế, lối sống và dinh dưỡng.' },
  { id: 'work', nameVi: 'Công việc & Sự nghiệp', nameEn: 'Work & Careers', icon: '💼', tone: 'amber', descriptionVi: 'Nghề nghiệp, nơi làm việc và phát triển sự nghiệp.' },
  { id: 'crime', nameVi: 'Tội phạm & Pháp luật', nameEn: 'Crime & Law', icon: '⚖️', tone: 'violet', descriptionVi: 'Tội phạm, công lý, toà án và hình phạt.' },
  { id: 'media', nameVi: 'Truyền thông & Quảng cáo', nameEn: 'Media & Advertising', icon: '📺', tone: 'pink', descriptionVi: 'Báo chí, truyền hình, quảng cáo và tin tức.' },
  { id: 'travel', nameVi: 'Du lịch', nameEn: 'Travel & Tourism', icon: '🧳', tone: 'orange', descriptionVi: 'Chuyến đi, kỳ nghỉ, khách sạn và ngành du lịch.' },
  { id: 'cities', nameVi: 'Đô thị & Nhà ở', nameEn: 'Cities & Housing', icon: '🏙️', tone: 'blue', descriptionVi: 'Cuộc sống đô thị, quy hoạch và nhà ở.' },
  { id: 'family', nameVi: 'Gia đình & Xã hội', nameEn: 'Family & Society', icon: '👪', tone: 'amber', descriptionVi: 'Gia đình, các mối quan hệ và vấn đề xã hội.' },
  { id: 'economy', nameVi: 'Kinh tế & Kinh doanh', nameEn: 'Economy & Business', icon: '📈', tone: 'emerald', descriptionVi: 'Tiền bạc, thị trường, doanh nghiệp và thương mại.' },
  { id: 'science', nameVi: 'Khoa học & Nghiên cứu', nameEn: 'Science & Research', icon: '🔬', tone: 'cyan', descriptionVi: 'Thí nghiệm, phát minh và nghiên cứu khoa học.' },
  { id: 'food', nameVi: 'Ẩm thực', nameEn: 'Food & Drink', icon: '🍜', tone: 'orange', descriptionVi: 'Món ăn, nấu nướng, nhà hàng và thói quen ăn uống.' },
  { id: 'sport', nameVi: 'Thể thao & Giải trí', nameEn: 'Sports & Leisure', icon: '⚽', tone: 'emerald', descriptionVi: 'Thể thao, sở thích và hoạt động lúc rảnh rỗi.' },
  { id: 'arts', nameVi: 'Nghệ thuật & Văn hoá', nameEn: 'Arts & Culture', icon: '🎨', tone: 'pink', descriptionVi: 'Âm nhạc, hội hoạ, văn học, phim ảnh và truyền thống.' },
  { id: 'shopping', nameVi: 'Mua sắm & Thời trang', nameEn: 'Shopping & Fashion', icon: '🛍️', tone: 'rose', descriptionVi: 'Mua bán, quần áo, thời trang và tiêu dùng.' },
  { id: 'transport', nameVi: 'Giao thông', nameEn: 'Transport', icon: '🚆', tone: 'blue', descriptionVi: 'Phương tiện, đường sá, tắc đường và đi lại.' },
  { id: 'nature', nameVi: 'Thiên nhiên & Động vật', nameEn: 'Nature & Animals', icon: '🦋', tone: 'emerald', descriptionVi: 'Động vật, cây cối, phong cảnh và thời tiết.' },
  { id: 'people', nameVi: 'Con người & Tính cách', nameEn: 'People & Personality', icon: '🙂', tone: 'amber', descriptionVi: 'Cơ thể, ngoại hình, cảm xúc và tính cách.' },
  { id: 'government', nameVi: 'Chính trị & Toàn cầu', nameEn: 'Government & Global Issues', icon: '🏛️', tone: 'violet', descriptionVi: 'Chính phủ, chính sách, bầu cử và vấn đề quốc tế.' },
  { id: 'language', nameVi: 'Ngôn ngữ & Giao tiếp', nameEn: 'Language & Communication', icon: '💬', tone: 'cyan', descriptionVi: 'Nói, viết, giao tiếp và học ngôn ngữ.' },
  { id: 'home', nameVi: 'Nhà cửa & Sinh hoạt', nameEn: 'Home & Daily Life', icon: '🏠', tone: 'orange', descriptionVi: 'Đồ dùng trong nhà và thói quen hằng ngày.' },
  { id: 'general', nameVi: 'Từ thông dụng', nameEn: 'General Vocabulary', icon: '📘', tone: 'blue', descriptionVi: 'Từ chức năng và từ dùng chung cho mọi chủ đề.' },
];
