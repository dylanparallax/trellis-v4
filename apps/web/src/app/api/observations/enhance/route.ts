import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { prisma } from '@trellis/database'

// Add proper types
interface Teacher {
  name: string
  subject?: string
  gradeLevel?: string
  strengths?: string[]
  growthAreas?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawNotes: string | undefined = body?.rawNotes
    const observationType: string | undefined = body?.observationType
    const focusAreas: string[] = Array.isArray(body?.focusAreas) ? body.focusAreas : []
    const teacherId: string | undefined = body?.teacherId
    const teacherInput: Teacher | undefined = body?.teacher

    if (!rawNotes || !observationType) {
      return NextResponse.json({ error: 'Missing required fields: rawNotes, observationType' }, { status: 400 })
    }

    // Resolve teacher from input or DB (using teacherId)
    let teacher: Teacher | null = null
    if (teacherInput && typeof teacherInput?.name === 'string') {
      teacher = {
        name: teacherInput.name,
        subject: teacherInput.subject,
        gradeLevel: teacherInput.gradeLevel,
        strengths: teacherInput.strengths,
        growthAreas: teacherInput.growthAreas,
      }
    } else if (teacherId) {
      const t = await prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { name: true, subject: true, gradeLevel: true, strengths: true, growthAreas: true },
      })
      if (t) {
        teacher = {
          name: t.name,
          subject: t.subject || undefined,
          gradeLevel: t.gradeLevel || undefined,
          strengths: t.strengths || [],
          growthAreas: t.growthAreas || [],
        }
      }
    }

    // Fallback minimal teacher if not resolvable
    if (!teacher) {
      teacher = { name: 'Teacher' }
    }

    const prompt = buildEnhancementPrompt(rawNotes, teacher, observationType, focusAreas)

    try {
      const { text } = await generateText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        prompt,
        temperature: 0.7,
      })
      
      console.log('Claude enhancement successful!')
      return NextResponse.json({ enhancedNotes: text })
    } catch (error) {
      console.error('Claude enhancement failed, falling back to GPT:', error)
      
      try {
        const { text } = await generateText({
          model: openai('gpt-4-turbo'),
          prompt,
          temperature: 0.7,
        })
        
        console.log('GPT enhancement fallback successful!')
        return NextResponse.json({ enhancedNotes: text })
      } catch (gptError) {
        console.error('Both AI models failed for enhancement:', gptError)
        return NextResponse.json({ error: 'AI enhancement failed' }, { status: 502 })
      }
    }
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function buildEnhancementPrompt(
  rawNotes: string,
  teacher: Teacher,
  observationType: string,
  focusAreas: string[]
): string {
  const focus = focusAreas.length ? focusAreas.join(', ') : 'Not specified'
  return `SYSTEM
You are an instructional coach enhancing classroom observation notes.
Constraints:
- Use objective, evidence-based language; avoid judgmental phrasing.
- Do not invent facts; only use information provided in the notes and context.
- Write in Markdown with short paragraphs and bulleted lists.

Context
- Teacher: ${teacher.name}
- Subject: ${teacher.subject || 'Not specified'}
- Grade: ${teacher.gradeLevel || 'Not specified'}
- Teacher strengths (from profile): ${Array.isArray(teacher.strengths) && teacher.strengths.length ? teacher.strengths.join(', ') : 'Not specified'}
- Teacher growth areas (from profile): ${Array.isArray(teacher.growthAreas) && teacher.growthAreas.length ? teacher.growthAreas.join(', ') : 'Not specified'}
- Observation type: ${observationType}
- Focus areas selected: ${focus}

Raw Notes
"""
${rawNotes}
"""

Task
Rewrite and enhance the notes. Interpret bullet points and sketched ideas into complete sentences and ground each point in observable evidence from the raw notes where possible.

Tone
- Professional, supportive, and specific. Prefer verbs like “clarify,” “model,” “check for,” “scaffold.”
  `
}

 