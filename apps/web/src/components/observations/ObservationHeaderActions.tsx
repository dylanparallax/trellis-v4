'use client'

import { Button } from '@/components/ui/button'
import { Edit3, Save as SaveIcon, Trash2 } from 'lucide-react'

export default function ObservationHeaderActions() {
  return (
    <div className="flex gap-1.5">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => window.dispatchEvent(new Event('observation-edit'))}
        aria-label="Edit"
        title="Edit"
      >
        <Edit3 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => window.dispatchEvent(new Event('observation-save'))}
        aria-label="Save"
        title="Save"
      >
        <SaveIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive"
        onClick={() => window.dispatchEvent(new Event('observation-delete'))}
        aria-label="Delete"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}


