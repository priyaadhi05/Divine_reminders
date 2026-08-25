import type { DayPanchangam } from '../panchangam';
import {
  computeWindow,
  findAllCyclicOccurrences,
  findTithiNear,
  nakshatraInMonth,
  NAKSHATRA_INDEX,
  panchangamForDate,
  subtractDays,
  tithiInMonth,
  type WindowSpec,
} from '../deity-utils';

export type DeityEventCategory =
  | 'festival'
  | 'vratham'
  | 'monthly-sashti'
  | 'monthly-krithigai'
  | 'theipirai-sashti';

export interface DeityEvent {
  id: string;
  deity: 'murugan';
  name: string;
  tamilName: string;
  date: string; // YYYY-MM-DD
  category: DeityEventCategory;
  tamilMonth: string;
  basis: string; // the panchangam rule that placed this date, for transparency
  description: string;
  significance: string;
  // Precise start/end of the governing tithi/nakshatra span, in UTC (ISO 8601).
  // Absent for events not defined by a single tithi/nakshatra crossing (e.g.
  // vrathams derived by counting days back from another event).
  periodStartUTC?: string;
  periodEndUTC?: string;
}

// Monthly Valarpirai Sashti ("waxing-moon Sashti", 6th tithi of the waxing
// moon) is observed every lunar month as Murugan's day; the Aippasi
// occurrence is the major Skanda Sashti festival already generated above, so
// it's excluded here to avoid listing the same date twice under two
// categories. Named "Valarpirai" (waxing) to mirror "Theipirai" (waning)
// below, since both are the same monthly observance on opposite fortnights.
export function generateMonthlySashtiEvents(
  days: DayPanchangam[],
  festivalDates: Set<string>
): DeityEvent[] {
  const indices = findAllCyclicOccurrences(days, (d) => d.tithiNum - 1, 30, 5); // tithi 6, 0-indexed
  return indices
    .map((idx) => days[idx])
    .filter((d) => !festivalDates.has(d.dateStr))
    .map((d) => ({
      id: `murugan-valarpirai-sashti-${d.dateStr}`,
      deity: 'murugan' as const,
      name: 'Valarpirai Sashti',
      tamilName: 'வளர்பிறை சஷ்டி',
      date: d.dateStr,
      category: 'monthly-sashti' as const,
      tamilMonth: d.tamilMonthName,
      basis: 'Shukla Sashti tithi (monthly, waxing moon)',
      description:
        'Monthly observance of Murugan on the sixth day of the waxing moon, echoing the day he vanquished Soorapadman.',
      significance: 'Devotees fast and visit Murugan temples; the Aippasi occurrence is the major annual Skanda Sashti.',
      ...computeWindow({ kind: 'tithi', target: 6 }, d.sunriseUTC),
    }));
}

// Monthly Krithigai (Krittika nakshatra day) is observed every sidereal
// month as Murugan's star day; the Aadi and Karthigai occurrences are the
// major festivals already generated above, so they're excluded here.
export function generateMonthlyKrithigaiEvents(
  days: DayPanchangam[],
  festivalDates: Set<string>
): DeityEvent[] {
  const indices = findAllCyclicOccurrences(days, (d) => d.nakshatraIndex, 27, NAKSHATRA_INDEX['Krittika']);
  return indices
    .map((idx) => days[idx])
    .filter((d) => !festivalDates.has(d.dateStr))
    .map((d) => ({
      id: `murugan-krithigai-${d.dateStr}`,
      deity: 'murugan' as const,
      name: 'Krithigai',
      tamilName: 'கிருத்திகை',
      date: d.dateStr,
      category: 'monthly-krithigai' as const,
      tamilMonth: d.tamilMonthName,
      basis: 'Krittika nakshatra (monthly)',
      description: "Monthly star day honoring Murugan, raised by the six Krittika stars as Arumugam/Shanmukha.",
      significance: 'Observed with lamp-lighting at Murugan and Shiva temples; the Aadi and Karthigai occurrences are the major annual festivals.',
      ...computeWindow({ kind: 'nakshatra', target: NAKSHATRA_INDEX['Krittika'] }, d.sunriseUTC),
    }));
}

