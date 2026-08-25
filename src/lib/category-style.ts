import type { ThemeColor } from '@/constants/theme';
import type { EventCategory } from '@/data/events';

export const CATEGORY_STYLE: Record<EventCategory, { colorKey: ThemeColor; icon: string }> = {
  festival: { colorKey: 'primary', icon: '🔱' },
  vratham: { colorKey: 'maroon', icon: '🪔' },
  'monthly-sashti': { colorKey: 'accent', icon: '🌔' },
  'theipirai-sashti': { colorKey: 'accent', icon: '🌘' },
  'monthly-krithigai': { colorKey: 'secondary', icon: '✨' },
};
