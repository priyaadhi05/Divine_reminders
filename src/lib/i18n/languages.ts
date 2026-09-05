export interface Language {
  id: string;
  label: string; // shown in English, for the picker's own list
  nativeLabel: string; // shown in the language's own script
}

// The five languages requested during onboarding. English stays first as the
// fallback for any key a translation hasn't been written for yet.
export const LANGUAGES: Language[] = [
  { id: 'en', label: 'English', nativeLabel: 'English' },
  { id: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { id: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { id: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { id: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
];

export const DEFAULT_LANGUAGE_ID = 'en';

export function getLanguageById(id: string): Language {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
}
