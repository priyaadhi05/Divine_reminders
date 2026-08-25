import durgaData from '@/assets/data/durga-events.json';
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
  | 'monthly-durgashtami';

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
    dataset: muruganData as DeityDataset,
  },
  {
    id: 'vishnu',
    name: 'Vishnu',
    tamilName: 'விஷ்ணு',
    symbol: '🪷',
    greeting: 'Om Namo Narayanaya!',
    dataset: vishnuData as DeityDataset,
  },
  {
    id: 'shiva',
    name: 'Shiva',
    tamilName: 'சிவன்',
    symbol: '🔱',
    greeting: 'Om Namah Shivaya!',
    dataset: shivaData as DeityDataset,
  },
  {
    id: 'durga',
    name: 'Durga Devi',
    tamilName: 'துர்கை',
    symbol: '🦁',
    greeting: 'Om Shakti!',
    dataset: durgaData as DeityDataset,
  },
];

export function getDeityById(id: string): Deity | undefined {
  return DEITIES.find((d) => d.id === id);
}

export function getAllEvents(): DeityEvent[] {
  return DEITIES.flatMap((d) => d.dataset.events);
}

export function getEventsForDeity(deityId: string): DeityEvent[] {
  return getDeityById(deityId)?.dataset.events ?? [];
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
