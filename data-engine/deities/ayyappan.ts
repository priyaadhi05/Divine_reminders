import type { DayPanchangam } from '../panchangam';
import { computeWindow, findAllTamilMonthStarts } from '../deity-utils';

export type DeityEventCategory = 'vratham' | 'festival';

export interface DeityEvent {
  id: string;
  deity: 'ayyappan';
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

// Ayyappan's two big dates are both solar-month transitions rather than a
// tithi/nakshatra within a month, so they're found differently from every
// other deity here: Mandala Kalam begins the day the sidereal Sun enters
// Vrischika (Scorpio) - the same transition as Tamil Karthigai 1 in this
// model - and Makara Vilakku falls on Makara Sankranti, the day the Sun
// enters Makara (Capricorn), i.e. Tamil Thai 1.
export function generateAyyappanEvents(days: DayPanchangam[]): DeityEvent[] {
  const events: DeityEvent[] = [];

  for (const idx of findAllTamilMonthStarts(days, 'Karthigai')) {
    const d = days[idx];
    events.push({
      id: `ayyappan-mandala-kalam-begins-${d.dateStr}`,
      deity: 'ayyappan',
      name: 'Mandala Kalam Begins',
      tamilName: 'மண்டல காலம் தொடக்கம்',
      date: d.dateStr,
      category: 'vratham',
      tamilMonth: d.tamilMonthName,
      basis: 'First day of Tamil month Karthigai (Malayalam Vrischikam)',
      description:
        'Start of the 41-day Mandala Vratham observed by Ayyappa devotees before the Sabarimala pilgrimage: black or blue attire, going barefoot, celibacy, and daily temple visits.',
      significance: 'The most widely observed vratham among Ayyappa devotees across South India, leading up to Makara Vilakku.',
      // Not a fixed tithi target the way Sashti etc. are - shows whatever
      // tithi window happens to be active on this solar transition day, same
      // convention used for Murugan's Thaipusam Vratham Begins.
      ...computeWindow({ kind: 'tithi', target: d.tithiNum }, d.sunriseUTC),
    });
  }

  for (const idx of findAllTamilMonthStarts(days, 'Thai')) {
    const d = days[idx];
    events.push({
      id: `ayyappan-makara-vilakku-${d.dateStr}`,
      deity: 'ayyappan',
      name: 'Makara Vilakku',
      tamilName: 'மகர விளக்கு',
      date: d.dateStr,
      category: 'festival',
      tamilMonth: d.tamilMonthName,
      basis: 'First day of Tamil month Thai (Makara Sankranti)',
      description:
        'Culmination of the Mandala-Makaravilakku pilgrimage season at Sabarimala, marked by the sacred light seen on the Ponnambalamedu hill at dusk.',
      significance: "One of Sabarimala's most significant days each year, drawing millions of Ayyappa devotees.",
      ...computeWindow({ kind: 'tithi', target: d.tithiNum }, d.sunriseUTC),
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}
