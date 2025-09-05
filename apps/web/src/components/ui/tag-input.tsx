'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

type TagInputProps = {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  name?: string
  disabled?: boolean
  maxTags?: number
}

export function TagInput({ value, onChange, placeholder, name, disabled, maxTags }: TagInputProps) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  const addTag = (raw: string) => {
    const cleaned = raw.trim().replace(/\s+/g, ' ')
    if (!cleaned) return
    if (maxTags && value.length >= maxTags) return
    if (value.some(t => t.toLowerCase() === cleaned.toLowerCase())) return
    onChange([...value, cleaned])
    setDraft('')
  }

  const removeTag = (idx: number) => {
    const next = value.slice(0, idx).concat(value.slice(idx + 1))
    onChange(next)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && draft === '' && value.length) {
      e.preventDefault()
      removeTag(value.length - 1)
    }
  }

  return (
    <div className="min-h-10 w-full rounded-md border bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring">
      <div className="flex flex-wrap gap-1">
        {value.map((tag, idx) => (
          <Badge
            key={`${tag}-${idx}`}
            className="border bg-slate-100 text-slate-800 hover:bg-slate-100"
          >
            <span className="mr-2">{tag}</span>
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => removeTag(idx)}
              className="rounded-full px-1 text-xs text-slate-600 hover:text-slate-900"
              disabled={disabled}
            >
              ×
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          name={name}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => addTag(draft)}
          disabled={disabled}
          placeholder={placeholder}
          className="h-6 border-none p-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/80 flex-1 min-w-[8ch]"
        />
      </div>
    </div>
  )
}


