'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createDemoState, EMPTY_STATE, STORAGE_KEY } from '@/lib/data';
import { appReducer, restoreState, transition } from '@/lib/store';
import type { AppAction, AppState } from '@/lib/types';
import { Icon } from '@/components/Icon';

interface SessionContextValue {
  state: AppState;
  ready: boolean;
  now: Date;
  perform: (action: AppAction, message?: string) => boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, EMPTY_STATE);
  const stateRef = useRef(state);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => new Date(0));
  const [toast, setToast] = useState<{ message: string; error: boolean; key: number } | null>(null);
  const storageFailed = useRef(false);

  const notify = useCallback(
    (message: string, error = false) => setToast({ message, error, key: Date.now() }),
    [],
  );

  const persist = useCallback(
    (nextState: AppState) => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
        storageFailed.current = false;
      } catch {
        if (!storageFailed.current) {
          storageFailed.current = true;
          notify(
            'Não foi possível guardar a sessão. Evite atualizar a página para manter os dados.',
            true,
          );
        }
      }
    },
    [notify],
  );

  useEffect(() => {
    let initial: AppState;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const restored = restoreState(raw);
      initial = restored ?? createDemoState();
      if (raw && !restored) notify('A sessão estava inválida. Restauramos os dados de exemplo.');
      if (!restored) persist(initial);
    } catch {
      initial = createDemoState();
      storageFailed.current = true;
      notify(
        'O navegador bloqueou o armazenamento. Os dados serão mantidos apenas até atualizar a página.',
        true,
      );
    }
    stateRef.current = initial;
    dispatch({ type: 'hydrate', state: initial });
    setNow(new Date());
    setReady(true);
    const refreshTime = () => setNow(new Date());
    const timer = window.setInterval(refreshTime, 30_000);
    document.addEventListener('visibilitychange', refreshTime);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshTime);
    };
  }, [notify, persist]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const perform = useCallback(
    (action: AppAction, message?: string) => {
      const result = transition(stateRef.current, action);
      if (result.error) {
        notify(result.error, true);
        return false;
      }
      stateRef.current = result.state;
      dispatch(action);
      if (message) notify(message);
      persist(result.state);
      return true;
    },
    [notify, persist],
  );

  const value = useMemo(() => ({ state, ready, now, perform }), [state, ready, now, perform]);
  return (
    <SessionContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toast && (
          <div
            className={`toast ${toast.error ? 'toast-error' : ''}`}
            key={toast.key}
            role={toast.error ? 'alert' : 'status'}
          >
            <Icon name={toast.error ? 'info' : 'check'} />
            <span>{toast.message}</span>
            <button
              type="button"
              aria-label="Fechar notificação"
              className="icon-button"
              onClick={() => setToast(null)}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
      </div>
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession precisa de SessionProvider.');
  return value;
}
