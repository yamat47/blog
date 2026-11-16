import { SITE } from "../site.ts";

// sv-SE formats a date as YYYY-MM-DD: the form a `time` element carries, and the one the design
// system's components take a date in, to write it their own way.
const dayFormat = new Intl.DateTimeFormat("sv-SE", { timeZone: SITE.timeZone });

/** The calendar day of `date` in the site's time zone, as YYYY-MM-DD. */
export function formatDay(date: Date): string {
  return dayFormat.format(date);
}
