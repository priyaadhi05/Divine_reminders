import ayyappanData from '@/assets/data/ayyappan-events.json';
import durgaData from '@/assets/data/durga-events.json';
import ganeshaData from '@/assets/data/ganesha-events.json';
import generalData from '@/assets/data/general-events.json';
import muruganData from '@/assets/data/murugan-events.json';
import shivaData from '@/assets/data/shiva-events.json';
import vishnuData from '@/assets/data/vishnu-events.json';

export type EventCategory =
  | 'festival'
  | 'vratham'
  | 'monthly-sashti'
  | 'monthly-krithigai'
  | 'theipirai-sashti'
  | 'ekadashi'
  | 'pradosham'
  | 'monthly-shivaratri'
  | 'monthly-durgashtami'
  | 'monthly-chaturthi'
  | 'amavasai'
  | 'pournami';

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  festival: 'Festival',
  vratham: 'Vratham',
  'monthly-sashti': 'Valarpirai Sashti',
  'monthly-krithigai': 'Monthly Krithigai',
  'theipirai-sashti': 'Theipirai Sashti',
  ekadashi: 'Ekadashi',
  pradosham: 'Pradosham',
  'monthly-shivaratri': 'Masa Shivaratri',
  'monthly-durgashtami': 'Durgashtami',
  'monthly-chaturthi': 'Sankashti Chaturthi',
  amavasai: 'Amavasai',
  pournami: 'Pournami',
};

export interface DeityEvent {
  id: string;
  deity: string;
  name: string;
  tamilName: string;
  date: string; // YYYY-MM-DD
  category: EventCategory;
  tamilMonth: string;
  basis: string;
  description: string;
  significance: string;
  // Precise start/end of the governing tithi/nakshatra span, UTC ISO 8601.
  // Absent for events not defined by a single tithi/nakshatra crossing
  // (e.g. the Thaipusam Vratham, derived by counting days back).
  periodStartUTC?: string;
  periodEndUTC?: string;
}

interface DeityDataset {
  deity: string;
  range: { startYear: number; endYear: number };
  assumptions: Record<string, string>;
  generatedAt: string;
  events: DeityEvent[];
}

export interface Deity {
  id: string;
  name: string;
  tamilName: string;
  symbol: string; // emoji used as a stand-in identity mark - no artwork asset yet
  greeting: string; // devotional exclamation used to open a reminder line, e.g. "Vel Vel!"
  honorific: 'Lord' | 'Goddess';
  dataset: DeityDataset;
}

// Adding a further deity: generate its dataset with the same shape via
// data-engine/deities/<name>.ts, then register it here.
export const DEITIES: Deity[] = [
  {
    id: 'murugan',
    name: 'Murugan',
    tamilName: 'முருகன்',
    symbol: '🦚',
    greeting: 'Vel Vel!',
    honorific: 'Lord',
    dataset: muruganData as DeityDataset,
  },
  {
    id: 'vishnu',
    name: 'Vishnu',
    tamilName: 'விஷ்ணு',
    symbol: '🪷',
    greeting: 'Om Namo Narayanaya!',
    honorific: 'Lord',
    dataset: vishnuData as DeityDataset,
  },
  {
    id: 'shiva',
    name: 'Shiva',
    tamilName: 'சிவன்',
    symbol: '🔱',
    greeting: 'Om Namah Shivaya!',
    honorific: 'Lord',
    dataset: shivaData as DeityDataset,
  },
  {
    id: 'durga',
    name: 'Amman',
    tamilName: 'அம்மன்',
    symbol: '🌺',
    greeting: 'Om Shakti!',
    honorific: 'Goddess',
    dataset: durgaData as DeityDataset,
  },
  {
    id: 'ganesha',
    name: 'Ganesha',
    tamilName: 'விநாயகர்',
    symbol: '🐘',
    greeting: 'Om Gam Ganapataye Namaha!',
    honorific: 'Lord',
    dataset: ganeshaData as DeityDataset,
  },
  {
    id: 'ayyappan',
    name: 'Ayyappan',
    tamilName: 'ஐயப்பன்',
    symbol: '🏹',
    greeting: 'Swamiye Saranam Ayyappa!',
    honorific: 'Lord',
    dataset: ayyappanData as DeityDataset,
  },
];

export function getDeityById(id: string): Deity | undefined {
  return DEITIES.find((d) => d.id === id);
}

// Amavasai (new moon) and Pournami (full moon) - generated the same way as
// every deity's dataset, but deliberately not registered as a followable
// "deity" in DEITIES: these are shown on Home regardless of which deities
// someone follows (see LunarDaysCard), not chosen at onboarding.
export const GENERAL_DEITY_ID = 'general';
const GENERAL_DATASET = generalData as DeityDataset;

export function getGeneralEvents(): DeityEvent[] {
  return GENERAL_DATASET.events;
}

