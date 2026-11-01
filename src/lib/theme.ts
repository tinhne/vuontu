import { useEffect, useState } from 'react';
import { useProgress } from './progress';

const lightQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: light)') : null;

/** Applies the chosen theme to <html> and returns the one in effect. */
export function useTheme(): 'dark' | 'light' {
  const choice = useProgress().settings.theme;
  const [systemLight, setSystemLight] = useState(() => lightQuery?.matches ?? false);

  useEffect(() => {
    if (!lightQuery) return;
    const update = () => setSystemLight(lightQuery.matches);
    lightQuery.addEventListener('change', update);
    return () => lightQuery.removeEventListener('change', update);
  }, []);

  const resolved = choice === 'system' ? (systemLight ? 'light' : 'dark') : choice;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#090d0b' : '#f3f6f4');
  }, [resolved]);

  return resolved;
}
