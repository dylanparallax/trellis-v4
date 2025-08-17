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
  const school = auth?.schoolId
    ? await prisma.school.findUnique({ where: { id: auth.schoolId }, select: { name: true } })
    : null

  const schoolName = school?.name || undefined

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