import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import { z } from 'zod'
import { getAuthContext } from '@/lib/auth/server'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'

const schema = z.object({
  schoolName: z.string().min(2),
  district: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpFromHeaders(request.headers)
    const rl = checkRateLimit(ip, 'onboarding:POST', 10, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // If user already exists and has a school, skip
    const existingUser = await prisma.user.findUnique({ where: { email: auth.email } })
    if (existingUser?.schoolId && existingUser.schoolId !== '') {
      return NextResponse.json({ message: 'Already onboarded', schoolId: existingUser.schoolId })
    }

    const body = await request.json()
    const { schoolName, district } = schema.parse(body)

    const school = await prisma.school.create({
      data: {
        name: schoolName,
        district: district ?? null,
        evaluationFramework: {},
      },
    })

    // Create or update user with the new school
    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: auth.email,
          name: auth.name ?? auth.email.split('@')[0],
          role: 'ADMIN',
          schoolId: school.id,
        },
      })
    } else {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { schoolId: school.id, role: 'ADMIN' },
      })
    }

    return NextResponse.json({ schoolId: school.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


