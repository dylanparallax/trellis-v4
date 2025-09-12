'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'

export type ObservationsSeriesPoint = {
  label: string
  current: number
  previous?: number
}

type Props = {
  data: ObservationsSeriesPoint[]
}

export function ObservationsLineChart({ data }: Props) {
  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={28} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="current" name="Current" stroke="#4f46e5" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="previous" name="Previous" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}