// Theipirai Sashti ("waning-moon Sashti") is the sixth day of the waning
// moon (Krishna paksha) - a secondary, less prominent Murugan observance
// distinct from the primary Sashti above (which is the waxing-moon,
// Shukla paksha, Sashti that Skanda Sashti itself is built from). It never
// coincides with a major festival date, so no exclusion set is needed.
export function generateTheipiraiSashtiEvents(days: DayPanchangam[]): DeityEvent[] {
  const indices = findAllCyclicOccurrences(days, (d) => d.tithiNum - 1, 30, 20); // tithi 21, 0-indexed
  return indices.map((idx) => days[idx]).map((d) => ({
    id: `murugan-theipirai-sashti-${d.dateStr}`,
    deity: 'murugan' as const,
    name: 'Theipirai Sashti',
    tamilName: 'தேய்பிறை சஷ்டி',
    date: d.dateStr,
    category: 'theipirai-sashti' as const,
    tamilMonth: d.tamilMonthName,
    basis: 'Krishna Sashti tithi (monthly, waning moon)',
    description: 'Secondary monthly Sashti observance on the sixth day of the waning moon, dedicated to Murugan.',
    significance: 'Less widely observed than the primary (waxing-moon) Sashti, but tracked by dedicated Murugan calendars as his day.',
    ...computeWindow({ kind: 'tithi', target: 21 }, d.sunriseUTC),
  }));
}

