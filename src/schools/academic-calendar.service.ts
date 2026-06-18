import { Injectable } from '@nestjs/common';

export type SessionStatus = 'in_session' | 'on_break' | 'unknown';

export interface AcademicSession {
  /** ISO country code the calendar is based on. */
  countryCode: string | null;
  /** Human label, e.g. "Wintersemester 2025/26" or null when unknown. */
  currentSemester: string | null;
  /** Whether lectures are currently running. */
  status: SessionStatus;
  inSession: boolean;
  /** Start of the current/most-recent lecture period (ISO date). */
  lectureStart: string | null;
  /** End of the current/most-recent lecture period (ISO date). */
  lectureEnd: string | null;
  /** Start of the next lecture period when on break (ISO date). */
  nextSessionStart: string | null;
  /** Short, user-friendly description. */
  note: string;
  /** Upcoming application intake windows (human-readable). */
  intakes: string[];
}

/** A recurring lecture window expressed as month/day ranges. */
interface TermDef {
  name: string;
  /** [month (0-11), day] inclusive start */
  start: [number, number];
  /** [month (0-11), day] inclusive end */
  end: [number, number];
  /** When true, the window starts in one calendar year and ends in the next. */
  crossesYear?: boolean;
}

interface CountryCalendar {
  code: string;
  label: (start: Date) => string;
  terms: TermDef[];
  intakes: string[];
  note: string;
}

/**
 * Computes whether a university is "in session" based on the academic
 * calendar of its country. There is no reliable free third-party API for
 * global term dates, so each partner country's standardized calendar is
 * modeled here from publicly published term-time ranges. Dates vary slightly
 * per institution, so these are representative reference ranges.
 */
@Injectable()
export class AcademicCalendarService {
  private static readonly CALENDARS: Record<string, CountryCalendar> = {
    // Germany — two-semester Vorlesungszeit
    DE: {
      code: 'DE',
      label: (s) =>
        s.getMonth() >= 8
          ? `Wintersemester ${s.getFullYear()}/${String((s.getFullYear() + 1) % 100).padStart(2, '0')}`
          : `Sommersemester ${s.getFullYear()}`,
      terms: [
        { name: 'Sommersemester', start: [3, 15], end: [6, 15] }, // Apr 15 – Jul 15
        { name: 'Wintersemester', start: [9, 15], end: [1, 14], crossesYear: true }, // Oct 15 – Feb 14
      ],
      intakes: ['Wintersemester (Oct) — apply by Jul 15', 'Sommersemester (Apr) — apply by Jan 15'],
      note: 'Germany runs a two-semester system. Most public universities are tuition-free.',
    },
    // Netherlands — Sept start, two semesters
    NL: {
      code: 'NL',
      label: (s) => (s.getMonth() >= 7 ? `Semester 1 ${s.getFullYear()}/${String((s.getFullYear() + 1) % 100).padStart(2, '0')}` : `Semester 2 ${s.getFullYear()}`),
      terms: [
        { name: 'Semester 1', start: [8, 1], end: [0, 31], crossesYear: true }, // Sep 1 – Jan 31
        { name: 'Semester 2', start: [1, 1], end: [5, 30] }, // Feb 1 – Jun 30
      ],
      intakes: ['September intake — apply by May 1', 'February intake (limited) — apply by Oct 1'],
      note: 'Dutch universities start in September; many programmes are taught fully in English.',
    },
    // United Kingdom — three terms, autumn start
    GB: {
      code: 'GB',
      label: (s) => `${s.getFullYear()}/${String((s.getFullYear() + 1) % 100).padStart(2, '0')} academic year`,
      terms: [
        { name: 'Autumn & Spring terms', start: [8, 20], end: [5, 15], crossesYear: true }, // Sep 20 – Jun 15
      ],
      intakes: ['September/October intake — UCAS deadline late Jan', 'January intake (some courses)'],
      note: 'UK universities run autumn, spring and summer terms with a September start.',
    },
    // Canada — Fall & Winter, Sept start
    CA: {
      code: 'CA',
      label: (s) => (s.getMonth() >= 7 ? `Fall ${s.getFullYear()}` : `Winter ${s.getFullYear()}`),
      terms: [
        { name: 'Fall term', start: [8, 1], end: [11, 20] }, // Sep 1 – Dec 20
        { name: 'Winter term', start: [0, 6], end: [3, 30] }, // Jan 6 – Apr 30
      ],
      intakes: ['Fall (September) — apply by Jan–Mar', 'Winter (January) — apply by Sep', 'Summer (May) — select programmes'],
      note: 'Canadian universities offer Fall, Winter and Summer terms; a study permit is required.',
    },
    // Estonia — autumn start, two semesters
    EE: {
      code: 'EE',
      label: (s) => (s.getMonth() >= 7 ? `Autumn semester ${s.getFullYear()}` : `Spring semester ${s.getFullYear()}`),
      terms: [
        { name: 'Autumn semester', start: [7, 25], end: [0, 20], crossesYear: true }, // Aug 25 – Jan 20
        { name: 'Spring semester', start: [1, 1], end: [5, 20] }, // Feb 1 – Jun 20
      ],
      intakes: ['Autumn (September) — apply Jan–Apr', 'Spring (February) — apply Oct–Nov'],
      note: 'Estonia offers affordable, English-taught degrees within the EU.',
    },
    // New Zealand — southern hemisphere, two semesters
    NZ: {
      code: 'NZ',
      label: (s) => (s.getMonth() <= 5 ? `Semester 1 ${s.getFullYear()}` : `Semester 2 ${s.getFullYear()}`),
      terms: [
        { name: 'Semester 1', start: [1, 25], end: [5, 25] }, // Feb 25 – Jun 25
        { name: 'Semester 2', start: [6, 10], end: [10, 15] }, // Jul 10 – Nov 15
      ],
      intakes: ['Semester 1 (February) — apply by Dec', 'Semester 2 (July) — apply by May'],
      note: 'New Zealand follows the southern-hemisphere calendar, starting in February.',
    },
  };

