export interface Region {
  id: string;
  label: string;
  timeZone: string; // IANA zone
}

// Curated for the Murugan/Tamil diaspora, roughly in order of devotee population.
export const REGIONS: Region[] = [
  { id: 'india', label: 'India (IST)', timeZone: 'Asia/Kolkata' },
  { id: 'srilanka', label: 'Sri Lanka', timeZone: 'Asia/Colombo' },
  { id: 'malaysia', label: 'Malaysia', timeZone: 'Asia/Kuala_Lumpur' },
  { id: 'singapore', label: 'Singapore', timeZone: 'Asia/Singapore' },
  { id: 'uk', label: 'United Kingdom', timeZone: 'Europe/London' },
  { id: 'germany', label: 'Germany', timeZone: 'Europe/Berlin' },
  { id: 'usa-east', label: 'USA - East', timeZone: 'America/New_York' },
  { id: 'usa-west', label: 'USA - West', timeZone: 'America/Los_Angeles' },
  { id: 'canada', label: 'Canada (Toronto)', timeZone: 'America/Toronto' },
  { id: 'australia', label: 'Australia (Sydney)', timeZone: 'Australia/Sydney' },
  { id: 'mauritius', label: 'Mauritius', timeZone: 'Indian/Mauritius' },
  { id: 'south-africa', label: 'South Africa', timeZone: 'Africa/Johannesburg' },
  { id: 'uae', label: 'UAE (Dubai)', timeZone: 'Asia/Dubai' },
];

export const AUTO_REGION_ID = 'auto';

export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function resolveRegionTimeZone(regionId: string): { timeZone: string; label: string } {
  if (regionId === AUTO_REGION_ID) {
    const tz = deviceTimeZone();
    return { timeZone: tz, label: `Auto (${tz})` };
  }
  const region = REGIONS.find((r) => r.id === regionId);
  return region ? { timeZone: region.timeZone, label: region.label } : resolveRegionTimeZone(AUTO_REGION_ID);
}
