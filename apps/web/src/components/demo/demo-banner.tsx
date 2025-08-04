'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Play } from 'lucide-react'

export function DemoBanner() {
  const [showTour, setShowTour] = useState(false)
  
  return (
    <>
      <div className="bg-gradient-to-r from-brand-blue to-brand-orange text-white p-3">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <p className="text-sm font-medium">
              🎓 You&apos;re viewing a demo with sample data
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowTour(true)}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <Play className="mr-2 h-3 w-3" />
            Take a Tour
          </Button>
        </div>
      </div>
      
      {showTour && <InteractiveTour onClose={() => setShowTour(false)} />}
    </>
  )
}

function InteractiveTour({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Welcome to Trellis AI!</h3>
        <div className="space-y-3 text-sm">
          <p>This is a demo of our AI-powered teacher evaluation system. Here&apos;s what you can explore:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>View sample teacher profiles and data</li>
            <li>Try the AI observation enhancement feature</li>
            <li>Explore the analytics dashboard</li>
            <li>See how evaluations are generated</li>
          </ul>
        </div>
        <div className="flex gap-2 mt-6">
          <Button onClick={onClose} className="flex-1">
            Get Started
          </Button>
        </div>
      </div>
    </div>
  )
} 