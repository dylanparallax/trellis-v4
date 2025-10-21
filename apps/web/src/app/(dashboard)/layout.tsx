export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard/nav'
import { Sidebar } from '@/components/dashboard/sidebar'
import { getAuthContext } from '@/lib/auth/server'

interface DashboardLayoutProps {
  children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  try {
    const auth = await getAuthContext()
    
    // If no auth context, redirect to login
    if (!auth) {
      redirect('/login')
    }
    
    let schoolName: string | undefined
    const isDbConfigured = Boolean(process.env.DATABASE_URL)
    if (auth?.schoolId && isDbConfigured) {
      try {
        const { prisma } = await import('@trellis/database')
        const school = await prisma.school.findUnique({ where: { id: auth.schoolId }, select: { name: true } })
        schoolName = school?.name || undefined
      } catch (error) {
        console.warn('Failed to fetch school name from database:', error)
        schoolName = undefined
      }
    }
    // Fallback to auth metadata if DB name not available
    if (!schoolName && auth?.schoolName) {
      schoolName = auth.schoolName
    }
    // Final fallback: env default
    if (!schoolName && process.env.NEXT_PUBLIC_DEFAULT_SCHOOL_NAME) {
      schoolName = process.env.NEXT_PUBLIC_DEFAULT_SCHOOL_NAME
    }

    return (
      <div className="flex min-h-screen">
        <Sidebar initialRole={auth.role} />
        <div className="flex-1 flex flex-col">
          <DashboardNav schoolName={schoolName} role={auth.role} />
          <main className="flex-1 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto px-0 sm:px-2">
              {children}
            </div>
          </main>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Critical error in dashboard layout:', error)
    // If there's a critical error, redirect to login
    redirect('/login')
  }
} 