// Same shape as getCategoriesForDeity, for the general dataset's own topics
// (`general:amavasai`, `general:pournami`) so they can be followed and
// scheduled through the exact same reminder system every deity uses.
export function getGeneralCategories(): EventCategory[] {
  const seen = new Set<EventCategory>();
  const ordered: EventCategory[] = [];
  for (const e of getGeneralEvents()) {
    if (!seen.has(e.category)) {
      seen.add(e.category);
      ordered.push(e.category);
    }
  }
  return ordered;
}

export function getAllEvents(): DeityEvent[] {
  return [...DEITIES.flatMap((d) => d.dataset.events), ...getGeneralEvents()];
}

export function getEventsForDeity(deityId: string): DeityEvent[] {
  return getDeityById(deityId)?.dataset.events ?? [];
}

// Distinct categories a deity's dataset actually uses, in a stable order -
// used both to render "notify me about just X" toggles and to know the full
// set of (deity, category) topics that exist, for notification preferences.
export function getCategoriesForDeity(deityId: string): EventCategory[] {
  const seen = new Set<EventCategory>();
  const ordered: EventCategory[] = [];
  for (const e of getEventsForDeity(deityId)) {
    if (!seen.has(e.category)) {
      seen.add(e.category);
      ordered.push(e.category);
    }
  }
  return ordered;
}

export function getEventById(id: string): DeityEvent | undefined {
  return getAllEvents().find((e) => e.id === id);
}

function todayISTDateStr(): string {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const shifted = new Date(Date.now() + IST_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}

export function getUpcomingEvents(limit?: number, deityId?: string): DeityEvent[] {
  const today = todayISTDateStr();
  const pool = deityId ? getEventsForDeity(deityId) : getAllEvents();
  const upcoming = pool.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  return limit ? upcoming.slice(0, limit) : upcoming;
}

// Same as getUpcomingEvents, scoped to just the general (deity-agnostic)
// dataset - used by LunarDaysCard's "next Amavasai / next Pournami" teaser.
export function getUpcomingGeneralEvents(limit?: number): DeityEvent[] {
  const today = todayISTDateStr();
  const upcoming = getGeneralEvents()
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  return limit ? upcoming.slice(0, limit) : upcoming;
}

// Whole-day difference between today (IST calendar date) and an event's
// date - used for the "Today / In 3 days / In 8 days" relative labels on
// the personalized "Your Sacred Days" feed.
export function daysUntil(dateStr: string): number {
  const today = todayISTDateStr();
  const toUTC = (d: string) => {
    const [y, m, day] = d.split('-').map(Number);
    return Date.UTC(y, m - 1, day);
  };
  return Math.round((toUTC(dateStr) - toUTC(today)) / 86400000);
}

export function relativeDayLabel(dateStr: string): string {
  const n = daysUntil(dateStr);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  return `In ${n} days`;
}

// Used to collapse long year-by-year calendar lists (Calendar tab, a
// deity's page) down to just the current year's remaining months by
// default, since 2026-2035 all at once on one screen is overwhelming.
const now = new Date();
export const CURRENT_YEAR = now.getFullYear();
export const CURRENT_YEAR_MONTH = `${CURRENT_YEAR}-${String(now.getMonth() + 1).padStart(2, '0')}`;

export function getEventsByYear(): Map<string, DeityEvent[]> {
  const byYear = new Map<string, DeityEvent[]>();
  for (const e of getAllEvents().sort((a, b) => a.date.localeCompare(b.date))) {
    const year = e.date.slice(0, 4);
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(e);
  }
  return byYear;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Keyed and sorted as "YYYY-MM" so callers can derive a display label
// ("November 2026") without re-parsing the key.
export function getEventsByYearMonth(events: DeityEvent[]): { key: string; label: string; events: DeityEvent[] }[] {
  const byMonth = new Map<string, DeityEvent[]>();
  for (const e of [...events].sort((a, b) => a.date.localeCompare(b.date))) {
    const key = e.date.slice(0, 7); // YYYY-MM
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(e);
  }
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, monthEvents]) => {
      const [year, month] = key.split('-');
      return { key, label: `${MONTH_NAMES[Number(month) - 1]} ${year}`, events: monthEvents };
    });
}

export function formatEventDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function formatInTimeZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export interface PeriodTiming {
  startLocal: string;
  endLocal: string;
  startIST: string;
  endIST: string;
  regionLabel: string;
}

// Formats an event's precise tithi/nakshatra window in the given timezone
// (the user's selected region, or auto-detected device zone) and IST, since
// IST is the panchangam's own reference timezone and useful to show alongside.
export function formatPeriodTiming(event: DeityEvent, timeZone: string, regionLabel: string): PeriodTiming | null {
  if (!event.periodStartUTC || !event.periodEndUTC) return null;
  return {
    startLocal: formatInTimeZone(event.periodStartUTC, timeZone),
    endLocal: formatInTimeZone(event.periodEndUTC, timeZone),
    startIST: formatInTimeZone(event.periodStartUTC, 'Asia/Kolkata'),
    endIST: formatInTimeZone(event.periodEndUTC, 'Asia/Kolkata'),
    regionLabel,
  };
}
