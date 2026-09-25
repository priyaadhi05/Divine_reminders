import type { DeityEvent } from '@/data/events';

import { DEFAULT_LANGUAGE_ID } from '../languages';
import { EN_CONTENT } from './en';
import { HI_CONTENT } from './hi';
import { KN_CONTENT } from './kn';
import { TA_CONTENT } from './ta';
import { TE_CONTENT } from './te';
import type { Devotional, LanguageContent } from './types';

export type { Devotional, LanguageContent, MessageContext } from './types';

// Everything the app shows about an event - its name, description,
// significance, panchangam basis, dates, devotional practice/prayer,
// reminder and share wording - in the selected language. English is the
// source (assets/data/*.json is generated in English); any string a
// language hasn't translated falls back to it rather than going blank.
const CONTENT: Record<string, LanguageContent> = {
  en: EN_CONTENT,
  ta: TA_CONTENT,
  te: TE_CONTENT,
  kn: KN_CONTENT,
  hi: HI_CONTENT,
};

export function getContent(languageId: string): LanguageContent {
  return CONTENT[languageId] ?? CONTENT[DEFAULT_LANGUAGE_ID];
}

// A copy of the event with every display field in the selected language.
// tamilName is only kept for English, where it's a helpful subtitle - in any
// other language it would just be a second, foreign script next to the
// already-localized name.
export function localizeEvent(event: DeityEvent, languageId: string): DeityEvent {
  if (languageId === DEFAULT_LANGUAGE_ID) return event;
  const content = getContent(languageId);
  const text = content.events[event.name];
  return {
    ...event,
    name: text?.name ?? event.name,
    tamilName: '',
    description: text?.description ?? event.description,
    significance: text?.significance ?? event.significance,
    basis: text?.basis ?? event.basis,
    tamilMonth: content.tamilMonths[event.tamilMonth] ?? event.tamilMonth,
  };
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// "Wednesday, September 30, 2026" / "ಬುಧವಾರ, 30 ಸೆಪ್ಟೆಂಬರ್ 2026"
export function formatFullDate(dateStr: string, languageId: string): string {
  const c = getContent(languageId);
  const date = parseDate(dateStr);
  return c.fullDate(c.weekdays[date.getUTCDay()], c.months[date.getUTCMonth()], date.getUTCDate(), date.getUTCFullYear());
}

// "Wednesday, September 30" - no year
export function formatDateNoYear(dateStr: string, languageId: string): string {
  const c = getContent(languageId);
  const date = parseDate(dateStr);
  return c.dateNoYear(c.weekdays[date.getUTCDay()], c.months[date.getUTCMonth()], date.getUTCDate());
}

// "September 30"
export function formatShortDate(dateStr: string, languageId: string): string {
  const c = getContent(languageId);
  const date = parseDate(dateStr);
  return c.shortDate(c.months[date.getUTCMonth()], date.getUTCDate());
}

// "November 2026", from a "YYYY-MM" key
export function formatMonthLabel(yearMonth: string, languageId: string): string {
  const c = getContent(languageId);
  const [year, month] = yearMonth.split('-');
  return c.monthLabel(c.months[Number(month) - 1], year);
}

// A precise tithi/nakshatra boundary shown in the given time zone, e.g.
// "30 Sep 2026, 14:05". Built from numeric parts so month names come from
// the language tables rather than whatever locale data the JS engine ships.
export function formatDateTime(iso: string, timeZone: string, languageId: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const c = getContent(languageId);
  return c.dateTime(Number(get('day')), c.months[Number(get('month')) - 1], Number(get('year')), `${get('hour')}:${get('minute')}`);
}

export function getDevotional(event: DeityEvent, languageId: string): Devotional {
  const c = getContent(languageId);
  return (
    c.devotionalByName[event.name] ??
    EN_CONTENT.devotionalByName[event.name] ??
    c.devotionalByCategory[event.category] ??
    EN_CONTENT.devotionalByCategory[event.category]
  );
}

export function localizedVerseTitle(title: string, languageId: string): string {
  return getContent(languageId).verseTitles[title] ?? title;
}

export function localizedVerseScript(title: string, script: string, languageId: string): string {
  return getContent(languageId).verseScripts[title] ?? script;
}

export function localizedRegionLabel(regionId: string, fallback: string, languageId: string): string {
  return getContent(languageId).regions[regionId] ?? fallback;
}
