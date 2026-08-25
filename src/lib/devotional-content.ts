import type { DeityEvent, EventCategory } from '@/data/events';

// "What devotees traditionally do" and "A simple prayer" for the event
// detail screen - the content behind "See the significance →" in a
// notification. Kept separate from the astronomically-generated
// description/significance fields (which explain *what* the day is);
// this is about *how* someone might mark it.
export interface DevotionalContent {
  practice: string;
  prayer: string;
}

// Fallback content by category - covers every monthly/recurring observance
// and any festival without its own override below.
const CATEGORY_CONTENT: Record<EventCategory, DevotionalContent> = {
  festival: {
    practice: 'Visit a temple if you can, wear something clean and bright, and share festive food with family.',
    prayer: 'Thank you for this day of grace. Bless my family with health, peace, and togetherness.',
  },
  vratham: {
    practice: 'A partial or full fast, quiet reflection, and avoiding conflict or excess through the day.',
    prayer: 'Give me the strength to keep this vow with a clear heart and a calm mind.',
  },
  'monthly-sashti': {
    practice: 'Fast until evening if you can, then visit a Murugan temple or simply light a lamp at home.',
    prayer: 'Vel Vel Muruga - grant me courage, clarity, and protection from what troubles me.',
  },
  'theipirai-sashti': {
    practice: 'A quieter version of monthly Sashti - a short prayer or a moment of stillness is enough.',
    prayer: 'Vel Vel Muruga - watch over my family today.',
  },
  'monthly-krithigai': {
    practice: 'Light a lamp at dusk, especially if there is a Murugan or Shiva temple nearby.',
    prayer: 'Arumuga, six-faced one, remove the darkness in my path.',
  },
  ekadashi: {
    practice: 'Many devotees fast on rice and grains, or fully, until the next morning.',
    prayer: 'Om Namo Narayanaya - keep my mind steady and my intentions pure.',
  },
  pradosham: {
    practice: 'Fast through the day and visit a Shiva temple at dusk, the hour Shiva is said to dance in joy.',
    prayer: 'Om Namah Shivaya - dissolve what no longer serves me.',
  },
  'monthly-shivaratri': {
    practice: 'A quiet night vigil - even a few minutes of silence or chanting before sleep honors the day.',
    prayer: 'Om Namah Shivaya - still my mind as You still the universe.',
  },
  'monthly-durgashtami': {
    practice: 'Light a lamp for the Devi and, if possible, offer a small act of protection or courage to someone who needs it.',
    prayer: 'Om Shakti - lend me your strength today.',
  },
};

