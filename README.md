# Vườn Từ

Web học tiếng Anh cho người Việt, chạy được như app (PWA) và dùng được khi không có mạng. Không cần đăng nhập: tiến độ lưu trong trình duyệt của người học.

- **Kho từ vựng hơn 8.700 từ** chia theo 6 trình độ CEFR (A1–C2) và 23 chủ đề IELTS. Mỗi từ có phiên âm, nghĩa tiếng Việt, câu ví dụ kèm bản dịch, 2–3 cụm từ đi kèm và (khi có từ phù hợp) từ đồng nghĩa để paraphrase.
- **Ôn tập ngắt quãng (SM-2):** kế hoạch ôn mỗi ngày, ôn theo từng bộ thẻ, chấm Quên / Khó / Nhớ / Dễ.
- **Luyện flashcard tự do:** lật thẻ Anh → Việt hoặc Việt → Anh, tự chạy, đánh dấu đã biết / chưa biết.
- **Bộ thẻ cá nhân:** tự tạo bộ, thêm từ có sẵn trong kho, tự nhập từ mới, nhập / xuất file CSV. Bấm sao để lưu nhanh vào “Từ đã lưu”.
- **Ngữ pháp CEFR:** 24 bài A1–C2, mỗi bài có lý thuyết, lỗi hay gặp và quiz 3 mức.
- **5 trò chơi:** Ghép đôi, Xếp chữ, Tốc độ 60 giây, Đúng hay Sai, Nghe chép. Chọn được nguồn từ (cả bộ thẻ cá nhân).
- **Tra từ điển** tiếng Anh hoặc tiếng Việt, có dấu hay không dấu.
- **Lịch sử học:** lịch 6 tháng, biểu đồ XP, kỷ lục, nhật ký hoạt động. Cây XP lớn qua 7 giai đoạn.
- Giao diện tối (mặc định) và sáng, dùng tốt trên điện thoại. Sao lưu / khôi phục tiến độ ra file.

## Chạy trên máy

Cần Node.js 20 trở lên.

```bash
npm install
npm run dev
```

Mở http://localhost:5173.

| Lệnh | Việc làm |
| --- | --- |
| `npm run dev` | Chạy bản phát triển, tự tải lại khi sửa code |
| `npm test` | Chạy test (ôn tập, tiến độ, bộ thẻ, CSV, kiểm tra toàn bộ dữ liệu) |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run build` | Build bản chạy thật vào `dist/` |
| `npm run preview` | Chạy thử bản trong `dist/` (có service worker, chạy được offline) |

## Đưa lên mạng

`dist/` là web tĩnh, đặt ở đâu cũng chạy, kể cả thư mục con (app dùng đường dẫn tương đối và `#/` cho các trang).

- **Netlify:** `npm run build`, rồi kéo thả thư mục `dist` vào https://app.netlify.com/drop.
- **Vercel / Cloudflare Pages / GitHub Pages:** lệnh build `npm run build`, thư mục xuất bản `dist`.

Cần HTTPS (các dịch vụ trên đều có sẵn) để trình duyệt cho cài app và chạy offline.

## Dữ liệu

| Ở đâu | Nội dung |
| --- | --- |
| `src/data/vocab-*.json` | 288 từ chủ đề cốt lõi, viết tay |
| `src/data/bank/bank-<LEVEL>.json` | Kho từ lớn, chia theo trình độ, tải một lần lúc mở app |
| `src/data/grammar-*.json` | Bài ngữ pháp và quiz |
| `src/data/topics.ts` | Danh sách 23 chủ đề IELTS |

App tự nhận mọi file `vocab-*.json` và `grammar-*.json`, nên thêm file mới là xong, không phải sửa code. Sau khi sửa dữ liệu, chạy `npm test` để kiểm tra id trùng, thiếu trường, đáp án quiz sai chỗ…

### Kho từ lớn được tạo thế nào

1. `python3 -I scripts/bank_prepare.py` đọc danh sách từ theo trình độ trong `data-src/` và chia thành các lô 200 từ (`data-src/bank/in/`).
2. Mỗi lô được soạn phiên âm, nghĩa, ví dụ và chủ đề vào `data-src/bank/out/` (kiểm tra bằng `scripts/bank_check.py`), rồi cụm từ đi kèm và từ đồng nghĩa vào `data-src/bank/extra/` (kiểm tra bằng `scripts/bank_check_extra.py`).
3. `python3 -I scripts/bank_merge.py` gộp các lô thành `src/data/bank/bank-<LEVEL>.json` (kèm bảng sửa lỗi chính tả của danh sách gốc).

## Bản quyền và nguồn

- Nghĩa tiếng Việt, câu ví dụ, bản dịch và bài ngữ pháp được biên soạn mới cho dự án này, không sao chép từ sách, web hay app khác.
- Danh sách từ và trình độ A1–B2 dựa trên **The CEFR-J Wordlist Version 1.5**, Tono Laboratory, Tokyo University of Foreign Studies (dùng miễn phí cả cho mục đích thương mại, cần ghi nguồn), qua [Open Language Profiles](https://github.com/openlanguageprofiles/olp-en-cefrj).
- Danh sách từ C1–C2 dựa trên **Octanove Vocabulary Profile C1/C2 1.0** của Octanove Labs, giấy phép [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Phần dữ liệu dẫn xuất từ danh sách này cũng theo CC BY-SA 4.0.
- Phông chữ Be Vietnam Pro, giấy phép SIL Open Font License 1.1.
