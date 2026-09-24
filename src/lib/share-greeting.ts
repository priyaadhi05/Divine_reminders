import { daysUntil, formatEventDate, getDeityById, type DeityEvent } from '@/data/events';

// The personal message that goes out with a share - written like something
// someone would actually send a relative, not a calendar entry. It's the
// text for WhatsApp / "More", and the same words are written onto the picture
// itself (components/greeting-card.tsx), since a share sheet can attach a
// picture but not a caption alongside it. Kept in English like the rest of
// the event content (names, descriptions, reminder text) - only the app's own
// labels are translated.
export function buildGreeting(event: DeityEvent): string {
  const deity = getDeityById(event.deity);
  const symbol = deity?.symbol ?? (event.category === 'pournami' ? '🌕' : event.category === 'amavasai' ? '🌚' : '🪔');
  const title = event.tamilName ? `${event.name} (${event.tamilName})` : event.name;
  const owner = deity ? `${deity.honorific} ${deity.name}` : null;
  const forOwner = owner ? ` - a very special day for ${owner}` : '';
  const n = daysUntil(event.date);

  let when: string;
  if (n === 0) when = `Today is ${title}${forOwner}.`;
  else if (n === 1) when = `Tomorrow is ${title}${forOwner}.`;
  else if (n > 1) when = `${title} is on ${formatEventDate(event.date)}, ${n} days from now${forOwner}.`;
  else when = `${title} falls on ${formatEventDate(event.date)}${forOwner}.`;

  const blessing = owner
    ? `May ${owner} bless you and your family with strength, wisdom, peace and grace. ${symbol}`
    : `May this sacred day fill your home with peace, health and happiness. ${symbol}`;

  return `Hi beloved 🙏\n\n${when}\n\n${blessing}`;
}