// Overrides for specific, well-known festivals that deserve their own words
// rather than the generic category text.
const NAME_OVERRIDES: Record<string, DevotionalContent> = {
  Thaipusam: {
    practice:
      'Kavadi bearers complete their vow with a procession to the temple; others visit a Murugan temple, break coconuts, and offer milk (paal kudam).',
    prayer: 'Vel Vel Muruga - thank you for the strength to carry what I carry. Grant me courage and grace.',
  },
  'Thaipusam Vratham Begins': {
    practice: 'Begin the Mandala Vratham today if you are observing it: simple food, celibacy, and daily prayer for 48 days leading to Thaipusam.',
    prayer: 'Vel Vel Muruga - guide me through these 48 days with discipline and devotion.',
  },
  'Skanda Sashti / Soorasamharam': {
    practice: 'The climax of a 6-day fast - many visit Thiruchendur or a local Murugan temple for the re-enactment of Soorasamharam.',
    prayer: 'Vel Vel Muruga - as you vanquished Soorapadman, help me overcome what I struggle against.',
  },
  'Skanda Sashti Vratham Begins': {
    practice: 'Begin the 6-day fast today, leading up to Soorasamharam - simple meals and daily temple visits if possible.',
    prayer: 'Vel Vel Muruga - walk with me through this vratham.',
  },
  Thirukalyanam: {
    practice: 'Temples re-enact the wedding of Murugan and Deivanai - a joyful day to pray for harmony in relationships.',
    prayer: 'Bless the bonds in my life with the same devotion as Your own divine union.',
  },
  'Karthigai Deepam': {
    practice: 'Light rows of lamps (agal vilakku) at your doorstep and windows at dusk, as is done at homes and temples across Tamil Nadu.',
    prayer: 'As I light this lamp, let it dispel the darkness within and around me.',
  },
  'Panguni Uthiram': {
    practice: 'Temples celebrate the divine wedding of Murugan and Deivanai, and of Shiva and Parvati - a good day to pray for your own relationships.',
    prayer: 'Grant harmony and devotion to every bond in my life.',
  },
  'Chitra Pournami': {
    practice: 'A full-moon fast and temple visit, especially at Palani.',
    prayer: 'On this full moon, fill me with the same light and clarity.',
  },
  'Vaikasi Visakam': {
    practice: "Celebrated as Murugan's birthday - visit a temple and, if you can, sponsor or share a meal with others.",
    prayer: 'Happy birthday, Muruga - thank you for being born into this world for us.',
  },
  'Aadi Krithigai': {
    practice: 'Lamp-lighting at Murugan and Shiva temples, similar to Karthigai Deepam but on a smaller scale.',
    prayer: 'Arumuga, six-faced one, watch over my family this month.',
  },
  'Vaikunta Ekadashi': {
    practice: 'The most important Ekadashi of the year - many observe a strict fast and queue at dawn at Vishnu temples like Srirangam for Vaikunta Vaasal darshan.',
    prayer: 'Om Namo Narayanaya - open the door to what is highest and best in me.',
  },
  'Krishna Janmashtami': {
    practice: 'A midnight vigil until the hour of Krishna’s birth, followed by fasting-breaking sweets and, for children, dressing up as young Krishna.',
    prayer: 'Krishna, teach me to act with duty and without attachment to the outcome.',
  },
  'Rama Navami': {
    practice: 'Recitation of the Ramayana, temple visits, and in some homes a small Kalyanam (wedding) ceremony for Rama and Sita.',
    prayer: 'Rama, give me the patience and righteousness to walk my own difficult path.',
  },
  'Maha Shivaratri': {
    practice: 'An all-night vigil - many stay awake through all four prahara (watches) of the night, fasting and visiting a Shiva temple.',
    prayer: 'Om Namah Shivaya - awaken what is still asleep in me.',
  },
  Thiruvathirai: {
    practice: "Celebrated as Nataraja's day, especially at Chidambaram - a good day for fasting and quiet reflection on letting go.",
    prayer: 'As You dance the universe into being and dissolution, teach me to move with grace through change.',
  },
  'Navratri Begins': {
    practice: 'Set up a golu (doll display) if that is your family’s custom, and begin a nine-day fast or simplified diet.',
    prayer: 'Om Shakti - walk with me through these nine nights.',
  },
  'Maha Ashtami': {
    practice: "The most intense night of Navratri - many observe a stricter fast and attend special pujas to Durga's fierce form.",
    prayer: 'Om Shakti - give me the fierceness to protect what I love.',
  },
  'Saraswati Pooja': {
    practice: 'Place books, instruments, and tools before the Devi for blessing (Ayudha Pooja) - avoid starting new work today, just honor what you use to work.',
    prayer: 'Saraswati, clear my mind and let wisdom flow through me.',
  },
  Vijayadashami: {
    practice: 'A joyful, auspicious day to start something new - children traditionally begin learning to write (Vidyarambham) on this day.',
    prayer: 'Thank you for every victory over what holds me back.',
  },
};

export function getDevotionalContent(event: DeityEvent): DevotionalContent {
  return NAME_OVERRIDES[event.name] ?? CATEGORY_CONTENT[event.category];
}
