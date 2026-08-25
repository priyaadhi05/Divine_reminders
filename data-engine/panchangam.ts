import { lahiriAyanamsaDeg } from './ayanamsa';
import {
  istMidnightUTC,
  moonTropicalLongitudeDeg,
  norm360,
  sunriseForISTDay,
  sunTropicalLongitudeDeg,
} from './astronomy';
import { NAKSHATRAS, TAMIL_MONTHS, TITHI_NAMES } from './constants';

export interface DayPanchangam {
  dateStr: string; // YYYY-MM-DD, IST calendar date
  sunriseUTC: string;
  tithiNum: number; // 1-30 (1-15 Shukla paksha, 16-30 Krishna paksha)
  tithiName: string;
  paksha: 'Shukla' | 'Krishna';
  nakshatraIndex: number; // 0-26
  nakshatraName: string;
  tamilMonthIndex: number; // 0-11, 0 = Chithirai
  tamilMonthName: string;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function computeDayPanchangam(year: number, month: number, day: number): DayPanchangam {
  const istMidnight = istMidnightUTC(year, month, day);
  const sunrise = sunriseForISTDay(istMidnight);

  const sunTropical = sunTropicalLongitudeDeg(sunrise);
  const moonTropical = moonTropicalLongitudeDeg(sunrise);
  const ayanamsa = lahiriAyanamsaDeg(sunrise);

  const siderealSun = norm360(sunTropical - ayanamsa);
  const siderealMoon = norm360(moonTropical - ayanamsa);

  const tithiAngle = norm360(moonTropical - sunTropical);
  const tithiNum = Math.floor(tithiAngle / 12) + 1;
  const nakshatraIndex = Math.floor(siderealMoon / (360 / 27)) % 27;
  const tamilMonthIndex = Math.floor(siderealSun / 30) % 12;

  return {
    dateStr: `${year}-${pad(month)}-${pad(day)}`,
    sunriseUTC: sunrise.toISOString(),
    tithiNum,
    tithiName: TITHI_NAMES[tithiNum - 1],
    paksha: tithiNum <= 15 ? 'Shukla' : 'Krishna',
    nakshatraIndex,
    nakshatraName: NAKSHATRAS[nakshatraIndex],
    tamilMonthIndex,
    tamilMonthName: TAMIL_MONTHS[tamilMonthIndex],
  };
}

export function* iterateDays(startYear: number, endYear: number): Generator<[number, number, number]> {
  const start = new Date(Date.UTC(startYear, 0, 1));
  const end = new Date(Date.UTC(endYear + 1, 0, 1));
  for (let t = start.getTime(); t < end.getTime(); t += 86400000) {
    const d = new Date(t);
    yield [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
  }
}
