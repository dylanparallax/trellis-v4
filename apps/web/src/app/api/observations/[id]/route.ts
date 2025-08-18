import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import { getAuthContext, assertSameSchool } from '@/lib/auth/server'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const observation = await prisma.observation.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true, subject: true, gradeLevel: true } },
        observer: { select: { id: true, name: true, email: true } },
        artifacts: true,
      },
    })

    if (!observation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    assertSameSchool(observation, auth.schoolId)

    return NextResponse.json(observation)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch observation' }, { status: 500 })
  }
}


