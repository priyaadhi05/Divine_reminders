import type { DayPanchangam } from '../panchangam';
import { computeWindow, findAllCyclicOccurrences, tithiInMonth, type WindowSpec } from '../deity-utils';

export type DeityEventCategory = 'festival' | 'ekadashi';

export interface DeityEvent {
  id: string;
  deity: 'vishnu';
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

// Ekadashi (11th tithi) falls twice a lunar month - Shukla Ekadashi (waxing)
// and Krishna Ekadashi (waning, tithi 26 = 11 + 15). Both are Vishnu's day;
// the Margazhi Shukla occurrence is the major Vaikunta Ekadashi festival
// already generated separately below, so it's excluded here.
export function generateMonthlyEkadashiEvents(days: DayPanchangam[], festivalDates: Set<string>): DeityEvent[] {
  const shukla = findAllCyclicOccurrences(days, (d) => d.tithiNum - 1, 30, 10).map((idx) => ({ idx, tithi: 11 })); // tithi 11, 0-indexed
  const krishna = findAllCyclicOccurrences(days, (d) => d.tithiNum - 1, 30, 25).map((idx) => ({ idx, tithi: 26 })); // tithi 26, 0-indexed

  return [...shukla, ...krishna]
    .sort((a, b) => a.idx - b.idx)
    .map(({ idx, tithi }) => ({ d: days[idx], tithi }))
    .filter(({ d }) => !festivalDates.has(d.dateStr))
    .map(({ d, tithi }) => ({
      id: `vishnu-ekadashi-${d.dateStr}`,
      deity: 'vishnu' as const,
      name: tithi === 11 ? 'Ekadashi (Shukla Paksha)' : 'Ekadashi (Krishna Paksha)',
      tamilName: 'ஏகாதசி',
      date: d.dateStr,
      category: 'ekadashi' as const,
      tamilMonth: d.tamilMonthName,
      basis: `${tithi === 11 ? 'Shukla' : 'Krishna'} Ekadashi tithi (monthly)`,
      description: 'Monthly fasting day dedicated to Vishnu, observed on the eleventh tithi of each lunar fortnight.',
      significance: 'Widely observed vratham (partial or full fast); the Margazhi Shukla occurrence is the major Vaikunta Ekadashi.',
      ...computeWindow({ kind: 'tithi', target: tithi }, d.sunriseUTC),
    }));
}

export function generateVishnuEvents(days: DayPanchangam[], startYear: number, endYear: number): DeityEvent[] {
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
        id: `vishnu-${e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${d.dateStr}`,
        deity: 'vishnu',
        date: d.dateStr,
        tamilMonth: d.tamilMonthName,
        ...e,
        ...computeWindow(window, d.sunriseUTC),
      });
    };

    push(tithiInMonth(yearDays, 'Margazhi', 11), { kind: 'tithi', target: 11 }, {
      name: 'Vaikunta Ekadashi',
      tamilName: 'வைகுண்ட ஏகாதசி',
      category: 'festival',
      basis: 'Shukla Ekadashi tithi in Tamil month Margazhi',
      description: 'The most sacred Ekadashi of the year, when the gates of Vaikuntam (Vishnu’s abode) are believed to open.',
      significance: 'Major Vishnu temple festival across Tamil Nadu, notably at Srirangam; devotees observe a strict fast.',
    });

    // Krishna Janmashtami: Krishna Paksha Ashtami in the Tamil month Aavani
    // (approximates the traditional solar-Simha-masa rule; classical
    // panchangams also require Rohini nakshatra, which this simplifies away).
    push(tithiInMonth(yearDays, 'Aavani', 23), { kind: 'tithi', target: 23 }, {
      name: 'Krishna Janmashtami',
      tamilName: 'கிருஷ்ண ஜன்மாஷ்டமி',
      category: 'festival',
      basis: 'Krishna Ashtami tithi in Tamil month Aavani',
      description: 'Birthday of Lord Krishna, the eighth avatar of Vishnu.',
      significance: 'Major festival with fasting, midnight worship, and re-enactments of Krishna’s childhood.',
    });

    // Rama Navami: Shukla Navami, traditionally in Chaitra - approximated
    // here as Tamil month Panguni, where Chaitra predominantly falls.
    push(tithiInMonth(yearDays, 'Panguni', 9), { kind: 'tithi', target: 9 }, {
      name: 'Rama Navami',
      tamilName: 'ராம நவமி',
      category: 'festival',
      basis: 'Shukla Navami tithi in Tamil month Panguni',
      description: 'Birthday of Lord Rama, the seventh avatar of Vishnu.',
      significance: 'Celebrated with recitations of the Ramayana and processions at Vishnu temples.',
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}
