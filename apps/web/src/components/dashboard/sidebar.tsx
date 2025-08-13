'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Settings2,
  Gauge,
  Apple,
  Binoculars,
  Award
} from 'lucide-react'
import Image from 'next/image'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Gauge },
  { name: 'Teachers', href: '/dashboard/teachers', icon: Apple },
  { name: 'Observations', href: '/dashboard/observations', icon: Binoculars },
  { name: 'Evaluations', href: '/dashboard/evaluations', icon: Award },
  // { name: 'Analytics', href: '/dashboard/analytics', icon: ChartSpline },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings2 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-48 border-r bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60">
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
      
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  )
} 