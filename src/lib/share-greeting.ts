import { daysUntil, getDeityById, type DeityEvent } from '@/data/events';
import {
  formatDateNoYear,
  formatFullDate,
  getContent,
  localizeEvent,
  type MessageContext,
} from '@/lib/i18n/content';
import { translatedDeityName } from '@/lib/i18n/labels';
import { DEFAULT_LANGUAGE_ID } from '@/lib/i18n/languages';

// Everything the reminder / notification / share templates need about one
// event, already in the selected language (see lib/i18n/content/*.ts for
// each language's wording). In English the Tamil name rides along in
// brackets, as it always has; other languages show only their own script.
export function messageContext(event: DeityEvent, languageId: string, withTamilName = false): MessageContext {
  const content = getContent(languageId);
  const deity = getDeityById(event.deity);
  const shown = localizeEvent(event, languageId);
  const name =
    withTamilName && languageId === DEFAULT_LANGUAGE_ID && event.tamilName ? `${shown.name} (${event.tamilName})` : shown.name;
  return {
    name,
    significance: shown.significance,
    date: formatDateNoYear(event.date, languageId),
    fullDate: formatFullDate(event.date, languageId),
    deityName: deity ? translatedDeityName(languageId, deity.id, deity.name) : undefined,
    honorific: deity ? content.honorifics[deity.honorific] : undefined,
    greeting: deity ? (content.deityGreetings[deity.id] ?? deity.greeting) : undefined,
    symbol: deity?.symbol ?? (event.category === 'pournami' ? '🌕' : event.category === 'amavasai' ? '🌚' : '🪔'),
  };
}

// The personal message that goes out with a share - written like something
// someone would actually send a relative, not a calendar entry. It's the
// text for WhatsApp / "More", and the same words are written onto the picture
// itself (components/greeting-card.tsx), since a share sheet can attach a
// picture but not a caption alongside it. Written in the sender's selected
// language.
export function buildGreeting(event: DeityEvent, languageId: string = DEFAULT_LANGUAGE_ID): string {
  return getContent(languageId).shareGreeting(messageContext(event, languageId, true), daysUntil(event.date));
}
