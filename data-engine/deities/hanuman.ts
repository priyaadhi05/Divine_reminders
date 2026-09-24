import type { DayPanchangam } from '../panchangam';
import { computeWindow, findAllTamilMonthStarts, tithiInMonth } from '../deity-utils';

export type DeityEventCategory = 'festival';

export interface DeityEvent {
  id: string;
  deity: 'hanuman';
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

// Hanuman Jayanti's date is one of the more regionally-varied in the Hindu
// calendar - North India keeps Chaitra Purnima, Kerala and Karnataka use
// other months entirely. This app follows the Tamil Nadu convention,
// Margazhi Amavasai, the day South Indian Hanuman temples (e.g. Namakkal)
// observe it.
//
// Margazhi straddles the Gregorian year boundary (mid-December to
// mid-January), so it can't be found by filtering `days` to one calendar
// year the way every tithi-in-month search elsewhere in data-engine does -
// that would cut a single Margazhi in half across two different years'
// slices and could miss the day entirely. Instead, each Margazhi instance is
// located directly (same approach as Ayyappan's Karthigai/Thai transitions)
// and searched independently.
export function generateHanumanEvents(days: DayPanchangam[]): DeityEvent[] {
  const events: DeityEvent[] = [];
  const monthStarts = findAllTamilMonthStarts(days, 'Margazhi');

  for (let i = 0; i < monthStarts.length; i++) {
    const start = monthStarts[i];
    const end = monthStarts[i + 1] ?? days.length;
    const slice = days.slice(start, end);
    const idx = tithiInMonth(slice, 'Margazhi', 30);
    if (idx < 0 || !slice[idx]) continue;
    const d = slice[idx];
    events.push({
      id: `hanuman-jayanti-${d.dateStr}`,
      deity: 'hanuman',
      name: 'Hanuman Jayanti',
      tamilName: 'ஹனுமான் ஜெயந்தி',
      date: d.dateStr,
      category: 'festival',
      tamilMonth: d.tamilMonthName,
      basis: 'Amavasai tithi in Tamil month Margazhi (Tamil Nadu convention)',
      description: "Hanuman's birthday, marked with recitations of the Hanuman Chalisa and visits to Hanuman temples.",
      significance:
        'Widely observed at South Indian Hanuman temples on this date; North India instead keeps Chaitra Purnima.',
      ...computeWindow({ kind: 'tithi', target: 30 }, d.sunriseUTC),
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}
