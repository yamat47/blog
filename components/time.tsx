import { parseISO, format } from 'date-fns'

export default function Time({ dateString }: { dateString: string }) {
  const isoDate = new Date(dateString).toISOString()
  const date = parseISO(isoDate)

  return <time dateTime={dateString}>{format(date, 'yyyy/LL/dd')}</time>
}
