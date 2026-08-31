// Slogans, mantras, and parayanam (recitation) texts per deity. Deliberately
// limited to well-established, widely-printed verses/titles rather than
// fabricated or uncertain ones - a wrong word in a mantra is worse than a
// missing one. These are recited, not translated: shown in their original
// script plus a Roman transliteration, unaffected by the app's UI language.
export interface VerseEntry {
  label: string; // what kind of verse this is
  title: string; // its name, in Roman transliteration
  script?: string; // the verse itself, original script, when short/certain enough to quote
  note: string; // one line on when/why it's recited
}

export interface DeityVerses {
  entries: VerseEntry[];
}

export const DEVOTIONAL_VERSES: Record<string, DeityVerses> = {
  murugan: {
    entries: [
      {
        label: 'Slogan',
        title: 'Vetri Vel Veeravel',
        script: 'வெற்றி வேல் வீரவேல்!',
        note: 'The rallying cry devotees call out at Murugan temples and during Thaipusam processions.',
      },
      {
        label: 'Mantra',
        title: 'Om Saravana Bhavaya Namaha',
        script: 'ௐ சரவணபவாய நமஃ',
        note: "Murugan's most widely chanted mantra, invoking his birth in the Saravana reed grove.",
      },
      {
        label: 'Parayanam',
        title: 'Kandha Sashti Kavasam',
        note: 'A protective hymn traditionally recited daily, especially through the six days leading to Skanda Sashti.',
      },
      {
        label: 'Tiruppugazh',
        title: 'Muthai Tharu (and 1,300+ others)',
        note: "Arunagirinathar's intricate Tamil hymns in praise of Murugan - sung at temples and in Carnatic music for their rhythm and devotion.",
      },
    ],
  },
  vishnu: {
    entries: [
      {
        label: 'Slogan',
        title: 'Om Namo Narayanaya',
        script: 'ॐ नमो नारायणाय',
        note: 'The Ashtakshara ("eight-syllable") mantra, Vishnu\'s most common invocation.',
      },
      {
        label: 'Mantra',
        title: 'Om Namo Bhagavate Vasudevaya',
        script: 'ॐ नमो भगवते वासुदेवाय',
        note: 'The Dwadashakshari ("twelve-syllable") mantra, especially associated with Krishna.',
      },
      {
        label: 'Parayanam',
        title: 'Vishnu Sahasranamam',
        script: 'शुक्लाम्बरधरं विष्णुं शशिवर्णं चतुर्भुजम् । प्रसन्नवदनं ध्यायेत् सर्वविघ्नोपशान्तये ॥',
        note: 'The 1,000 names of Vishnu; the verse above is its traditional opening invocation.',
      },
    ],
  },
  shiva: {
    entries: [
      {
        label: 'Mantra',
        title: 'Om Namah Shivaya',
        script: 'ॐ नमः शिवाय',
        note: 'The Panchakshari ("five-syllable") mantra, Shiva\'s most fundamental invocation.',
      },
      {
        label: 'Mantra',
        title: 'Maha Mrityunjaya Mantra',
        script: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् । उर्वारुकमिव बन्धनान् मृत्योर्मुक्षीय मामृतात् ॥',
        note: 'The "great death-conquering" mantra, recited for protection and healing.',
      },
      {
        label: 'Parayanam',
        title: 'Lingashtakam',
        note: 'Eight verses in praise of the Shiva Lingam, commonly chanted during abhishekam.',
      },
    ],
  },
  durga: {
    entries: [
      {
        label: 'Slogan',
        title: 'Om Shakti',
        script: 'ௐ சக்தி',
        note: "The Devi's most common invocation, called out at Amman temples.",
      },
      {
        label: 'Mantra',
        title: 'Om Dum Durgayei Namaha',
        script: 'ॐ दुं दुर्गायै नमः',
        note: "Durga's beej (seed) mantra, chanted for protection and strength.",
      },
      {
        label: 'Parayanam',
        title: 'Devi Mahatmyam (Durga Saptashati)',
        script: 'सर्वमङ्गलमाङ्गल्ये शिवे सर्वार्थसाधिके । शरण्ये त्र्यम्बके गौरि नारायणि नमोऽस्तुते ॥',
        note: 'The core scripture of Durga worship, especially during Navratri; the verse above is among its most quoted.',
      },
    ],
  },
};

export function getVersesForDeity(deityId: string): VerseEntry[] {
  return DEVOTIONAL_VERSES[deityId]?.entries ?? [];
}
