function yearFraction(date: Date): number {
  const year = date.getUTCFullYear();
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year + 1, 0, 1);
  return year + (date.getTime() - start) / (end - start);
}

// Linear approximation of the Lahiri (Chitrapaksha) ayanamsa, calibrated to the
// Indian Calendar Reform Committee's 1956-03-21 reference value of 23°15'00",
// advanced by the general precession rate (~50.29"/year). Accurate to within
// about 1 arcminute over 2020-2040, which is far finer than the ~12-13 degree
// tithi/nakshatra boundaries this app needs to place a day into.
const LAHIRI_EPOCH_YEAR = 1956 + 80 / 365.25; // 1956-03-21
const LAHIRI_EPOCH_VALUE_DEG = 23 + 15 / 60;
const PRECESSION_DEG_PER_YEAR = 50.29 / 3600;

export function lahiriAyanamsaDeg(date: Date): number {
  return LAHIRI_EPOCH_VALUE_DEG + PRECESSION_DEG_PER_YEAR * (yearFraction(date) - LAHIRI_EPOCH_YEAR);
}
