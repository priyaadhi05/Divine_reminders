import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { DEFAULT_LANGUAGE_ID } from '@/lib/i18n/languages';
import { scheduleUpcomingReminders } from '@/lib/notifications';

const STORAGE_KEY = 'divine-calendar:selected-language';

interface LanguageContextValue {
  languageId: string;
  setLanguageId: (id: string) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  languageId: DEFAULT_LANGUAGE_ID,
  setLanguageId: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [languageId, setLanguageIdState] = useState(DEFAULT_LANGUAGE_ID);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) setLanguageIdState(saved);
    });
  }, []);

  const setLanguageId = (id: string) => {
    setLanguageIdState(id);
    // Already-scheduled notifications carry their text baked in, so
    // re-schedule them once the new language is saved.
    AsyncStorage.setItem(STORAGE_KEY, id).then(() => scheduleUpcomingReminders());
  };

  return <LanguageContext.Provider value={{ languageId, setLanguageId }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
