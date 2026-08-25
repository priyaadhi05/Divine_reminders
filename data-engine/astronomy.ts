import * as Astronomy from 'astronomy-engine';
import { CHENNAI } from './constants';

export function norm360(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

export function sunTropicalLongitudeDeg(date: Date): number {
  return norm360(Astronomy.SunPosition(date).elon);
}

export function moonTropicalLongitudeDeg(date: Date): number {
  return norm360(Astronomy.EclipticGeoMoon(date).lon);
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function istMidnightUTC(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - IST_OFFSET_MS);
}

export function toISTDateParts(utcDate: Date): { year: number; month: number; day: number } {
  const shifted = new Date(utcDate.getTime() + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

// Sunrise (top-of-disc) at Chennai for the IST calendar day starting at istMidnight.
export function sunriseForISTDay(istMidnight: Date): Date {
  const rise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, CHENNAI, +1, istMidnight, 2);
  if (!rise) {
    throw new Error(`No sunrise found starting ${istMidnight.toISOString()}`);
  }
  return rise.date;
}
