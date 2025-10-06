export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { TeacherList } from '@/components/teachers/teacher-list'
import { getAuthContext } from '@/lib/auth/server'

export default async function TeachersPage() {
  const auth = await getAuthContext()
  // Guard: if auth missing (should be handled by middleware), render empty shell
  if (!auth?.schoolId) {
    return (
      <div className="space-y-6">
        <TeacherList />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <TeacherList />
    </div>
  )
}