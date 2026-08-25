import type { DayPanchangam } from '../panchangam';
import { computeWindow, findAllCyclicOccurrences, nakshatraInMonth, NAKSHATRA_INDEX, tithiInMonth, type WindowSpec } from '../deity-utils';

export type DeityEventCategory = 'festival' | 'pradosham' | 'monthly-shivaratri';

export interface DeityEvent {
  id: string;
  deity: 'shiva';
  name: string;
  tamilName: string;
  date: string; // YYYY-MM-DD
  category: DeityEventCategory;
  tamilMonth: string;
  basis: string;
  description: string;
  significance: string;
  periodStartUTC?: string;
  periodEndUTC?: string;
}

// Pradosham (13th tithi, Trayodashi) falls twice a lunar month - Shukla and
// Krishna (tithi 28 = 13 + 15) - and is Shiva's twilight-worship day.
export function generateMonthlyPradoshamEvents(days: DayPanchangam[], festivalDates: Set<string>): DeityEvent[] {
  const shukla = findAllCyclicOccurrences(days, (d) => d.tithiNum - 1, 30, 12).map((idx) => ({ idx, tithi: 13 })); // tithi 13, 0-indexed
  const krishna = findAllCyclicOccurrences(days, (d) => d.tithiNum - 1, 30, 27).map((idx) => ({ idx, tithi: 28 })); // tithi 28, 0-indexed

  return [...shukla, ...krishna]
    .sort((a, b) => a.idx - b.idx)
    .map(({ idx, tithi }) => ({ d: days[idx], tithi }))
    .filter(({ d }) => !festivalDates.has(d.dateStr))
    .map(({ d, tithi }) => ({
      id: `shiva-pradosham-${d.dateStr}`,
      deity: 'shiva' as const,
      name: tithi === 13 ? 'Pradosham (Shukla Paksha)' : 'Pradosham (Krishna Paksha)',
      tamilName: 'பிரதோஷம்',
      date: d.dateStr,
      category: 'pradosham' as const,
      tamilMonth: d.tamilMonthName,
      basis: `${tithi === 13 ? 'Shukla' : 'Krishna'} Trayodashi tithi (monthly)`,
      description: 'Twilight worship of Shiva on the thirteenth tithi of each lunar fortnight.',
      significance: 'Devotees fast through the day and visit Shiva temples at dusk, when Shiva is believed to dance in joy.',
      ...computeWindow({ kind: 'tithi', target: tithi }, d.sunriseUTC),
    }));
}

// Masa Shivaratri ("monthly Shivaratri") is the Krishna Chaturdashi tithi
// (14th, waning moon) each lunar month; the Maasi occurrence is the major
// annual Maha Shivaratri generated separately below, so it's excluded here.
export function generateMonthlyShivaratriEvents(days: DayPanchangam[], festivalDates: Set<string>): DeityEvent[] {
  const indices = findAllCyclicOccurrences(days, (d) => d.tithiNum - 1, 30, 28); // tithi 29, 0-indexed
  return indices
    .map((idx) => days[idx])
    .filter((d) => !festivalDates.has(d.dateStr))
    .map((d) => ({
      id: `shiva-masa-shivaratri-${d.dateStr}`,
      deity: 'shiva' as const,
      name: 'Masa Shivaratri',
      tamilName: 'மாத சிவராத்திரி',
      date: d.dateStr,
      category: 'monthly-shivaratri' as const,
      tamilMonth: d.tamilMonthName,
      basis: 'Krishna Chaturdashi tithi (monthly, waning moon)',
      description: 'Monthly night-vigil observance of Shiva, on the fourteenth day of the waning moon.',
      significance: 'Less widely observed than the annual Maha Shivaratri, but kept by dedicated Shiva devotees each month.',
      ...computeWindow({ kind: 'tithi', target: 29 }, d.sunriseUTC),
    }));
}

export function generateShivaEvents(days: DayPanchangam[], startYear: number, endYear: number): DeityEvent[] {
  const events: DeityEvent[] = [];

  for (let year = startYear; year <= endYear; year++) {
    const yearDays = days.filter((d) => d.dateStr.startsWith(String(year)));

    const push = (
      idx: number,
      window: WindowSpec,
      e: Omit<DeityEvent, 'id' | 'deity' | 'date' | 'tamilMonth' | 'periodStartUTC' | 'periodEndUTC'>
    ) => {
      if (idx < 0 || !yearDays[idx]) return;
      const d = yearDays[idx];
      events.push({
        id: `shiva-${e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${d.dateStr}`,
        deity: 'shiva',
        date: d.dateStr,
        tamilMonth: d.tamilMonthName,
        ...e,
        ...computeWindow(window, d.sunriseUTC),
      });
    };

    push(tithiInMonth(yearDays, 'Maasi', 29), { kind: 'tithi', target: 29 }, {
      name: 'Maha Shivaratri',
      tamilName: 'மகா சிவராத்திரி',
      category: 'festival',
      basis: 'Krishna Chaturdashi tithi in Tamil month Maasi',
      description: "The Great Night of Shiva - an all-night vigil, fasting, and worship marking Shiva's cosmic dance.",
      significance: 'One of the most widely observed Shiva festivals across all Shiva temples.',
    });

    push(
      nakshatraInMonth(yearDays, 'Margazhi', NAKSHATRA_INDEX['Ardra']),
      { kind: 'nakshatra', target: NAKSHATRA_INDEX['Ardra'] },
      {
        name: 'Thiruvathirai',
        tamilName: 'திருவாதிரை',
        category: 'festival',
        basis: 'Ardra nakshatra in Tamil month Margazhi',
        description: "Commemorates Shiva's manifestation as Nataraja, the cosmic dancer.",
        significance: 'Major festival at Chidambaram and other Shiva temples, marked with the Arudra Darshan ritual.',
      }
    );
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}
