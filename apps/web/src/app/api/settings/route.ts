export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import { z } from 'zod'
import { getAuthContext } from '@/lib/auth/server'

const updateSchema = z.object({
  evaluationFrameworkText: z.string().optional(),
  promptGuidelines: z.string().optional(),
})

export async function GET() {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const school = await prisma.school.findUnique({ where: { id: auth.schoolId } })
    if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

    const settings = (school.settings as Record<string, unknown>) || {}
    const frameworkText = (school.evaluationFramework as { text?: string })?.text ?? ''
    const promptGuidelines = (settings?.prompts as { guidelines?: string })?.guidelines ?? ''

    return NextResponse.json({ evaluationFrameworkText: frameworkText, promptGuidelines })
  } catch (err) {
    console.error('GET /api/settings failed', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { evaluationFrameworkText, promptGuidelines } = updateSchema.parse(body)

    const school = await prisma.school.findUnique({ where: { id: auth.schoolId } })
    if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

    const nextSettings = { ...(school.settings as Record<string, unknown>) }
    if (promptGuidelines !== undefined) {
      nextSettings.prompts = { ...(nextSettings.prompts as Record<string, unknown> || {}), guidelines: promptGuidelines }
    }

    const data: Record<string, unknown> = { settings: nextSettings }
    if (evaluationFrameworkText !== undefined) {
      data.evaluationFramework = { text: evaluationFrameworkText }
    }

    await prisma.school.update({ where: { id: auth.schoolId }, data })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('PUT /api/settings failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


