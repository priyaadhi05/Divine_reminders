import type { DeityEvent } from '@/data/events';

function escapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// RFC 5545 line folding: continuation lines start with a single space.
function foldLine(line: string): string {
  const limit = 75;
  if (line.length <= limit) return line;
  let result = line.slice(0, limit);
  let rest = line.slice(limit);
  while (rest.length > 0) {
    result += '\r\n ' + rest.slice(0, limit - 1);
    rest = rest.slice(limit - 1);
  }
  return result;
}

function dateToICSDate(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

function nextDayICSDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const yyyy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(next.getUTCDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

function eventToVEVENT(event: DeityEvent, dtstamp: string): string {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${event.id}@divine-calendar`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${dateToICSDate(event.date)}`,
    `DTEND;VALUE=DATE:${nextDayICSDate(event.date)}`,
    `SUMMARY:${escapeText(event.name)} (${escapeText(event.tamilName)})`,
    `DESCRIPTION:${escapeText(`${event.description}\n\n${event.significance}`)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(event.name)} is tomorrow`,
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT',
  ];
  return lines.map(foldLine).join('\r\n');
}

export function buildICS(events: DeityEvent[], calendarName: string): string {
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Divine Calendar//Events//EN',
    'CALSCALE:GREGORIAN',
    foldLine(`X-WR-CALNAME:${escapeText(calendarName)}`),
    ...events.map((e) => eventToVEVENT(e, dtstamp)),
    'END:VCALENDAR',
  ];
  return lines.join('\r\n') + '\r\n';
}
