"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Language, dictionaries } from "@/lib/i18n/dictionaries";

interface I8nState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useI18nStore = create<I8nState>()(
  persist(
    (set) => ({
      language: "es", // Default language
      setLanguage: (language: Language) => set({ language }),
    }),
    {
      name: "language-storage",
    }
  )
);

export function useTranslation() {
  const language = useI18nStore((state) => state.language);
  const setLanguage = useI18nStore((state) => state.setLanguage);

  // Deep extract value based on string path (e.g., 'navbar.services')
  const t = (path: string): string => {
    const keys = path.split(".");
    let current: any = dictionaries[language];

    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Translation missing for key "${path}" in lang "${language}"`);
        return path;
      }
      current = current[key];
    }

    return current as string;
  };

  return { t, language, setLanguage };
}
