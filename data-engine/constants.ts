import * as Astronomy from 'astronomy-engine';

// Reference location for Tamil-calendar sunrise/tithi/nakshatra determination,
// matching the convention used by printed Tamil panchangams.
export const CHENNAI = new Astronomy.Observer(13.0827, 80.2707, 0);

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
] as const;

// Index 0 = Chithirai (Tamil solar year begins when sidereal Sun enters Aries).
export const TAMIL_MONTHS = [
  'Chithirai', 'Vaikasi', 'Aani', 'Aadi', 'Aavani', 'Purattasi',
  'Aippasi', 'Karthigai', 'Margazhi', 'Thai', 'Maasi', 'Panguni',
] as const;

export const TITHI_NAMES = [
  'Prathamai', 'Dvitiyai', 'Tritiyai', 'Chaturthi', 'Panchami', 'Sashti', 'Sapthami',
  'Ashtami', 'Navami', 'Dasami', 'Ekadasi', 'Dvadasi', 'Trayodasi', 'Chaturdasi', 'Pournami',
  'Prathamai', 'Dvitiyai', 'Tritiyai', 'Chaturthi', 'Panchami', 'Sashti', 'Sapthami',
  'Ashtami', 'Navami', 'Dasami', 'Ekadasi', 'Dvadasi', 'Trayodasi', 'Chaturdasi', 'Amavasai',
] as const;
