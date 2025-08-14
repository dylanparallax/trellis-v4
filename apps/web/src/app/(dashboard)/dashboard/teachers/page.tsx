import { TeacherList } from '@/components/teachers/teacher-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Apple, TrendingUp, Target } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@trellis/database'
import { getAuthContext } from '@/lib/auth/server'

export default async function TeachersPage() {
  const auth = await getAuthContext()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const [totalTeachers, observationsThisMonth, activeTeachers] = await Promise.all([
    auth?.schoolId ? prisma.teacher.count({ where: { schoolId: auth.schoolId } }) : Promise.resolve(0),
    auth?.schoolId
      ? prisma.observation.count({ where: { schoolId: auth.schoolId, date: { gte: monthStart, lt: monthEnd } } })
      : Promise.resolve(0),
    auth?.schoolId
      ? prisma.observation.findMany({
          where: { schoolId: auth.schoolId, date: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
          select: { teacherId: true },
          distinct: ['teacherId'],
        }).then((rows) => rows.length)
      : Promise.resolve(0),
  ])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Apple className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeachers}</div>
            <p className="text-xs text-muted-foreground">&nbsp;</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teachers (30d)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTeachers}</div>
            <p className="text-xs text-muted-foreground">Based on recent observations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div>
            <p className="text-xs text-muted-foreground">No aggregated score available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Observations (This Month)</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{observationsThisMonth}</div>
            <p className="text-xs text-muted-foreground">&nbsp;</p>
          </CardContent>
        </Card>
      </div>

      <TeacherList />
      <div className="flex justify-end">
        <Link href="/dashboard/teachers/new" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <Plus className="h-4 w-4" />
          Add Teacher
        </Link>
      </div>
    </div>
  )
}