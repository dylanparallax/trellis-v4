'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type FeedbackItem = {
  id: string
  createdAt: string
  submittedAt?: string | null
  type: 'FORMATIVE' | 'SUMMATIVE' | 'MID_YEAR' | 'END_YEAR'
  status: 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED'
  evaluatorName?: string | null
}

type Props = {
  items: FeedbackItem[]
}

export default function TeacherFeedbackList({ items }: Props) {
  const [view, setView] = useState<'grid' | 'table'>(() => {
    if (typeof window === 'undefined') return 'grid'
    return (localStorage.getItem('teacherFeedbackView') as 'grid' | 'table') || 'grid'
  })

  useEffect(() => {
    try { localStorage.setItem('teacherFeedbackView', view) } catch {}
  }, [view])

  if (!items || items.length === 0) {
    return <div className="text-sm text-muted-foreground">No feedback yet.</div>
  }

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const renderStatusBadge = (status: FeedbackItem['status']) => {
    if (status === 'ACKNOWLEDGED') {
      return (
        <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700">{status}</Badge>
      )
    }
    return <Badge variant="secondary">{status}</Badge>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{items.length} item{items.length === 1 ? '' : 's'}</div>
        <div className="inline-flex gap-2">
          <Button variant={view === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setView('grid')}>Grid</Button>
          <Button variant={view === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setView('table')}>Table</Button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((e) => (
            <Card key={e.id} className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{e.type}</CardTitle>
                <CardDescription>Submitted {formatDate(e.submittedAt || e.createdAt)}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex items-center gap-2">
                  {renderStatusBadge(e.status)}
                  {e.evaluatorName ? (
                    <span className="text-muted-foreground truncate">By {e.evaluatorName}</span>
                  ) : null}
                </div>
                <div className="flex justify-end">
                  <a className="underline" href={`/dashboard/evaluations/${e.id}`}>View</a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Submitted</th>
                <th className="text-left px-3 py-2 font-medium">Type</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
                <th className="text-left px-3 py-2 font-medium">Evaluator</th>
                <th className="text-right px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="px-3 py-2">{formatDate(e.submittedAt || e.createdAt)}</td>
                  <td className="px-3 py-2">{e.type}</td>
                  <td className="px-3 py-2">{renderStatusBadge(e.status)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{e.evaluatorName || '—'}</td>
                  <td className="px-3 py-2 text-right"><a className="underline" href={`/dashboard/evaluations/${e.id}`}>View</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


