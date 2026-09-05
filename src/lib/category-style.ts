import type { ThemeColor } from '@/constants/theme';
import type { EventCategory } from '@/data/events';

export const CATEGORY_STYLE: Record<EventCategory, { colorKey: ThemeColor; icon: string }> = {
  festival: { colorKey: 'primary', icon: '🔱' },
  vratham: { colorKey: 'maroon', icon: '🪔' },
  'monthly-sashti': { colorKey: 'accent', icon: '🌔' },
  'theipirai-sashti': { colorKey: 'accent', icon: '🌘' },
  'monthly-krithigai': { colorKey: 'secondary', icon: '✨' },
  ekadashi: { colorKey: 'secondary', icon: '🪷' },
  pradosham: { colorKey: 'accent', icon: '🌙' },
  'monthly-shivaratri': { colorKey: 'maroon', icon: '🌑' },
  'monthly-durgashtami': { colorKey: 'primary', icon: '🦁' },
  'monthly-chaturthi': { colorKey: 'primary', icon: '🐭' },
  amavasai: { colorKey: 'maroon', icon: '🌚' },
  pournami: { colorKey: 'secondary', icon: '🌕' },
};
