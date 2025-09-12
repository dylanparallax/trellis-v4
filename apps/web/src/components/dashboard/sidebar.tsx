'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { signOut, getCurrentUser } from '@/lib/auth/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { 
  Settings2,
  Gauge,
  Apple,
  Binoculars,
  Award,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Gauge },
  { name: 'Teachers', href: '/dashboard/teachers', icon: Apple },
  { name: 'Observations', href: '/dashboard/observations', icon: Binoculars },
  { name: 'Feedback', href: '/dashboard/evaluations', icon: Award },
  // { name: 'Analytics', href: '/dashboard/analytics', icon: ChartSpline },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings2 },
]

// Custom hook to get current user
function useCurrentUser() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profileName, setProfileName] = useState<string | null>(null)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const { user, error } = await getCurrentUser()
        if (error) {
          console.error('Error fetching user:', error)
        } else {
          setUser(user)
          // optimistic photo from auth metadata (falls back to /api/me below)
          const meta = (user?.user_metadata as { photo_url?: string; avatar_url?: string; picture?: string } | undefined)
          const metaPhoto = meta?.photo_url || meta?.avatar_url || meta?.picture
          if (metaPhoto) setProfilePhotoUrl(metaPhoto)
        }
        // Fetch DB-backed name/role
        const res = await fetch('/api/me', { cache: 'no-store' })
        if (res.ok) {
          const data: { name?: string | null; photoUrl?: string | null } = await res.json()
          if (data?.name) setProfileName(data.name)
          if (data?.photoUrl) setProfilePhotoUrl(data.photoUrl)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
    const handleProfileUpdated = async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' })
        if (res.ok) {
          const data: { name?: string | null; photoUrl?: string | null } = await res.json()
          if (data?.name) setProfileName(data.name)
          if (data?.photoUrl) setProfilePhotoUrl(data.photoUrl)
        }
      } catch {}
    }
    window.addEventListener('profile-updated', handleProfileUpdated as EventListener)
    window.addEventListener('focus', handleProfileUpdated)
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdated as EventListener)
      window.removeEventListener('focus', handleProfileUpdated)
    }
  }, [])

  return { user, profileName, profilePhotoUrl, loading }
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { user, profileName, profilePhotoUrl, loading } = useCurrentUser()

  const handleLogout = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        console.error('Logout error:', error)
      } else {
        // Redirect to login page after successful logout
        router.push('/login')
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U'
    
    const { user_metadata } = user
    if (user_metadata?.full_name) {
      return user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    }
    if (user.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  // Get user display name
  const getUserDisplayName = () => {
    if (profileName) return profileName
    if (!user) return 'User'
    const { user_metadata } = user
    if (user_metadata?.full_name) return user_metadata.full_name
    if (user_metadata?.name) return user_metadata.name
    if (user_metadata?.firstName || user_metadata?.lastName) {
      return `${user_metadata.firstName ?? ''} ${user_metadata.lastName ?? ''}`.trim() || 'User'
    }
    if (user.email) return user.email.split('@')[0]
    return 'User'
  }

  // Get user role/subtitle
  const getUserRole = () => {
    if (!user) return 'Loading...'
    
    const { user_metadata } = user
    if (user_metadata?.role) {
      return user_metadata.role
    }
    return 'User'
  }

  return (
    <div className="hidden md:flex flex-col w-56 border-r bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center gap-3 p-4 border-b">
        <Image
          src="/trellis-light.svg"
          alt="Trellis AI Logo"
          width={32}
          height={32}
          className="h-8 w-auto"
        />
        
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      <div className="px-4 py-2 border-t sticky bottom-0 z-40">
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-2 h-auto hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {loading ? '...' : getUserInitials()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">
                    {loading ? 'Loading...' : getUserDisplayName()}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {getUserRole()}
                  </p>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Account Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
} 