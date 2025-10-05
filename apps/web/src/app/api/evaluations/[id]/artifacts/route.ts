export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import type { Prisma } from '@prisma/client'
import { getAuthContext, assertSameSchool } from '@/lib/auth/server'
import { z } from 'zod'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'
import { randomUUID } from 'crypto'
import { extractPathFromSignedUrl, isLikelyStoragePath } from '@/lib/storage'

const schema = z.object({
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  fileType: z.string().default('application/octet-stream'),
})

const updateSchema = z.object({
  artifactId: z.string().min(1),
  status: z.enum(['APPROVED', 'REJECTED'])
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIpFromHeaders(request.headers)
    const rl = checkRateLimit(ip, 'evaluations:ARTIFACT', 60, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const body = await request.json()
    const parsed = schema.parse(body)

    // Normalize fileUrl to a storage path if a signed URL was provided
    const normalizedFileUrl = (() => {
      const maybePath = extractPathFromSignedUrl(parsed.fileUrl)
      if (maybePath) return maybePath
      return parsed.fileUrl
    })()

    const evaluation = await prisma.evaluation.findUnique({ where: { id } })
    if (!evaluation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    assertSameSchool(evaluation, auth.schoolId)

    // Teachers can only attach to their own evaluation
    if (auth.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({ where: { email: auth.email, schoolId: auth.schoolId }, select: { id: true } })
      if (!teacher || teacher.id !== evaluation.teacherId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const artifact = {
      id: randomUUID(),
      fileName: parsed.fileName,
      fileUrl: normalizedFileUrl,
      fileType: parsed.fileType,
      status: auth.role === 'TEACHER' ? 'PENDING' : 'APPROVED',
      uploadedBy: auth.role === 'TEACHER' ? 'TEACHER' : 'STAFF',
      uploadedByEmail: auth.email,
      uploadedAt: new Date().toISOString(),
    }

    let nextContent: Prisma.InputJsonValue = { markdown: '', meta: { artifacts: [artifact] } } as unknown as Prisma.InputJsonValue
    try {
      if (typeof evaluation.content === 'string') {
        nextContent = { markdown: evaluation.content, meta: { artifacts: [artifact] } } as unknown as Prisma.InputJsonValue
      } else if (evaluation.content && typeof evaluation.content === 'object' && !Array.isArray(evaluation.content)) {
        const obj = evaluation.content as unknown as Record<string, unknown>
        const prevMeta = (obj.meta as Record<string, unknown> | undefined) || {}
        const prevList = (prevMeta.artifacts as unknown[]) || []
        nextContent = { ...obj, meta: { ...prevMeta, artifacts: [...prevList, artifact] } } as unknown as Prisma.InputJsonValue
      } else {
        nextContent = { markdown: '', meta: { artifacts: [artifact] } } as unknown as Prisma.InputJsonValue
      }
    } catch {
      nextContent = { markdown: '', meta: { artifacts: [artifact] } } as unknown as Prisma.InputJsonValue
    }

    const updated = await prisma.evaluation.update({ where: { id }, data: { content: nextContent as Prisma.InputJsonValue } })
    return NextResponse.json({ ok: true, artifact, evaluationId: updated.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const evaluation = await prisma.evaluation.findUnique({ where: { id } })
    if (!evaluation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    assertSameSchool(evaluation, auth.schoolId)

    let artifacts: unknown[] = []
    const c = evaluation.content
    if (c && typeof c === 'object' && !Array.isArray(c)) {
      const obj = c as Record<string, unknown>
      const meta = obj.meta as Record<string, unknown> | undefined
      const list = (meta?.artifacts as unknown[]) || []
      artifacts = list
    }
    return NextResponse.json({ artifacts })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIpFromHeaders(request.headers)
    const rl = checkRateLimit(ip, 'evaluations:ARTIFACT:PATCH', 60, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role === 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.parse(body)

    const evaluation = await prisma.evaluation.findUnique({ where: { id } })
    if (!evaluation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    assertSameSchool(evaluation, auth.schoolId)

    let nextContent: unknown = evaluation.content
    let found = false
    if (evaluation.content && typeof evaluation.content === 'object' && !Array.isArray(evaluation.content)) {
      const obj = evaluation.content as Record<string, unknown>
      const meta = (obj.meta as Record<string, unknown> | undefined) || {}
      const list = ((meta.artifacts as unknown[]) || []).map((a) => {
        const art = a as Record<string, unknown>
        if (String(art.id) === parsed.artifactId) {
          found = true
          return { ...art, status: parsed.status, reviewedByEmail: auth.email, reviewedAt: new Date().toISOString() }
        }
        return art
      })
      if (!found) return NextResponse.json({ error: 'Artifact not found' }, { status: 404 })
      nextContent = { ...obj, meta: { ...meta, artifacts: list } }
    } else {
      return NextResponse.json({ error: 'No artifacts to update' }, { status: 400 })
    }

    await prisma.evaluation.update({ where: { id }, data: { content: nextContent } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


