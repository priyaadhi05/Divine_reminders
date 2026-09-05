import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { computeDayPanchangam, iterateDays, type DayPanchangam } from './panchangam';
import {
  generateMonthlyKrithigaiEvents,
  generateMonthlySashtiEvents,
  generateMuruganEvents,
  generateTheipiraiSashtiEvents,
} from './deities/murugan';
import { generateMonthlyEkadashiEvents, generateVishnuEvents } from './deities/vishnu';
import { generateMonthlyPradoshamEvents, generateMonthlyShivaratriEvents, generateShivaEvents } from './deities/shiva';
import { generateMonthlyDurgashtamiEvents, generateDurgaEvents } from './deities/durga';
import { generateMonthlyChaturthiEvents, generateGaneshaEvents } from './deities/ganesha';
import { generateAyyappanEvents } from './deities/ayyappan';
import { generateMonthlyAmavasaiPournamiEvents } from './deities/general';
import type { BaseDeityEvent } from './deity-utils';

const START_YEAR = 2026;
const END_YEAR = 2035;

const ASSUMPTIONS = {
  location: 'Chennai, Tamil Nadu (13.0827N, 80.2707E)',
  ayanamsa: 'Lahiri (linear approximation, ~1 arcmin accuracy)',
  dayBoundary: 'Local sunrise (panchangam value prevailing at sunrise defines the calendar day)',
  note: 'Astronomically computed. May occasionally differ by ±1 day from a specific temple\'s published panchangam near tithi/nakshatra boundary edge cases.',
};

function writeDataset(deity: string, events: BaseDeityEvent[]) {
  const output = {
    deity,
    range: { startYear: START_YEAR, endYear: END_YEAR },
    assumptions: ASSUMPTIONS,
    generatedAt: new Date().toISOString(),
    events,
  };
  const outPath = join(__dirname, '..', 'assets', 'data', `${deity}-events.json`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Wrote ${outPath} (${events.length} events)`);
}

function main() {
  const days: DayPanchangam[] = [];
  for (const [y, m, d] of iterateDays(START_YEAR, END_YEAR)) {
    days.push(computeDayPanchangam(y, m, d));
  }
  console.log(`Computed panchangam for ${days.length} days (${START_YEAR}-${END_YEAR}).`);

  // Murugan
  const muruganAnnual = generateMuruganEvents(days, START_YEAR, END_YEAR);
  const muruganFestivalDates = new Set(muruganAnnual.map((e) => e.date));
  const muruganEvents = [
    ...muruganAnnual,
    ...generateMonthlySashtiEvents(days, muruganFestivalDates),
    ...generateMonthlyKrithigaiEvents(days, muruganFestivalDates),
    ...generateTheipiraiSashtiEvents(days),
  ].sort((a, b) => a.date.localeCompare(b.date));
  writeDataset('murugan', muruganEvents);

  // Vishnu
  const vishnuAnnual = generateVishnuEvents(days, START_YEAR, END_YEAR);
  const vishnuFestivalDates = new Set(vishnuAnnual.map((e) => e.date));
  const vishnuEvents = [...vishnuAnnual, ...generateMonthlyEkadashiEvents(days, vishnuFestivalDates)].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  writeDataset('vishnu', vishnuEvents);

  // Shiva
  const shivaAnnual = generateShivaEvents(days, START_YEAR, END_YEAR);
  const shivaFestivalDates = new Set(shivaAnnual.map((e) => e.date));
  const shivaEvents = [
    ...shivaAnnual,
    ...generateMonthlyPradoshamEvents(days, shivaFestivalDates),
    ...generateMonthlyShivaratriEvents(days, shivaFestivalDates),
  ].sort((a, b) => a.date.localeCompare(b.date));
  writeDataset('shiva', shivaEvents);

  // Durga
  const durgaAnnual = generateDurgaEvents(days, START_YEAR, END_YEAR);
  const durgaFestivalDates = new Set(durgaAnnual.map((e) => e.date));
  const durgaEvents = [...durgaAnnual, ...generateMonthlyDurgashtamiEvents(days, durgaFestivalDates)].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  writeDataset('durga', durgaEvents);

  // Ganesha
  const ganeshaAnnual = generateGaneshaEvents(days, START_YEAR, END_YEAR);
  const ganeshaFestivalDates = new Set(ganeshaAnnual.map((e) => e.date));
  const ganeshaEvents = [...ganeshaAnnual, ...generateMonthlyChaturthiEvents(days, ganeshaFestivalDates)].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  writeDataset('ganesha', ganeshaEvents);

  // Ayyappan - both events are solar-month transitions, not tithi-scoped
  // per year, so there's no separate "annual" vs "monthly" split here.
  const ayyappanEvents = generateAyyappanEvents(days);
  writeDataset('ayyappan', ayyappanEvents);

  // General (not deity-specific): Amavasai & Pournami, every lunar month -
  // shown on Home regardless of which deities someone follows.
  const generalEvents = generateMonthlyAmavasaiPournamiEvents(days).sort((a, b) => a.date.localeCompare(b.date));
  writeDataset('general', generalEvents);

  const total =
    muruganEvents.length +
    vishnuEvents.length +
    shivaEvents.length +
    durgaEvents.length +
    ganeshaEvents.length +
    ayyappanEvents.length +
    generalEvents.length;
  console.log(`Generated ${total} events across 6 deities + general lunar days.`);
}

main();
