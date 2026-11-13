import { SITE } from "../site";

// sv-SE formats a date as YYYY-MM-DD, which is how the blog has always shown dates.
const dayFormat = new Intl.DateTimeFormat("sv-SE", { timeZone: SITE.timeZone });

/** The calendar day of `date` in the site's time zone, as YYYY-MM-DD. */
export function formatDay(date: Date): string {
  return dayFormat.format(date);
}
