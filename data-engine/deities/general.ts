import type { DayPanchangam } from '../panchangam';
import { computeWindow, findAllCyclicOccurrences } from '../deity-utils';

export type GeneralEventCategory = 'amavasai' | 'pournami';

export interface GeneralEvent {
  id: string;
  deity: 'general';
  name: string;
  tamilName: string;
  date: string; // YYYY-MM-DD
  category: GeneralEventCategory;
  tamilMonth: string;
  basis: string;
  description: string;
  significance: string;
  periodStartUTC?: string;
  periodEndUTC?: string;
}

// Amavasai (new moon, tithi 30) and Pournami (full moon, tithi 15) - the two
// universal lunar days every Tamil panchangam marks each month, independent
// of any single deity. Unlike every other dataset in data-engine/deities/,
// this one isn't registered as a followable "deity" (see GENERAL_DEITY_ID in
// src/data/events.ts) - it's meant to show up on Home for every user
// regardless of which deities they follow.
export function generateMonthlyAmavasaiPournamiEvents(days: DayPanchangam[]): GeneralEvent[] {
  const pournami = findAllCyclicOccurrences(days, (d) => d.tithiNum - 1, 30, 14).map((idx) => ({ idx, tithi: 15 }));
  const amavasai = findAllCyclicOccurrences(days, (d) => d.tithiNum - 1, 30, 29).map((idx) => ({ idx, tithi: 30 }));

  return [...pournami, ...amavasai]
    .sort((a, b) => a.idx - b.idx)
    .map(({ idx, tithi }) => ({ d: days[idx], tithi }))
    .map(({ d, tithi }) => {
      const isPournami = tithi === 15;
      return {
        id: `general-${isPournami ? 'pournami' : 'amavasai'}-${d.dateStr}`,
        deity: 'general' as const,
        name: isPournami ? 'Pournami' : 'Amavasai',
        tamilName: isPournami ? 'பௌர்ணமி' : 'அமாவாசை',
        date: d.dateStr,
        category: (isPournami ? 'pournami' : 'amavasai') as GeneralEventCategory,
        tamilMonth: d.tamilMonthName,
        basis: `${isPournami ? 'Pournami (full moon)' : 'Amavasai (new moon)'} tithi (monthly)`,
        description: isPournami
          ? 'The full moon day, observed every lunar month as an auspicious time for worship, fasting and reflection.'
          : 'The new moon day, observed every lunar month for ancestor remembrance (tarpanam) and quiet reflection.',
        significance: isPournami
          ? 'Kept across traditions regardless of which deity one follows - many visit a temple or observe a light fast.'
          : 'Traditionally set aside for remembering ancestors; many also visit a temple or observe a partial fast.',
        ...computeWindow({ kind: 'tithi', target: tithi }, d.sunriseUTC),
      };
    });
}
