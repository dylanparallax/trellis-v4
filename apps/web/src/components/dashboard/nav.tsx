'use client'

import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/auth/supabase'

type DashboardNavProps = {
  schoolName?: string
}

export function DashboardNav({ schoolName }: DashboardNavProps) {
  const [clientSchoolName, setClientSchoolName] = useState<string | undefined>(undefined)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const { user } = await getCurrentUser()
        const meta = (user?.user_metadata as { schoolName?: string } | undefined)
        if (isMounted && meta?.schoolName) setClientSchoolName(meta.schoolName)
      } catch {
        // ignore
      }
    })()
    return () => {
      isMounted = false
    }
  }, [])

  const displaySchoolName = schoolName || clientSchoolName || 'Your School'
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/\]\0">
      <div className="flex h-16 items-center px-4 gap-4">
        <div className="flex-1">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="hover:scale-[1.02] transition-transform"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{displaySchoolName}</span>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.15)]" />
          </div>
        </div>
      </div>
    </header>
  )
} 