export function generateMuruganEvents(days: DayPanchangam[], startYear: number, endYear: number): DeityEvent[] {
  const events: DeityEvent[] = [];

  for (let year = startYear; year <= endYear; year++) {
    // None of these festival months straddle the Gregorian year boundary
    // (Thai is Jan-Feb, Karthigai is Nov-Dec, etc.), so scoping to the
    // calendar year alone is sufficient and avoids ever picking up the
    // previous year's tail-end occurrence of the same Tamil month.
    const yearDays = days.filter((d) => d.dateStr.startsWith(String(year)));

    const push = (
      idx: number,
      window: WindowSpec,
      e: Omit<DeityEvent, 'id' | 'deity' | 'date' | 'tamilMonth' | 'periodStartUTC' | 'periodEndUTC'>
    ) => {
      if (idx < 0 || !yearDays[idx]) return;
      const d = yearDays[idx];
      events.push({
        id: `murugan-${e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${d.dateStr}`,
        deity: 'murugan',
        date: d.dateStr,
        tamilMonth: d.tamilMonthName,
        ...e,
        ...computeWindow(window, d.sunriseUTC),
      });
    };

    push(
      tithiInMonth(yearDays, 'Chithirai', 15),
      { kind: 'tithi', target: 15 },
      {
        name: 'Chitra Pournami',
        tamilName: 'சித்திரா பௌர்ணமி',
        category: 'festival',
        basis: 'Pournami (full moon) tithi in Tamil month Chithirai',
        description:
          'Full moon day of the Tamil new year month, observed with fasting and worship at Murugan temples, notably Palani.',
        significance: 'A general Hindu full-moon festival that is also specifically observed by Murugan devotees, especially at Palani.',
      }
    );

    const thaipusamIdx = nakshatraInMonth(yearDays, 'Thai', NAKSHATRA_INDEX['Pushya']);
    if (thaipusamIdx >= 0) {
      const vrathamStartDate = subtractDays(yearDays[thaipusamIdx].dateStr, 48);
      const vrathamStartDay = panchangamForDate(days, vrathamStartDate);
      events.push({
        id: `murugan-thaipusam-vratham-begins-${vrathamStartDay.dateStr}`,
        deity: 'murugan',
        name: 'Thaipusam Vratham Begins',
        tamilName: 'மண்டல விரதம் தொடக்கம்',
        date: vrathamStartDay.dateStr,
        category: 'vratham',
        tamilMonth: vrathamStartDay.tamilMonthName,
        basis: '48 days (one mandala) before Thaipusam (Pushya nakshatra in Thai)',
        description:
          'Start of the 48-day Mandala Vratham observed by kavadi bearers before Thaipusam: fasting, celibacy, and austerity leading up to the festival.',
        significance: 'Widely observed preparatory vratham for Thaipusam kavadi bearers, especially in Malaysia, Singapore, and Tamil Nadu.',
        // Not a fixed tithi/nakshatra target the way Sashti etc. are - this day
        // is whatever tithi falls 48 days before Thaipusam. Still show its
        // precise sunrise-to-sunrise governing tithi span, same as other
        // events, so the detail screen's timing card (region-aware start/end)
        // works here too.
        ...computeWindow({ kind: 'tithi', target: vrathamStartDay.tithiNum }, vrathamStartDay.sunriseUTC),
      });
    }

    push(thaipusamIdx, { kind: 'nakshatra', target: NAKSHATRA_INDEX['Pushya'] }, {
      name: 'Thaipusam',
      tamilName: 'தைப்பூசம்',
      category: 'festival',
      basis: 'Pushya nakshatra in Tamil month Thai',
      description:
        "Commemorates Goddess Parvati giving Murugan the Vel (spear) to vanquish the demon Soorapadman. Marked by kavadi processions and piercing rituals at Murugan temples.",
      significance: 'One of the most important Murugan festivals, especially at Palani, Batu Caves, and across Tamil Nadu.',
    });

    push(
      nakshatraInMonth(yearDays, 'Vaikasi', NAKSHATRA_INDEX['Vishakha']),
      { kind: 'nakshatra', target: NAKSHATRA_INDEX['Vishakha'] },
      {
        name: 'Vaikasi Visakam',
        tamilName: 'வைகாசி விசாகம்',
        category: 'festival',
        basis: 'Vishakha nakshatra in Tamil month Vaikasi',
        description: "Celebrates the birth (avataram) of Lord Murugan, born of Vishakha nakshatra.",
        significance: 'Major birthday festival for Murugan, prominently celebrated at Thiruparankundram and Swamimalai.',
      }
    );

    push(
      nakshatraInMonth(yearDays, 'Panguni', NAKSHATRA_INDEX['Uttara Phalguni']),
      { kind: 'nakshatra', target: NAKSHATRA_INDEX['Uttara Phalguni'] },
      {
        name: 'Panguni Uthiram',
        tamilName: 'பங்குனி உத்திரம்',
        category: 'festival',
        basis: 'Uttara Phalguni (Uthiram) nakshatra in Tamil month Panguni',
        description: "Commemorates the divine wedding of Murugan and Deivanai, and of Shiva and Parvati.",
        significance:
          'Widely celebrated wedding-day festival across Tamil Murugan temples, especially Tiruchendur and Palani. ' +
          'Kavadi bearers, especially at Palani, observe a preparatory Mandala Vratham (fasting, celibacy, austerity) beforehand, the same practice observed before Thaipusam - typically around 48 days, though no source gives Panguni Uthiram its own fixed start date the way Thaipusam has, so it is not listed here as a separate calendar entry.',
      }
    );

    push(
      nakshatraInMonth(yearDays, 'Aadi', NAKSHATRA_INDEX['Krittika']),
      { kind: 'nakshatra', target: NAKSHATRA_INDEX['Krittika'] },
      {
        name: 'Aadi Krithigai',
        tamilName: 'ஆடி கிருத்திகை',
        category: 'festival',
        basis: 'Krittika nakshatra in Tamil month Aadi',
        description: "Krittika star day honoring Murugan, raised by the six Krittika (Karthigai Pengal) stars as Arumugam/Shanmukha.",
        significance: 'Observed with deepam (lamp) lighting at Murugan and Shiva temples.',
      }
    );

    push(
      nakshatraInMonth(yearDays, 'Karthigai', NAKSHATRA_INDEX['Krittika']),
      { kind: 'nakshatra', target: NAKSHATRA_INDEX['Krittika'] },
      {
        name: 'Karthigai Deepam',
        tamilName: 'கார்த்திகை தீபம்',
        category: 'festival',
        basis: 'Krittika nakshatra in Tamil month Karthigai',
        description: 'Festival of lights honoring Murugan and Shiva, with rows of lamps lit at homes and temples.',
        significance: 'Major Tamil festival of lights; especially significant at Thiruchendur and Palani Murugan temples.',
      }
    );

    // Skanda Sashti: 6-day observance in Aippasi, Shukla paksha, culminating on Sashti (tithi 6).
    const sashtiIdx = tithiInMonth(yearDays, 'Aippasi', 6);
    if (sashtiIdx >= 0) {
      const startIdx = findTithiNear(yearDays, sashtiIdx, 1, -1, 10);
      const saptamiIdx = findTithiNear(yearDays, sashtiIdx, 7, 1, 5);

      push(startIdx, { kind: 'tithi', target: 1 }, {
        name: 'Skanda Sashti Vratham Begins',
        tamilName: 'கந்த சஷ்டி விரதம் தொடக்கம்',
        category: 'vratham',
        basis: 'Shukla Prathamai in Tamil month Aippasi (6 days before Sashti)',
        description: 'Start of the 6-day Skanda Sashti fast, commemorating the six days Murugan battled the demon Soorapadman.',
        significance: 'Widely observed vratham (fast) leading up to Soorasamharam, especially at Thiruchendur.',
      });
      push(sashtiIdx, { kind: 'tithi', target: 6 }, {
        name: 'Skanda Sashti / Soorasamharam',
        tamilName: 'சூரசம்ஹாரம்',
        category: 'festival',
        basis: 'Shukla Sashti tithi in Tamil month Aippasi',
        description: 'Re-enactment of Murugan slaying the demon Soorapadman, culminating the Skanda Sashti fast.',
        significance: 'Climactic day of Skanda Sashti; grand celebration at Thiruchendur Murugan Temple.',
      });
      push(saptamiIdx, { kind: 'tithi', target: 7 }, {
        name: 'Thirukalyanam',
        tamilName: 'திருக்கல்யாணம்',
        category: 'festival',
        basis: 'Shukla Saptami tithi in Tamil month Aippasi, the day after Soorasamharam',
        description: "Celebrates Murugan's divine wedding to Deivanai, the day after Soorasamharam.",
        significance: 'Concludes the Skanda Sashti festival with temple wedding ceremonies.',
      });
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}
