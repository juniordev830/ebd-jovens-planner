import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export function useLocalState<T>(
  key: string, fallback: T, decode: (raw: string) => T,
): [T, Dispatch<SetStateAction<T>>, string, boolean, () => void] {
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return { value: raw === null ? fallback : decode(raw), error: '', persisted: raw !== null };
    } catch {
      return {
        value: fallback,
        error: 'Não foi possível abrir as lições locais. Os dados originais serão preservados e as alterações desta sessão ficarão na memória.',
      };
    }
  });
  const [state, setState] = useState(initial.value);
  const lastSaved = useRef<{ key: string; value: T } | null>(
    initial.persisted ? { key, value: initial.value } : null,
  );
  const [error, setError] = useState(initial.error);
  const [blocked, setBlocked] = useState(Boolean(initial.error));
  useEffect(() => {
    if (blocked) return;
    if (lastSaved.current?.key === key && Object.is(lastSaved.current.value, state)) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
      lastSaved.current = { key, value: state };
      setError('');
    } catch {
      setError('O navegador impediu o armazenamento. As alterações podem se perder ao fechar a página.');
    }
  }, [key, state, blocked]);
  return [state, setState, error, blocked, () => setBlocked(false)];
}
