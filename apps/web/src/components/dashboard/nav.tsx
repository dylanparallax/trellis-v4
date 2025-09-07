'use client'

import { Bell, Search, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/auth/supabase'
import Link from 'next/link'
import { navigation } from '@/components/dashboard/sidebar'

type DashboardNavProps = {
  schoolName?: string
}

export function DashboardNav({ schoolName }: DashboardNavProps) {
  const [clientSchoolName, setClientSchoolName] = useState<string | undefined>(undefined)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const { user } = await getCurrentUser()
        const meta = (user?.user_metadata as { schoolName?: string } | undefined)
        if (isMounted && meta?.schoolName) setClientSchoolName(meta.schoolName)
        // Prefer DB-backed value via API if available
        const res = await fetch('/api/me', { cache: 'no-store' })
        if (isMounted && res.ok) {
          const data: { schoolName?: string } = await res.json()
          if (data?.schoolName) setClientSchoolName(data.schoolName)
        }
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
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-16 items-center px-3 sm:px-4 gap-3 sm:gap-4">
        <div className="md:hidden">
          <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
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
            <span className="hidden sm:inline text-sm text-muted-foreground">{displaySchoolName}</span>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.15)]" />
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/70 backdrop-blur-sm">
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80%] bg-card border-r p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Menu</span>
              <Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-2">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-accent" onClick={() => setIsMobileMenuOpen(false)}>
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
} 