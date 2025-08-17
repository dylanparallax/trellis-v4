export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth/server'
import { prisma } from '@trellis/database'

export async function GET() {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isDbConfigured = Boolean(process.env.DATABASE_URL)
    let name = auth.name
    let role = auth.role
    let schoolId = auth.schoolId
    let schoolName = auth.schoolName

    if (isDbConfigured) {
      try {
        const user = await prisma.user.findUnique({ where: { email: auth.email }, select: { name: true, role: true, schoolId: true } })
        if (user) {
          name = user.name
          role = user.role as typeof role
          schoolId = user.schoolId
        }
        if (schoolId) {
          const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } })
          schoolName = school?.name ?? schoolName
        }
      } catch {
        // ignore and use auth fallbacks
      }
    }

    return NextResponse.json({ name, role, email: auth.email, schoolId, schoolName })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


