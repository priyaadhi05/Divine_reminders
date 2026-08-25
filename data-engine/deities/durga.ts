import type { DayPanchangam } from '../panchangam';
import { computeWindow, findAllCyclicOccurrences, findTithiNear, tithiInMonth, type WindowSpec } from '../deity-utils';

export type DeityEventCategory = 'festival' | 'monthly-durgashtami';

export interface DeityEvent {
  id: string;
  deity: 'durga';
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

// Monthly Durgashtami (8th tithi of the waxing moon) is observed every lunar
// month as Devi's day; the Navratri occurrence (Maha Ashtami) is generated
// separately below as part of the festival arc, so it's excluded here.
export function generateMonthlyDurgashtamiEvents(days: DayPanchangam[], festivalDates: Set<string>): DeityEvent[] {
  const indices = findAllCyclicOccurrences(days, (d) => d.tithiNum - 1, 30, 7); // tithi 8, 0-indexed
  return indices
    .map((idx) => days[idx])
    .filter((d) => !festivalDates.has(d.dateStr))
    .map((d) => ({
      id: `durga-monthly-ashtami-${d.dateStr}`,
      deity: 'durga' as const,
      name: 'Durgashtami',
      tamilName: 'துர்க்காஷ்டமி',
      date: d.dateStr,
      category: 'monthly-durgashtami' as const,
      tamilMonth: d.tamilMonthName,
      basis: 'Shukla Ashtami tithi (monthly)',
      description: 'Monthly observance of Durga on the eighth day of the waxing moon.',
      significance: 'Devotees fast and visit Devi temples; the Purattasi occurrence falls within the major Navratri festival.',
      ...computeWindow({ kind: 'tithi', target: 8 }, d.sunriseUTC),
    }));
}

export function generateDurgaEvents(days: DayPanchangam[], startYear: number, endYear: number): DeityEvent[] {
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
        id: `durga-${e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${d.dateStr}`,
        deity: 'durga',
        date: d.dateStr,
        tamilMonth: d.tamilMonthName,
        ...e,
        ...computeWindow(window, d.sunriseUTC),
      });
    };

    // Sharad Navratri: 9 nights of Shukla paksha in Purattasi, from
    // Prathamai (day 1) through Ashtami (day 8) and Navami (day 9), with
    // Vijayadashami (day 10) the following day.
    const startIdx = tithiInMonth(yearDays, 'Purattasi', 1);
    if (startIdx >= 0) {
      const ashtamiIdx = findTithiNear(yearDays, startIdx, 8, 1, 10);
      const navamiIdx = findTithiNear(yearDays, startIdx, 9, 1, 10);
      const dashamiIdx = findTithiNear(yearDays, startIdx, 10, 1, 11);

      push(startIdx, { kind: 'tithi', target: 1 }, {
        name: 'Navratri Begins',
        tamilName: 'நவராத்திரி தொடக்கம்',
        category: 'festival',
        basis: 'Shukla Prathamai in Tamil month Purattasi',
        description: 'Start of the nine nights of Navratri, honoring Durga, Lakshmi, and Saraswati in turn.',
        significance: 'Major pan-Indian festival; homes set up golu (doll displays) and observe fasts through the nine nights.',
      });
      push(ashtamiIdx, { kind: 'tithi', target: 8 }, {
        name: 'Maha Ashtami',
        tamilName: 'மகா அஷ்டமி',
        category: 'festival',
        basis: 'Shukla Ashtami tithi in Tamil month Purattasi, within Navratri',
        description: "The eighth night of Navratri, dedicated to Durga's fiercest form.",
        significance: 'Observed with special pujas and, in some traditions, ritual sacrifice or its symbolic equivalent.',
      });
      push(navamiIdx, { kind: 'tithi', target: 9 }, {
        name: 'Saraswati Pooja',
        tamilName: 'சரஸ்வதி பூஜை',
        category: 'festival',
        basis: 'Shukla Navami tithi in Tamil month Purattasi, within Navratri',
        description: 'The ninth night of Navratri, when books and instruments are placed before Saraswati for blessing.',
        significance: 'Ayudha Pooja (tools/vehicles) is also observed the same day in Tamil Nadu.',
      });
      push(dashamiIdx, { kind: 'tithi', target: 10 }, {
        name: 'Vijayadashami',
        tamilName: 'விஜயதசமி',
        category: 'festival',
        basis: 'Shukla Dashami tithi in Tamil month Purattasi, the day after Navratri',
        description: "Celebrates Durga's victory over the demon Mahishasura, concluding Navratri.",
        significance: 'Widely celebrated as Dasara/Dussehra; also an auspicious day to begin new learning (Vidyarambham).',
      });
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}
