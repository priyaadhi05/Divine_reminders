import type { DayPanchangam } from '../panchangam';
import { computeWindow, fridayOnOrBefore, panchangamForDate, tithiInMonth } from '../deity-utils';

export type DeityEventCategory = 'festival' | 'vratham';

export interface DeityEvent {
  id: string;
  deity: 'lakshmi';
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

export function generateLakshmiEvents(days: DayPanchangam[], startYear: number, endYear: number): DeityEvent[] {
  const events: DeityEvent[] = [];

  for (let year = startYear; year <= endYear; year++) {
    const yearDays = days.filter((d) => d.dateStr.startsWith(String(year)));

    // Varalakshmi Vratham: the Friday on or before the full moon (Pournami)
    // in Tamil month Aavani - a weekday-anchored observance rather than a
    // fixed tithi, so it's located from Pournami's date rather than a tithi
    // search of its own.
    const pournamiIdx = tithiInMonth(yearDays, 'Aavani', 15);
    if (pournamiIdx >= 0 && yearDays[pournamiIdx]) {
      const fridayDate = fridayOnOrBefore(yearDays[pournamiIdx].dateStr);
      const d = panchangamForDate(days, fridayDate);
      events.push({
        id: `lakshmi-varalakshmi-vratham-${d.dateStr}`,
        deity: 'lakshmi',
        name: 'Varalakshmi Vratham',
        tamilName: 'வரலட்சுமி விரதம்',
        date: d.dateStr,
        category: 'vratham',
        tamilMonth: d.tamilMonthName,
        basis: 'Friday on or before Pournami in Tamil month Aavani',
        description:
          'A vratham observed mainly by married women, worshipping a decorated kalasam (pot) as Lakshmi for the wellbeing of their family.',
        significance: "One of the most widely observed vrathams among Tamil and Telugu Hindu women.",
        ...computeWindow({ kind: 'tithi', target: d.tithiNum }, d.sunriseUTC),
      });
    }

    // Diwali / Lakshmi Puja: Amavasai in Tamil month Aippasi - the Tamil
    // Nadu convention (the day after Naraka Chaturdashi).
    const diwaliIdx = tithiInMonth(yearDays, 'Aippasi', 30);
    if (diwaliIdx >= 0 && yearDays[diwaliIdx]) {
      const d = yearDays[diwaliIdx];
      events.push({
        id: `lakshmi-diwali-${d.dateStr}`,
        deity: 'lakshmi',
        name: 'Diwali (Lakshmi Puja)',
        tamilName: 'தீபாவளி',
        date: d.dateStr,
        category: 'festival',
        tamilMonth: d.tamilMonthName,
        basis: 'Amavasai tithi in Tamil month Aippasi',
        description: 'Homes are lit with rows of lamps and Lakshmi is worshipped in the evening, inviting prosperity for the year ahead.',
        significance: "One of the year's biggest festivals; in Tamil Nadu the day begins with an oil bath at dawn before the evening puja.",
        ...computeWindow({ kind: 'tithi', target: 30 }, d.sunriseUTC),
      });
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}
