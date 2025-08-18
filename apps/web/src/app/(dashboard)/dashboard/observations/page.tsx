import { ObservationsListClient, type ObservationItem } from '@/components/observations/observations-list-client'

export const dynamic = 'force-dynamic'

async function getObservations(): Promise<ObservationItem[]> {
  // Relative-path fetch ensures Next includes auth cookies automatically
  const res = await fetch('/api/observations', { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json()
  return data.map((o: Record<string, unknown>) => ({
    ...o,
    date: typeof o.date === 'string' ? o.date : new Date(o.date as string | Date).toISOString(),
  }))
}

export default async function ObservationsPage() {
  const observations = await getObservations()
  return <ObservationsListClient initial={observations} />
}