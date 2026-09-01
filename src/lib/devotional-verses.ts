// Slogans, mantras, and parayanam (recitation) texts per deity. Short
// mantras are quoted here in full; long-form hymns (a 100+ line kavasam,
// an ashtakam, a 1,000-name or 700-verse scripture) instead link out to a
// complete, reliable source (Wikisource/Wikipedia) rather than guessing at
// or truncating them here - a wrong word in a mantra, or a silently
// incomplete "full text", is worse than pointing to the real thing. These
// are recited, not translated: shown in their original script plus a Roman
// transliteration, unaffected by the app's UI language.
export interface VerseEntry {
  label: string; // what kind of verse this is
  title: string; // its name, in Roman transliteration
  script?: string; // the verse itself, original script, when short/certain enough to quote in full
  note: string; // one line on when/why it's recited
  link?: string; // complete text at a reliable source, for anything too long to safely quote here
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
        note: 'A "kavasam" (armor) composed by Devaraya Swamigal - a protective hymn that invokes Murugan\'s weapons, vehicle, and attendants over each part of the body, traditionally recited daily and especially through the six days leading to Skanda Sashti. Tap to read the complete Tamil text.',
        link: 'https://ta.wikisource.org/wiki/%E0%AE%95%E0%AE%A8%E0%AF%8D%E0%AE%A4_%E0%AE%9A%E0%AE%B7%E0%AF%8D%E0%AE%9F%E0%AE%BF_%E0%AE%95%E0%AE%B5%E0%AE%9A%E0%AE%AE%E0%AF%8D',
      },
      {
        label: 'Tiruppugazh',
        title: 'Muthai Tharu (and 1,300+ others)',
        note: "Arunagirinathar's intricate Tamil hymns in praise of Murugan - sung at temples and in Carnatic music for their rhythm and devotion. Tap to read more about the collection.",
        link: 'https://en.wikipedia.org/wiki/Tiruppugazh',
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
        note: 'The 1,000 names of Vishnu, recited by Bhishma to Yudhishthira in the Mahabharata; the verse above is its traditional opening invocation. Tap to read all 1,000 names.',
        link: 'https://en.wikipedia.org/wiki/Vishnu_sahasranama',
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
        script:
          '1. ब्रह्ममुरारी सुरार्चित लिङ्गं\n2. देवमुनि प्रवरार्चित लिङ्गं\n3. सर्व सुगन्ध सुलेपित लिङ्गं\n4. कनक महामणि भूषित लिङ्गं\n5. कुमकुम चंदन लेपित लिङ्गं\n6. देवगणार्चित सेवित लिङ्गं\n7. अष्टदलोपरिवेष्टित लिङ्गं\n8. सुरगुरु सुरवर पूजित लिङ्गं\n\nफलश्रुति:\nलिङ्गाष्टकमिदं पुण्यं यः पठेत् शिवसन्निधौ ।\nशिवलोकमवाप्नोति शिवेन सह मोदते ॥',
        note: 'Eight verses in praise of the Shiva Lingam (each opens as shown above and closes with "tat praṇamāmi sadāśiva lingam"), commonly chanted during abhishekam. Attributed to Adi Shankara. Tap to read all eight verses in full.',
        link: 'https://sa.wikisource.org/wiki/%E0%A4%B2%E0%A4%BF%E0%A4%99%E0%A5%8D%E0%A4%97%E0%A4%BE%E0%A4%B7%E0%A5%8D%E0%A4%9F%E0%A4%95%E0%A4%AE%E0%A5%8D',
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
        note: '700 verses across 13 chapters of the Markandeya Purana ("Saptashati" - "of the 700") - the core scripture of Durga worship, recited especially during Navratri; the verse above is among its most quoted. Tap to read the full text.',
        link: 'https://en.wikipedia.org/wiki/Devi_Mahatmya',
      },
    ],
  },
  ganesha: {
    entries: [
      {
        label: 'Slogan',
        title: 'Ganapati Bappa Morya',
        note: 'The joyful chant called out during Ganesha idol processions and immersion.',
      },
      {
        label: 'Mantra',
        title: 'Om Gam Ganapataye Namaha',
        script: 'ॐ गं गणपतये नमः',
        note: "Ganesha's beej (seed) mantra, chanted before starting anything new to remove obstacles.",
      },
      {
        label: 'Parayanam',
        title: 'Ganapati Atharvashirsha',
        script: 'हरिः ॐ नमस्ते गणपतये ।',
        note: 'An Upanishadic hymn to Ganesha (opens as shown above: "Hail Om, salutations to you, Ganapati"), traditionally recited on Sankashti Chaturthi and before undertaking new ventures. Tap to read the complete text.',
        link: 'https://sa.wikisource.org/wiki/%E0%A4%97%E0%A4%A3%E0%A4%AA%E0%A4%A4%E0%A5%8D%E0%A4%AF%E0%A4%A5%E0%A4%B0%E0%A5%8D%E0%A4%B5%E0%A4%B6%E0%A5%80%E0%A4%B0%E0%A5%8D%E0%A4%B7%E0%A4%AE%E0%A5%8D',
      },
    ],
  },
  ayyappan: {
    entries: [
      {
        label: 'Slogan',
        title: 'Swamiye Saranam Ayyappa',
        note: 'The chant carried by devotees throughout the Sabarimala pilgrimage - "I take refuge in you, Swami Ayyappa."',
      },
      {
        label: 'Mantra',
        title: 'Om Sri Hariharaputraya Namaha',
        script: 'ॐ श्री हरिहरपुत्राय नमः',
        note: 'Invokes Ayyappan as the son of Hari (Vishnu) and Hara (Shiva).',
      },
      {
        label: 'Parayanam',
        title: 'Harivarasanam',
        note: 'An ashtakam (eight verses) in Sanskritised Malayalam, sung nightly just before the Sabarimala sanctum closes for the night - considered a lullaby for Ayyappan. Tap to read the full lyrics.',
        link: 'https://en.wikipedia.org/wiki/Harivarasanam',
      },
    ],
  },
};

export function getVersesForDeity(deityId: string): VerseEntry[] {
  return DEVOTIONAL_VERSES[deityId]?.entries ?? [];
}
