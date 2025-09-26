"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const HOURS_SAVED_PER_TEACHER = 10
const COST_PER_TEACHER_PER_YEAR = 100

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0"
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    Math.max(0, Math.round(value))
  )
}

export default function RoiCalculator() {
  const [numTeachers, setNumTeachers] = useState<number>(200)
  const [adminHourlyRate, setAdminHourlyRate] = useState<number>(100)

  const { totalHoursSaved, productivityValue, trellisCost, netSavings } = useMemo(() => {
    const totalHours = numTeachers * HOURS_SAVED_PER_TEACHER
    const value = totalHours * adminHourlyRate
    const cost = numTeachers * COST_PER_TEACHER_PER_YEAR
    return {
      totalHoursSaved: totalHours,
      productivityValue: value,
      trellisCost: cost,
      netSavings: value - cost,
    }
  }, [numTeachers, adminHourlyRate])

  return (
    <div className="mx-auto max-w-4xl">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-2xl">ROI Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Number of teachers</label>
              <Input
                inputMode="numeric"
                type="number"
                min={0}
                step={1}
                value={Number.isFinite(numTeachers) ? numTeachers : 0}
                onChange={(e) => setNumTeachers(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Admin hourly pay rate ($)</label>
              <Input
                inputMode="decimal"
                type="number"
                min={0}
                step={1}
                value={Number.isFinite(adminHourlyRate) ? adminHourlyRate : 0}
                onChange={(e) => setAdminHourlyRate(Math.max(0, Number(e.target.value)))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-lg bg-muted p-4">
              <div className="text-sm text-muted-foreground">Time saved</div>
              <div className="mt-1 text-2xl font-semibold">{totalHoursSaved} hours</div>
              <div className="mt-1 text-sm text-muted-foreground">{HOURS_SAVED_PER_TEACHER} hours per teacher</div>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <div className="text-sm text-muted-foreground">Productivity value</div>
              <div className="mt-1 text-2xl font-semibold">{formatCurrency(productivityValue)}</div>
              <div className="mt-1 text-sm text-muted-foreground">{totalHoursSaved.toLocaleString()} hrs × {formatCurrency(adminHourlyRate)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-lg bg-muted p-4">
              <div className="text-sm text-muted-foreground">Trellis cost</div>
              <div className="mt-1 text-2xl font-semibold">{formatCurrency(trellisCost)}/yr</div>
              <div className="mt-1 text-sm text-muted-foreground">${COST_PER_TEACHER_PER_YEAR} per teacher</div>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <div className="text-sm text-muted-foreground">Savings</div>
              <div className="mt-1 text-2xl font-semibold text-green-600">{formatCurrency(netSavings)}</div>
              <div className="mt-1 text-sm text-muted-foreground">Productivity − Cost</div>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <div className="text-sm text-muted-foreground">ROI multiple</div>
              <div className="mt-1 text-2xl font-semibold">
                {trellisCost > 0 ? (productivityValue / trellisCost).toFixed(1) + "×" : "—"}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">Value / Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


