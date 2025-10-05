'use client'

import { Bell, Search, Menu, X, Loader2, ExternalLink, Award, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/auth/supabase'
import Link from 'next/link'
import { navigation } from '@/components/dashboard/sidebar'

type DashboardNavProps = {
  schoolName?: string
  role?: 'ADMIN' | 'EVALUATOR' | 'DISTRICT_ADMIN' | 'TEACHER'
}

export function DashboardNav({ schoolName, role }: DashboardNavProps) {
  const [clientSchoolName, setClientSchoolName] = useState<string | undefined>(undefined)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<Array<{ id: string; type: 'observation' | 'evaluation' | 'teacher'; title: string; subtitle?: string; href: string }>>([])
  const [open, setOpen] = useState(false)
  const [notifCount, setNotifCount] = useState<number>(0)

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

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/notifications', { cache: 'no-store' })
        if (!isMounted) return
        if (res.ok) {
          const data = await res.json() as { count?: number }
          setNotifCount(typeof data.count === 'number' ? data.count : 0)
        } else {
          setNotifCount(0)
        }
      } catch {
        if (isMounted) setNotifCount(0)
      }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => {
      isMounted = false
      clearInterval(id)
    }
  }, [])

  const displaySchoolName = schoolName || clientSchoolName || 'Your School'
  const navItems = role === 'TEACHER'
    ? [
        { name: 'Feedback', href: '/teacher', icon: Award },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings2 },
      ]
    : navigation
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
              value={query}
              onChange={async (e) => {
                const q = e.target.value
                setQuery(q)
                if (q.trim().length < 2) {
                  setResults([])
                  setOpen(false)
                  return
                }
                setIsLoading(true)
                try {
                  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
                  if (res.ok) {
                    const data = await res.json() as { results: typeof results }
                    setResults(data.results)
                    setOpen(true)
                  } else {
                    setResults([])
                    setOpen(false)
                  }
                } finally {
                  setIsLoading(false)
                }
              }}
              onFocus={() => { if (results.length > 0) setOpen(true) }}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
            />
            {open && (
              <div className="absolute mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md overflow-hidden z-50">
                <div className="max-h-72 overflow-auto">
                  {isLoading ? (
                    <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</div>
                  ) : results.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">No results</div>
                  ) : (
                    results.map((r) => (
                      <Link key={`${r.type}:${r.id}`} href={r.href} className="block p-3 hover:bg-accent">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{r.title}</div>
                            {r.subtitle ? <div className="text-xs text-muted-foreground line-clamp-1">{r.subtitle}</div> : null}
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:scale-[1.02] transition-transform"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-1 rounded-full bg-rose-500/20 text-rose-500 text-[10px] leading-4 flex items-center justify-center">
                {notifCount > 99 ? '99+' : String(notifCount)}
              </span>
            )}
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
              {navItems.map((item) => (
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