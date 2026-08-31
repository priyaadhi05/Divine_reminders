import { useLanguage } from '@/contexts/language-context';
import type { EventCategory } from '@/data/events';
import { translatedCategoryLabel, translatedDeityName } from '@/lib/i18n/labels';
import { DEFAULT_LANGUAGE_ID } from '@/lib/i18n/languages';
import { TRANSLATIONS, type TranslationKey } from '@/lib/i18n/translations';

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

// UI-chrome i18n (see translations.ts for what is and isn't covered). Falls
// back to English for any key not yet translated for the active language,
// so a partially-translated language never renders a blank/missing string.
export function useTranslation() {
  const { languageId } = useLanguage();

  const t = (key: TranslationKey, vars?: Record<string, string | number>): string => {
    const table = TRANSLATIONS[languageId] ?? TRANSLATIONS[DEFAULT_LANGUAGE_ID];
    const template = table[key] ?? TRANSLATIONS[DEFAULT_LANGUAGE_ID][key] ?? key;
    return interpolate(template, vars);
  };

  // "Today" / "Tomorrow" / "In N days" - the relative-day label used across
  // Home, mirroring data/events.ts's relativeDayLabel but localized.
  const relativeDay = (daysUntil: number): string => {
    if (daysUntil === 0) return t('common.today');
    if (daysUntil === 1) return t('common.tomorrow');
    return t('common.inDays', { n: daysUntil });
  };

  const categoryLabel = (category: EventCategory, fallback: string): string =>
    translatedCategoryLabel(languageId, category, fallback);

  const deityName = (deityId: string, fallback: string): string => translatedDeityName(languageId, deityId, fallback);

  return { t, relativeDay, categoryLabel, deityName, languageId };
}
