import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { computeDayPanchangam, iterateDays, type DayPanchangam } from './panchangam';
import {
  generateMonthlyKrithigaiEvents,
  generateMonthlySashtiEvents,
  generateMuruganEvents,
  generateTheipiraiSashtiEvents,
} from './deities/murugan';

const START_YEAR = 2026;
const END_YEAR = 2035;

function main() {
  const days: DayPanchangam[] = [];
  for (const [y, m, d] of iterateDays(START_YEAR, END_YEAR)) {
    days.push(computeDayPanchangam(y, m, d));
  }
  console.log(`Computed panchangam for ${days.length} days (${START_YEAR}-${END_YEAR}).`);

  const annualEvents = generateMuruganEvents(days, START_YEAR, END_YEAR);
  const festivalDates = new Set(annualEvents.map((e) => e.date));
  const monthlySashti = generateMonthlySashtiEvents(days, festivalDates);
  const monthlyKrithigai = generateMonthlyKrithigaiEvents(days, festivalDates);
  const theipiraiSashti = generateTheipiraiSashtiEvents(days);

  const events = [...annualEvents, ...monthlySashti, ...monthlyKrithigai, ...theipiraiSashti].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  console.log(
    `Generated ${events.length} Murugan events ` +
      `(${annualEvents.length} annual festival/vratham, ${monthlySashti.length} monthly Sashti, ` +
      `${monthlyKrithigai.length} monthly Krithigai, ${theipiraiSashti.length} Theipirai Sashti).`
  );

  const output = {
    deity: 'murugan',
    range: { startYear: START_YEAR, endYear: END_YEAR },
    assumptions: {
      location: 'Chennai, Tamil Nadu (13.0827N, 80.2707E)',
      ayanamsa: 'Lahiri (linear approximation, ~1 arcmin accuracy)',
      dayBoundary: 'Local sunrise (panchangam value prevailing at sunrise defines the calendar day)',
      note: 'Astronomically computed. May occasionally differ by ±1 day from a specific temple\'s published panchangam near tithi/nakshatra boundary edge cases.',
    },
    generatedAt: new Date().toISOString(),
    events,
  };

  const outPath = join(__dirname, '..', 'assets', 'data', 'murugan-events.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Wrote ${outPath}`);
}

main();
