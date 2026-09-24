import type { EventCategory } from '@/data/events';

// Category names and deity names are pan-Indian/Sanskrit-derived terms with
// well-established spellings in each script (e.g. Ekadashi/ఏకాదశి/ಏಕಾದಶಿ/
// एकादशी are the same word, not a translation) - kept separate from
// translations.ts, which is free-form UI copy.
const CATEGORY_LABEL_TRANSLATIONS: Record<EventCategory, Record<string, string>> = {
  festival: { en: 'Festival', ta: 'திருவிழா', te: 'పండుగ', kn: 'ಹಬ್ಬ', hi: 'त्योहार' },
  vratham: { en: 'Vratham', ta: 'விரதம்', te: 'వ్రతం', kn: 'ವ್ರತ', hi: 'व्रत' },
  'monthly-sashti': { en: 'Valarpirai Sashti', ta: 'வளர்பிறை சஷ்டி', te: 'శుక్ల షష్ఠి', kn: 'ಶುಕ್ಲ ಷಷ್ಠಿ', hi: 'शुक्ल षष्ठी' },
  'theipirai-sashti': { en: 'Theipirai Sashti', ta: 'தேய்பிறை சஷ்டி', te: 'కృష్ణ షష్ఠి', kn: 'ಕೃಷ್ಣ ಷಷ್ಠಿ', hi: 'कृष्ण षष्ठी' },
  'monthly-krithigai': { en: 'Monthly Krithigai', ta: 'மாத கார்த்திகை', te: 'మాస కృత్తిక', kn: 'ಮಾಸ ಕೃತ್ತಿಕಾ', hi: 'मासिक कृत्तिका' },
  ekadashi: { en: 'Ekadashi', ta: 'ஏகாதசி', te: 'ఏకాదశి', kn: 'ಏಕಾದಶಿ', hi: 'एकादशी' },
  pradosham: { en: 'Pradosham', ta: 'பிரதோஷம்', te: 'ప్రదోషం', kn: 'ಪ್ರದೋಷ', hi: 'प्रदोष' },
  'monthly-shivaratri': { en: 'Masa Shivaratri', ta: 'மாத சிவராத்திரி', te: 'మాస శివరాత్రి', kn: 'ಮಾಸ ಶಿವರಾತ್ರಿ', hi: 'मासिक शिवरात्रि' },
  'monthly-durgashtami': { en: 'Durgashtami', ta: 'துர்காஷ்டமி', te: 'దుర్గాష్టమి', kn: 'ದುರ್ಗಾಷ್ಟಮಿ', hi: 'दुर्गाष्टमी' },
  'monthly-chaturthi': { en: 'Sankashti Chaturthi', ta: 'சங்கடஹர சதுர்த்தி', te: 'సంకష్ట చతుర్థి', kn: 'ಸಂಕಷ್ಟ ಚತುರ್ಥಿ', hi: 'संकष्टी चतुर्थी' },
  amavasai: { en: 'Amavasai', ta: 'அமாவாசை', te: 'అమావాస్య', kn: 'ಅಮಾವಾಸ್ಯೆ', hi: 'अमावस्या' },
  pournami: { en: 'Pournami', ta: 'பௌர்ணமி', te: 'పౌర్ణమి', kn: 'ಹುಣ್ಣಿಮೆ', hi: 'पूर्णिमा' },
};

const DEITY_NAME_TRANSLATIONS: Record<string, Record<string, string>> = {
  murugan: { en: 'Murugan', ta: 'முருகன்', te: 'మురుగన్', kn: 'ಮುರುಗನ್', hi: 'मुरुगन' },
  vishnu: { en: 'Vishnu', ta: 'விஷ்ணு', te: 'విష్ణు', kn: 'ವಿಷ್ಣು', hi: 'विष्णु' },
  shiva: { en: 'Shiva', ta: 'சிவன்', te: 'శివుడు', kn: 'ಶಿವ', hi: 'शिव' },
  durga: { en: 'Amman', ta: 'அம்மன்', te: 'దుర్గ', kn: 'ದುರ್ಗಾ', hi: 'दुर्गा' },
  ganesha: { en: 'Ganesha', ta: 'விநாயகர்', te: 'గణేశ్', kn: 'ಗಣೇಶ', hi: 'गणेश' },
  ayyappan: { en: 'Ayyappan', ta: 'ஐயப்பன்', te: 'అయ్యప్ప', kn: 'ಅಯ್ಯಪ್ಪ', hi: 'अय्यप्पा' },
  hanuman: { en: 'Hanuman', ta: 'ஹனுமான்', te: 'హనుమాన్', kn: 'ಹನುಮಾನ್', hi: 'हनुमान' },
  lakshmi: { en: 'Lakshmi', ta: 'லட்சுமி', te: 'లక్ష్మి', kn: 'ಲಕ್ಷ್ಮಿ', hi: 'लक्ष्मी' },
};

export function translatedCategoryLabel(languageId: string, category: EventCategory, fallback: string): string {
  return CATEGORY_LABEL_TRANSLATIONS[category]?.[languageId] ?? fallback;
}

export function translatedDeityName(languageId: string, deityId: string, fallback: string): string {
  return DEITY_NAME_TRANSLATIONS[deityId]?.[languageId] ?? fallback;
}
