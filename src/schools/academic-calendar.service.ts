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
}

/**
 * Computes whether a university is "in session" based on the academic
 * calendar of its country. There is no reliable free third-party API for
 * global term dates, so countries with a standardized calendar are modeled
 * here. Germany follows a two-semester system:
 *
 *   - Wintersemester: lectures ~mid-Oct → mid-Feb (semester Oct 1 – Mar 31)
 *   - Sommersemester: lectures ~mid-Apr → mid-Jul (semester Apr 1 – Sep 30)
 *
 * Source: standard German Vorlesungszeit ranges published by the HRK /
 * individual universities. Dates vary slightly per institution, so these are
 * representative reference ranges.
 */
@Injectable()
export class AcademicCalendarService {
  getSession(countryCode?: string | null, on: Date = new Date()): AcademicSession {
    const code = (countryCode || '').toUpperCase();
    if (code === 'DE') return this.germanSession(on);

    return {
      countryCode: code || null,
      currentSemester: null,
      status: 'unknown',
      inSession: false,
      lectureStart: null,
      lectureEnd: null,
      nextSessionStart: null,
      note: 'Academic calendar not available for this country.',
    };
  }

  private iso(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private germanSession(on: Date): AcademicSession {
    const year = on.getFullYear();

    // Representative lecture (Vorlesungszeit) windows.
    const winterStart = new Date(year, 9, 15); // Oct 15
    const winterEnd = new Date(year + 1, 1, 14); // Feb 14 (next year)
    const prevWinterEnd = new Date(year, 1, 14); // Feb 14 (this year)
    const summerStart = new Date(year, 3, 15); // Apr 15
    const summerEnd = new Date(year, 6, 15); // Jul 15

    // Summer semester lectures
    if (on >= summerStart && on <= summerEnd) {
      return {
        countryCode: 'DE',
        currentSemester: `Sommersemester ${year}`,
        status: 'in_session',
        inSession: true,
        lectureStart: this.iso(summerStart),
        lectureEnd: this.iso(summerEnd),
        nextSessionStart: null,
        note: 'Summer semester lectures are currently in session.',
      };
    }

    // Winter semester lectures (Oct–Dec of this year)
    if (on >= winterStart) {
      return {
        countryCode: 'DE',
        currentSemester: `Wintersemester ${year}/${String((year + 1) % 100).padStart(2, '0')}`,
        status: 'in_session',
        inSession: true,
        lectureStart: this.iso(winterStart),
        lectureEnd: this.iso(winterEnd),
        nextSessionStart: null,
        note: 'Winter semester lectures are currently in session.',
      };
    }

    // Winter semester lectures spilling into Jan–mid-Feb of this year
    if (on <= prevWinterEnd) {
      return {
        countryCode: 'DE',
        currentSemester: `Wintersemester ${year - 1}/${String(year % 100).padStart(2, '0')}`,
        status: 'in_session',
        inSession: true,
        lectureStart: this.iso(new Date(year - 1, 9, 15)),
        lectureEnd: this.iso(prevWinterEnd),
        nextSessionStart: this.iso(summerStart),
        note: 'Winter semester lectures are currently in session.',
      };
    }

    // On break — determine the next lecture period
    const nextStart = on < summerStart ? summerStart : winterStart;
    const isWinterBreak = on > prevWinterEnd && on < summerStart;
    return {
      countryCode: 'DE',
      currentSemester: null,
      status: 'on_break',
      inSession: false,
      lectureStart: null,
      lectureEnd: null,
      nextSessionStart: this.iso(nextStart),
      note: isWinterBreak
        ? 'Currently on the lecture-free period between winter and summer semesters.'
        : 'Currently on the summer lecture-free period before winter semester.',
    };
  }
}
