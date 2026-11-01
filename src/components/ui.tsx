import { Fragment, useEffect, type CSSProperties, type ReactNode } from 'react';
import { Volume2, Snail, Star, X } from 'lucide-react';
import { canSpeak, speak } from '../lib/speech';
import { toggleStar, useProgress } from '../lib/progress';
import type { Tone } from '../types';

export function SpeakButton({ text, slow = false, label }: { text: string; slow?: boolean; label?: string }) {
  if (!canSpeak || !text) return null;
  return (
    <button
      type="button"
      className="icon-btn speak"
      aria-label={label ?? `Nghe phát âm ${text}`}
      title={slow ? 'Nghe chậm' : 'Nghe phát âm'}
      onClick={(e) => {
        e.stopPropagation();
        speak(text, slow);
      }}
    >
      {slow ? <Snail size={18} /> : <Volume2 size={18} />}
    </button>
  );
}

export function StarButton({ wordId, size = 18 }: { wordId: string; size?: number }) {
  const on = !!useProgress().starred[wordId];
  return (
    <button
      type="button"
      className={`icon-btn speak ${on ? 'starred' : ''}`}
      aria-label={on ? 'Bỏ lưu từ' : 'Lưu từ'}
      aria-pressed={on}
      title={on ? 'Bỏ lưu' : 'Lưu vào “Từ đã lưu”'}
      onClick={(e) => {
        e.stopPropagation();
        toggleStar(wordId);
      }}
    >
      <Star size={size} fill={on ? 'currentColor' : 'none'} />
    </button>
  );
}

export function IconTile({
  tone,
  size,
  soft,
  children,
  label,
}: {
  tone: Tone;
  size?: 'sm' | 'lg';
  soft?: boolean;
  children: ReactNode;
  label?: string;
}) {
  const isText = typeof children === 'string' && /^[A-Z]\d$/.test(children);
  return (
    <span className={`icon-tile tone-${tone} ${size ?? ''} ${soft ? 'soft' : ''} ${isText ? 'text' : ''}`} aria-label={label} role={label ? 'img' : undefined}>
      {children}
    </span>
  );
}

export function StatTile({ tone, icon, value, label }: { tone: Tone; icon: ReactNode; value: ReactNode; label: string }) {
  return (
    <div className={`stat-tile tone-${tone}`}>
      {icon}
      <div style={{ minWidth: 0 }}>
        <b>{value}</b>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function ProgressBar({ value, label, tone, className = '' }: { value: number; label?: string; tone?: Tone; className?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      className={`progress ${tone ? `tone tone-${tone}` : ''} ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ring({ value, children, size = 112 }: { value: number; children: ReactNode; size?: number }) {
  const r = size / 2 - 9;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#34d399" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="10" className="ring-track" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="ring-fill"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="ring-label">{children}</div>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: ReactNode }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="seg" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="tab" aria-selected={value === o.id} className={value === o.id ? 'active' : ''} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  title,
  icon,
  onClose,
  children,
  wide,
}: {
  title: string;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="modal-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          {icon}
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Renders **bold** inside a line of text. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  );
}

/** Renders lesson text: paragraphs split by blank lines, "- " bullets, "> " structure lines and **bold**. */
export function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/);
  const out: ReactNode[] = [];

  blocks.forEach((block, b) => {
    const lines = block.split('\n').filter((l) => l.trim() !== '');
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (line.startsWith('- ')) {
        const items: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('- ')) items.push(lines[i++].trim().slice(2));
        out.push(
          <ul key={`${b}-${i}`}>
            {items.map((item, k) => (
              <li key={k}>
                <Inline text={item} />
              </li>
            ))}
          </ul>,
        );
      } else if (line.startsWith('>')) {
        const items: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) items.push(lines[i++].trim().replace(/^>\s?/, ''));
        out.push(
          <div key={`${b}-${i}`} className="formula">
            {items.map((item, k) => (
              <div key={k}>
                <Inline text={item} />
              </div>
            ))}
          </div>,
        );
      } else {
        const items: string[] = [];
        while (i < lines.length && !/^(- |>)/.test(lines[i].trim())) items.push(lines[i++].trim());
        out.push(
          <p key={`${b}-${i}`}>
            {items.map((item, k) => (
              <Fragment key={k}>
                {k > 0 && <br />}
                <Inline text={item} />
              </Fragment>
            ))}
          </p>,
        );
      }
    }
  });

  return <div className="rich">{out}</div>;
}

/** Shows a quiz prompt with its "___" gap highlighted. */
export function Prompt({ text, fill }: { text: string; fill?: ReactNode }) {
  const [before, ...rest] = text.split('___');
  if (rest.length === 0) return <>{text}</>;
  return (
    <>
      {before}
      <span className="gap">{fill ?? '      '}</span>
      {rest.join('___')}
    </>
  );
}

export function Empty({ children, icon, tone = 'emerald' }: { children: ReactNode; icon?: ReactNode; tone?: Tone }) {
  return (
    <div className="empty">
      {icon && (
        <IconTile tone={tone} soft>
          {icon}
        </IconTile>
      )}
      {children}
    </div>
  );
}

export function toneStyle(tone: Tone): CSSProperties {
  return { ['--c' as string]: `var(--${tone})` };
}

export function formatNumber(n: number): string {
  return n.toLocaleString('vi-VN');
}
