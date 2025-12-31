import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: 'task' | 'event' | 'habit' | 'milestone' | 'focus' | 'meeting' | 'break' | 'personal' | 'routine';
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  completed?: boolean;
}

export function generateICSContent(events: CalendarEvent[]): string {
  const formatICSDate = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  const escapeICSText = (text: string) => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const now = new Date();
  const uid = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@lifeflow`;

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LifeFlow//ADHD Life Management//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:LifeFlow',
    'X-WR-TIMEZONE:America/Sao_Paulo',
  ];

  events.forEach((event) => {
    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${uid()}`,
      `DTSTAMP:${formatICSDate(now)}`,
      `DTSTART:${formatICSDate(event.startDate)}`,
      `DTEND:${formatICSDate(event.endDate)}`,
      `SUMMARY:${escapeICSText(event.title)}`,
    );

    if (event.description) {
      icsContent.push(`DESCRIPTION:${escapeICSText(event.description)}`);
    }

    if (event.priority) {
      const priorityMap: Record<string, string> = {
        urgent: '1',
        high: '3',
        medium: '5',
        low: '9',
      };
      icsContent.push(`PRIORITY:${priorityMap[event.priority]}`);
    }

    if (event.completed) {
      icsContent.push('STATUS:COMPLETED');
    } else {
      icsContent.push('STATUS:CONFIRMED');
    }

    // Add category based on type
    icsContent.push(`CATEGORIES:${event.type.toUpperCase()}`);

    icsContent.push('END:VEVENT');
  });

  icsContent.push('END:VCALENDAR');

  return icsContent.join('\r\n');
}

export function downloadICS(events: CalendarEvent[], filename: string = 'lifeflow-calendar.ics') {
  const content = generateICSContent(events);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseICSContent(content: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = content.split(/\r?\n/);
  
  let currentEvent: Partial<CalendarEvent> | null = null;
  let currentKey = '';
  let currentValue = '';

  const parseICSDate = (dateStr: string): Date => {
    // Handle both DATE and DATETIME formats
    const cleanDate = dateStr.replace(/[TZ]/g, '');
    const year = parseInt(cleanDate.substr(0, 4));
    const month = parseInt(cleanDate.substr(4, 2)) - 1;
    const day = parseInt(cleanDate.substr(6, 2));
    const hour = cleanDate.length >= 10 ? parseInt(cleanDate.substr(8, 2)) : 0;
    const minute = cleanDate.length >= 12 ? parseInt(cleanDate.substr(10, 2)) : 0;
    return new Date(year, month, day, hour, minute);
  };

  const unescapeICSText = (text: string): string => {
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Handle line continuations
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      i++;
      line += lines[i].substr(1);
    }

    if (line === 'BEGIN:VEVENT') {
      currentEvent = {
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'event',
      };
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentEvent.title && currentEvent.startDate) {
        if (!currentEvent.endDate) {
          currentEvent.endDate = new Date(currentEvent.startDate.getTime() + 60 * 60 * 1000); // Default 1 hour
        }
        events.push(currentEvent as CalendarEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > -1) {
        let key = line.substr(0, colonIndex);
        const value = line.substr(colonIndex + 1);
        
        // Remove parameters from key (e.g., DTSTART;TZID=...)
        const semiIndex = key.indexOf(';');
        if (semiIndex > -1) {
          key = key.substr(0, semiIndex);
        }

        switch (key) {
          case 'SUMMARY':
            currentEvent.title = unescapeICSText(value);
            break;
          case 'DESCRIPTION':
            currentEvent.description = unescapeICSText(value);
            break;
          case 'DTSTART':
            currentEvent.startDate = parseICSDate(value);
            break;
          case 'DTEND':
            currentEvent.endDate = parseICSDate(value);
            break;
          case 'PRIORITY':
            const priority = parseInt(value);
            if (priority <= 2) currentEvent.priority = 'urgent';
            else if (priority <= 4) currentEvent.priority = 'high';
            else if (priority <= 6) currentEvent.priority = 'medium';
            else currentEvent.priority = 'low';
            break;
          case 'STATUS':
            currentEvent.completed = value === 'COMPLETED';
            break;
          case 'CATEGORIES':
            const cat = value.toLowerCase();
            if (['task', 'event', 'habit', 'milestone', 'focus', 'meeting', 'break', 'personal', 'routine'].includes(cat)) {
              currentEvent.type = cat as CalendarEvent['type'];
            }
            break;
        }
      }
    }
  }

  return events;
}

export function importICSFile(file: File): Promise<CalendarEvent[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const events = parseICSContent(content);
        resolve(events);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo ICS'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
}
