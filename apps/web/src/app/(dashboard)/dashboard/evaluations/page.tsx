import { headers } from 'next/headers'
import { EvaluationsListClient } from '@/components/evaluations/evaluations-list-client'

export const dynamic = 'force-dynamic'

async function getBaseUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_BASE_URL
  if (env && env.trim().length > 0) return env.replace(/\/$/, '')
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

async function getEvaluations() {
  const baseUrl = await getBaseUrl()
  const h = await headers()
  const cookieHeader = h.get('cookie') ?? ''
  const res = await fetch(`${baseUrl}/api/evaluations`, { cache: 'no-store', headers: { cookie: cookieHeader } })
  if (!res.ok) return []
  return res.json()
}

export default async function EvaluationsPage() {
  const evaluations = await getEvaluations()
  
  return <EvaluationsListClient initial={evaluations} />
}

 