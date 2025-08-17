export const runtime = 'nodejs'
import { ReactNode } from 'react'
import { DashboardNav } from '@/components/dashboard/nav'
import { Sidebar } from '@/components/dashboard/sidebar'
import { prisma } from '@trellis/database'
import { getAuthContext } from '@/lib/auth/server'

interface DashboardLayoutProps {
  children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const auth = await getAuthContext()
  const isDbConfigured = Boolean(process.env.DATABASE_URL)
  let schoolName: string | undefined
  if (auth?.schoolId && isDbConfigured) {
    try {
      const school = await prisma.school.findUnique({ where: { id: auth.schoolId }, select: { name: true } })
      schoolName = school?.name || undefined
    } catch {
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
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <DashboardNav schoolName={schoolName} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 