import type { DayPanchangam } from '../panchangam';
import { computeWindow, findAllCyclicOccurrences, tithiInMonth, type WindowSpec } from '../deity-utils';

export type DeityEventCategory = 'festival' | 'monthly-chaturthi';

export interface DeityEvent {
  id: string;
  deity: 'ganesha';
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

// Sankashti Chaturthi (Krishna Chaturthi, 4th tithi of the waning moon) falls
// once a lunar month - Ganesha's monthly fasting day, the same granularity
// as Murugan's Sashti or Shiva's Pradosham.
export function generateMonthlyChaturthiEvents(days: DayPanchangam[], festivalDates: Set<string>): DeityEvent[] {
  const indices = findAllCyclicOccurrences(days, (d) => d.tithiNum - 1, 30, 18); // tithi 19, 0-indexed
  return indices
    .map((idx) => days[idx])
    .filter((d) => !festivalDates.has(d.dateStr))
    .map((d) => ({
      id: `ganesha-sankashti-chaturthi-${d.dateStr}`,
      deity: 'ganesha' as const,
      name: 'Sankashti Chaturthi',
      tamilName: 'சங்கடஹர சதுர்த்தி',
      date: d.dateStr,
      category: 'monthly-chaturthi' as const,
      tamilMonth: d.tamilMonthName,
      basis: 'Krishna Chaturthi tithi (monthly, waning moon)',
      description: 'Monthly fasting day dedicated to Ganesha, observed on the fourth day of the waning moon to remove obstacles.',
      significance: 'Widely observed vratham; many devotees fast until moonrise and break the fast only after sighting the moon.',
      ...computeWindow({ kind: 'tithi', target: 19 }, d.sunriseUTC),
    }));
}

export function generateGaneshaEvents(days: DayPanchangam[], startYear: number, endYear: number): DeityEvent[] {
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
        id: `ganesha-${e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${d.dateStr}`,
        deity: 'ganesha',
        date: d.dateStr,
        tamilMonth: d.tamilMonthName,
        ...e,
        ...computeWindow(window, d.sunriseUTC),
      });
    };

    // Vinayagar Chaturthi: traditionally Bhadrapada Shukla Chaturthi -
    // approximated here as Tamil month Aavani, where Bhadrapada predominantly
    // falls (the same solar-month simplification already used for Krishna
    // Janmashtami in vishnu.ts).
    push(tithiInMonth(yearDays, 'Aavani', 4), { kind: 'tithi', target: 4 }, {
      name: 'Vinayagar Chaturthi',
      tamilName: 'விநாயகர் சதுர்த்தி',
      category: 'festival',
      basis: 'Shukla Chaturthi tithi in Tamil month Aavani',
      description:
        "Ganesha's birthday, celebrated with clay idols, modakam offerings, and processions to immerse the idol in water.",
      significance: 'One of the most widely celebrated Hindu festivals; South Indian homes and temples typically observe it as a single day.',
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}
