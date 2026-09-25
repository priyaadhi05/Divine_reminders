import type { EventCategory } from '@/data/events';

export interface EventText {
  name: string;
  description: string;
  significance: string;
  basis: string;
}

export interface Devotional {
  practice: string;
  prayer: string;
}

// Everything a reminder / notification / share message needs, already
// localized by the caller - each language's templates only arrange it.
export interface MessageContext {
  name: string; // localized event name
  significance: string; // localized
  date: string; // localized "weekday, day month" (no year)
  fullDate: string; // localized "weekday, day month year"
  deityName?: string; // localized; absent for Amavasai/Pournami
  honorific?: string; // localized "Lord"/"Goddess"
  greeting?: string; // localized devotional exclamation, e.g. "Vel Vel!"
  symbol: string;
}

export interface LanguageContent {
  // BCP-47 tag for expo-speech, so the companion reads the line in the same language
  speechLanguage: string;

  months: string[]; // January..December
  weekdays: string[]; // Sunday..Saturday
  fullDate: (weekday: string, month: string, day: number, year: number) => string;
  dateNoYear: (weekday: string, month: string, day: number) => string;
  shortDate: (month: string, day: number) => string;
  monthLabel: (month: string, year: string) => string;
  dateTime: (day: number, month: string, year: number, time: string) => string;

  // Generated-event text, keyed by the event's English name in
  // assets/data/*.json. Missing entries fall back to English.
  events: Record<string, EventText>;
  tamilMonths: Record<string, string>;

  deityGreetings: Record<string, string>; // by deity id
  honorifics: { Lord: string; Goddess: string };
  regions: Record<string, string>; // by region id
  autoRegion: (timeZone: string) => string;

  verseTitles: Record<string, string>; // keyed by the English title
  verseScripts: Record<string, string>; // the mantra itself, transliterated into this script - keyed by English title

  devotionalByCategory: Record<EventCategory, Devotional>;
  devotionalByName: Record<string, Devotional>; // keyed by English event name

  reminderLine: (ctx: MessageContext, daysBefore?: number) => string;
  notificationTitle: (ctx: MessageContext, daysBefore: number) => string;
  notificationBody: (ctx: MessageContext, daysBefore: number) => string;
  shareGreeting: (ctx: MessageContext, daysUntil: number) => string;
}
