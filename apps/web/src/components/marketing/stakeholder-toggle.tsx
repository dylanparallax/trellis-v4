"use client"

import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Apple, CheckCircle, SchoolIcon } from "lucide-react"

type StakeholderKey = "teachers" | "leaders" | "districts"

const stakeholderCopy: Record<StakeholderKey, { title: string; icon: ReactNode; description: string }> = {
  teachers: {
    title: "For Teachers",
    icon: <Apple className="h-5 w-5" />,
    description:
      "Feedback that feels like coaching instead of compliance. Clear next steps anchored in strengths to build trust and momentum.",
  },
  leaders: {
    title: "For Leaders",
    icon: <CheckCircle className="h-5 w-5" />,
    description:
      "Hours saved and relief from the constant pressure of ‘I should be doing more.’ Trellis structures notes and generates actionable, strength-based feedback in minutes.",
  },
  districts: {
    title: "For Districts",
    icon: <SchoolIcon className="h-5 w-5" />,
    description:
      "Consistency across schools, real-time visibility into instructional practices, and a culture shift—from PD-driven to feedback-fueled growth.",
  },
}

export default function StakeholderToggle() {
  const [selected, setSelected] = useState<StakeholderKey>("teachers")

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-lg border bg-background p-1 shadow-sm">
          {(["teachers", "leaders", "districts"] as StakeholderKey[]).map((key) => {
            const isActive = selected === key
            return (
              <Button
                key={key}
                variant={isActive ? "default" : "ghost"}
                className={
                  "px-4 py-2 text-lg font-medium rounded-md transition-colors " +
                  (isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")
                }
                aria-pressed={isActive}
                onClick={() => setSelected(key)}
              >
                <span className="mr-2" aria-hidden>
                  {stakeholderCopy[key].icon}
                </span>
                {stakeholderCopy[key].title.replace("For ", "")}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="mt-6 overflow-hidden">
        <div key={selected} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-center max-w-2xl mx-auto text-lg leading-relaxed text-muted-foreground">
            {stakeholderCopy[selected].description}
          </p>
        </div>
      </div>
    </div>
  )
}


