export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import { getAuthContext } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    const where: Record<string, string> = {}
    if (teacherId) where.teacherId = teacherId
    where.schoolId = auth.schoolId

    const evaluations = await prisma.evaluation.findMany({
      where,
      include: {
        teacher: { select: { id: true, name: true, subject: true, gradeLevel: true } },
        evaluator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(evaluations)
  } catch (error) {
    console.error('Error fetching evaluations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch evaluations' },
      { status: 500 }
    )
  }
}


