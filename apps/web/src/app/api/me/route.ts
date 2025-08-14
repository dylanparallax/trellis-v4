import { NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import { getAuthContext } from '@/lib/auth/server'

export async function GET() {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const school = auth.schoolId
      ? await prisma.school.findUnique({ where: { id: auth.schoolId } })
      : null

    return NextResponse.json({
      user: {
        id: auth.userId,
        email: auth.email,
        name: auth.name,
        role: auth.role,
        schoolId: auth.schoolId,
      },
      school: school ? { id: school.id, name: school.name } : null,
    })
  } catch (error) {
    console.error('GET /api/me failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}