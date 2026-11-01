import { useRef, useState } from 'react';
import { Download, Smartphone, Trash2, Upload } from 'lucide-react';
import { getProgress, parseProgress, replaceProgress, resetProgress, updateSettings, useProgress, type Theme } from '../lib/progress';
import { canSpeak, speak, useEnglishVoices } from '../lib/speech';
import { isIos, isStandalone, promptInstall, useCanInstall } from '../lib/install';

export default function SettingsPage() {
  const p = useProgress();
  const s = p.settings;
  const voices = useEnglishVoices();
  const canInstall = useCanInstall();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  const exportProgress = () => {
    const blob = new Blob([JSON.stringify(getProgress(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vuon-tu-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Đã tải file sao lưu.');
  };

  const importProgress = async (file: File) => {
    try {
      const parsed = parseProgress(JSON.parse(await file.text()));
      if (!parsed) throw new Error('invalid');
      replaceProgress(parsed);
      setMessage(`Đã khôi phục: ${Object.keys(parsed.cards).length} từ, ${parsed.xp} XP.`);
    } catch {
      setMessage('File không hợp lệ. Hãy chọn file .json được tải từ nút “Sao lưu”.');
    }
  };

  return (
    <div className="page narrow">
      <h1>Cài đặt</h1>

      <section className="card settings">
        <h2>Hồ sơ & giao diện</h2>
        <label className="setting">
          <span>
            <b>Tên hiển thị</b>
            <span className="muted small">Hiện ở lời chào và góc dưới thanh bên.</span>
          </span>
          <input className="input" maxLength={30} value={s.name} onChange={(e) => updateSettings({ name: e.target.value })} aria-label="Tên hiển thị" />
        </label>
        <label className="setting">
          <span>
            <b>Giao diện</b>
            <span className="muted small">Cũng đổi nhanh được bằng nút mặt trời / mặt trăng ở góc trên.</span>
          </span>
          <select value={s.theme} onChange={(e) => updateSettings({ theme: e.target.value as Theme })}>
            <option value="dark">Tối</option>
            <option value="light">Sáng</option>
            <option value="system">Theo hệ thống</option>
          </select>
        </label>
      </section>

      <section className="card settings">
        <h2>Mục tiêu học</h2>
        <label className="setting">
          <span>
            <b>Mục tiêu XP mỗi ngày</b>
            <span className="muted small">Đạt mục tiêu để giữ chuỗi ngày học.</span>
          </span>
          <select value={s.dailyGoal} onChange={(e) => updateSettings({ dailyGoal: Number(e.target.value) })}>
            {[20, 50, 100, 150].map((n) => (
              <option key={n} value={n}>
                {n} XP
              </option>
            ))}
          </select>
        </label>
        <label className="setting">
          <span>
            <b>Số từ mới mỗi ngày</b>
            <span className="muted small">Từ ôn tập không bị giới hạn.</span>
          </span>
          <select value={s.newPerDay} onChange={(e) => updateSettings({ newPerDay: Number(e.target.value) })}>
            {[5, 10, 15, 20, 30, 50].map((n) => (
              <option key={n} value={n}>
                {n} từ
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="card settings">
        <h2>Phát âm</h2>
        {!canSpeak && <p className="muted">Trình duyệt này không hỗ trợ đọc phát âm.</p>}
        {canSpeak && (
          <>
            <label className="setting">
              <span>
                <b>Giọng đọc</b>
                <span className="muted small">Giọng có sẵn trong máy của bạn.</span>
              </span>
              <select value={s.voiceURI} onChange={(e) => updateSettings({ voiceURI: e.target.value })}>
                <option value="">Tự chọn (ưu tiên giọng Anh-Anh)</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </label>
            <label className="setting">
              <span>
                <b>Tốc độ đọc</b>
                <span className="muted small">{s.rate.toFixed(2)}×</span>
              </span>
              <input type="range" min={0.6} max={1.2} step={0.05} value={s.rate} onChange={(e) => updateSettings({ rate: Number(e.target.value) })} />
            </label>
            <label className="setting">
              <span>
                <b>Tự đọc từ khi lật thẻ mới</b>
              </span>
              <input type="checkbox" checked={s.autoSpeak} onChange={(e) => updateSettings({ autoSpeak: e.target.checked })} />
            </label>
            <button type="button" className="btn ghost small" onClick={() => speak('The quick brown fox jumps over the lazy dog.')}>
              Nghe thử
            </button>
          </>
        )}
      </section>

      <section className="card settings">
        <h2>
          <Smartphone size={20} /> Cài app lên máy
        </h2>
        {isStandalone ? (
          <p className="muted">Bạn đang dùng Vườn Từ dưới dạng app. Mọi thứ vẫn chạy khi không có mạng.</p>
        ) : canInstall ? (
          <>
            <p className="muted">Cài để có biểu tượng riêng, mở cửa sổ riêng và học được khi không có mạng.</p>
            <button type="button" className="btn" onClick={promptInstall}>
              Cài đặt Vườn Từ
            </button>
          </>
        ) : isIos ? (
          <p className="muted">Trên iPhone/iPad: mở bằng Safari, bấm nút Chia sẻ rồi chọn “Thêm vào MH chính”.</p>
        ) : (
          <p className="muted">Trên Chrome/Edge: bấm biểu tượng cài đặt ở thanh địa chỉ. Trên Safari (Mac): menu Tệp → Thêm vào Dock.</p>
        )}
      </section>

      <section className="card settings">
        <h2>Dữ liệu</h2>
        <p className="muted">Tiến độ chỉ lưu trong trình duyệt này. Sao lưu ra file để chuyển sang máy khác hoặc phòng khi xoá dữ liệu trình duyệt.</p>
        <div className="btn-row">
          <button type="button" className="btn ghost" onClick={exportProgress}>
            <Download size={18} /> Sao lưu
          </button>
          <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()}>
            <Upload size={18} /> Khôi phục
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importProgress(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              if (confirm('Xoá toàn bộ tiến độ học (từ đã học, XP, điểm ngữ pháp, lịch sử)? Bộ thẻ cá nhân vẫn được giữ. Không thể hoàn tác.')) {
                resetProgress();
                setMessage('Đã xoá tiến độ.');
              }
            }}
            disabled={p.xp === 0 && Object.keys(p.cards).length === 0 && p.log.length === 0}
          >
            <Trash2 size={18} /> Xoá tiến độ
          </button>
        </div>
        {message && <p className="notice">{message}</p>}
      </section>

      <p className="muted small center">
        Vườn Từ · nghĩa, ví dụ và bài ngữ pháp được biên soạn riêng · danh sách từ theo trình độ dựa trên CEFR-J Wordlist (Tono Laboratory, TUFS) và Octanove Vocabulary Profile C1/C2 (CC BY-SA 4.0) · phát âm bằng giọng đọc của trình duyệt.
      </p>
    </div>
  );
}
