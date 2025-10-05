export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/auth/server'
import { DashboardNav } from '@/components/dashboard/nav'
import { Sidebar } from '@/components/dashboard/sidebar'

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const auth = await getAuthContext()
  if (!auth) redirect('/login')
  if (auth.role !== 'TEACHER') redirect('/dashboard')
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <DashboardNav schoolName={auth.schoolName} />
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-5xl mx-auto px-0 sm:px-2">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}


