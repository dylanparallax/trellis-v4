import { ObservationsListClient, type ObservationItem } from '@/components/observations/observations-list-client'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

async function getBaseUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_BASE_URL
  if (env && env.trim().length > 0) return env.replace(/\/$/, '')
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

async function getObservations(): Promise<ObservationItem[]> {
  const baseUrl = await getBaseUrl()
  const url = new URL('/api/observations', baseUrl)
  const res = await fetch(url.toString(), { cache: 'no-store' })
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