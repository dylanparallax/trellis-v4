import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Invites not configured (missing Supabase service role key or URL)' }, { status: 503 })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)

    // Send an invitation email via Supabase Admin API
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        teacherId: teacherId || null,
        invitedByUserId: auth.userId,
        schoolId: auth.schoolId,
        role: 'TEACHER',
      },
      redirectTo: undefined, // use default confirmation redirect
    })

    if (error) {
      // Handle idempotent cases gracefully
      const alreadyInvited = /already exists|already registered|User already registered/i.test(error.message)
      if (alreadyInvited) {
        return NextResponse.json({ ok: true, invited: false, message: 'User already invited or registered' })
      }
      return NextResponse.json({ error: 'Failed to send invite', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, invited: true, userId: data?.user?.id || null })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


