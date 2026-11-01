import { useEffect, useState } from 'react';
import { getProgress } from './progress';

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function englishVoices(): SpeechSynthesisVoice[] {
  if (!canSpeak) return [];
  return speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
}

function pickVoice(voiceURI: string): SpeechSynthesisVoice | undefined {
  const voices = englishVoices();
  return (
    voices.find((v) => v.voiceURI === voiceURI) ??
    voices.find((v) => v.lang === 'en-GB' && v.localService) ??
    voices.find((v) => v.lang === 'en-GB') ??
    voices.find((v) => v.lang === 'en-US')
  );
}

export function speak(text: string, slow = false) {
  if (!canSpeak || !text) return;
  const { voiceURI, rate } = getProgress().settings;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(voiceURI);
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang ?? 'en-GB';
  utterance.rate = slow ? Math.max(0.5, rate * 0.65) : rate;
  speechSynthesis.speak(utterance);
}

/** Voices load asynchronously in most browsers. */
export function useEnglishVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState(englishVoices);
  useEffect(() => {
    if (!canSpeak) return;
    const update = () => setVoices(englishVoices());
    speechSynthesis.addEventListener('voiceschanged', update);
    return () => speechSynthesis.removeEventListener('voiceschanged', update);
  }, []);
  return voices;
}
