import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const schema = z.object({
  email: z.string().email(),
  teacherId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role === 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { email, teacherId } = schema.parse(body)

    const enableInvites = process.env.ENABLE_INVITES === 'true'
    if (!enableInvites) {
      return NextResponse.json({ ok: true, invited: false, message: 'Invites disabled; would invite', email, teacherId: teacherId || null })
    }

    // Intentionally do not send emails or create users in this environment.
    // Placeholder for future integration with Supabase Admin API.
    return NextResponse.json({ ok: true, invited: true, email, teacherId: teacherId || null })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