  getSession(countryCode?: string | null, on: Date = new Date()): AcademicSession {
    const code = (countryCode || '').toUpperCase();
    const cal = AcademicCalendarService.CALENDARS[code];
    if (!cal) {
      return {
        countryCode: code || null,
        currentSemester: null,
        status: 'unknown',
        inSession: false,
        lectureStart: null,
        lectureEnd: null,
        nextSessionStart: null,
        note: 'Academic calendar not available for this country.',
        intakes: [],
      };
    }
    return this.resolve(cal, on);
  }

  private iso(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  /** Resolve a term window to concrete Dates for a given anchor year. */
  private windowFor(term: TermDef, year: number): { start: Date; end: Date } {
    const start = new Date(year, term.start[0], term.start[1]);
    const endYear = term.crossesYear ? year + 1 : year;
    const end = new Date(endYear, term.end[0], term.end[1], 23, 59, 59);
    return { start, end };
  }

  private resolve(cal: CountryCalendar, on: Date): AcademicSession {
    const year = on.getFullYear();
    // Check the term against the previous, current and next anchor years to
    // correctly handle windows that cross the new-year boundary.
    const anchors = [year - 1, year, year + 1];

    let active: { start: Date; end: Date } | null = null;
    const upcoming: Date[] = [];

    for (const term of cal.terms) {
      for (const a of anchors) {
        const w = this.windowFor(term, a);
        if (on >= w.start && on <= w.end) {
          if (!active || w.start < active.start) active = w;
        } else if (w.start > on) {
          upcoming.push(w.start);
        }
      }
    }

    if (active) {
      return {
        countryCode: cal.code,
        currentSemester: cal.label(active.start),
        status: 'in_session',
        inSession: true,
        lectureStart: this.iso(active.start),
        lectureEnd: this.iso(active.end),
        nextSessionStart: null,
        note: `Lectures are currently in session. ${cal.note}`,
        intakes: cal.intakes,
      };
    }

    const next = upcoming.sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
    return {
      countryCode: cal.code,
      currentSemester: null,
      status: 'on_break',
      inSession: false,
      lectureStart: null,
      lectureEnd: null,
      nextSessionStart: next ? this.iso(next) : null,
      note: `Currently between lecture periods. ${cal.note}`,
      intakes: cal.intakes,
    };
  }
}
