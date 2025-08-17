export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { prisma } from '@trellis/database'
import { getAuthContext } from '@/lib/auth/server'
import { getTeacherById } from '@/lib/data/mock-data'

// Add proper types
interface Teacher {
  name: string
  subject?: string
  gradeLevel?: string
  strengths?: string[]
  growthAreas?: string[]
}

function hasValidAPIKeys() {
  const hasAnthropicKey = !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_key_here')
  const hasOpenAIKey = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_key_here')
  return hasAnthropicKey || hasOpenAIKey
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rawNotes, teacher: teacherPayload, teacherId, observationType, focusAreas } = body

    // Validate required fields
    if (!rawNotes || !observationType || (!teacherPayload && !teacherId)) {
      return NextResponse.json(
        { error: 'Missing required fields: rawNotes, observationType, and either teacher or teacherId' },
        { status: 400 }
      )
    }

    // Resolve teacher
    let teacher: Teacher | null = null

    if (teacherPayload && typeof teacherPayload.name === 'string') {
      teacher = {
        name: teacherPayload.name,
        subject: teacherPayload.subject,
        gradeLevel: teacherPayload.gradeLevel,
        strengths: Array.isArray(teacherPayload.strengths) ? teacherPayload.strengths : [],
        growthAreas: Array.isArray(teacherPayload.growthAreas) ? teacherPayload.growthAreas : [],
      }
    } else if (teacherId) {
      const isDemo = process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
      if (isDemo) {
        const t = getTeacherById(String(teacherId))
        if (!t) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
        teacher = {
          name: t.name,
          subject: t.subject ?? undefined,
          gradeLevel: t.gradeLevel ?? undefined,
          strengths: t.strengths ?? [],
          growthAreas: t.growthAreas ?? [],
        }
      } else {
        const auth = await getAuthContext()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const t = await prisma.teacher.findUnique({ where: { id: String(teacherId) } })
        if (!t) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
        if (t.schoolId !== auth.schoolId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        teacher = {
          name: t.name,
          subject: t.subject ?? undefined,
          gradeLevel: t.gradeLevel ?? undefined,
          strengths: t.strengths ?? [],
          growthAreas: t.growthAreas ?? [],
        }
      }
    }

    if (!teacher) {
      return NextResponse.json({ error: 'Unable to resolve teacher' }, { status: 400 })
    }

    const isDemo = process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

    // Demo fallback when keys are not configured
    if (!hasValidAPIKeys() && isDemo) {
      const enhanced = `\n**Instructional Strengths Observed:**\n• Effective classroom management with clear expectations\n• Strong student engagement through interactive activities\n• Appropriate use of formative assessment strategies\n\n**Areas for Growth:**\n• Consider providing more differentiated instruction for diverse learners\n• Opportunity to incorporate more student-led discussions\n\n**Next Steps:**\n1. Implement small-group activities to support struggling students\n2. Add more open-ended questions to promote critical thinking\n3. Continue building on the strong classroom culture you've established\n\n**Connection to Previous Goals:**\nExcellent progress on the classroom management goal from last month's observation.\n      `
      return NextResponse.json({ enhancedNotes: enhanced })
    }

    const prompt = buildEnhancementPrompt(rawNotes, teacher, observationType, focusAreas || [])

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
  return `You are an expert educational evaluator enhancing classroom observation notes.

TEACHER INFORMATION:
- Name: ${teacher.name}
- Subject: ${teacher.subject || 'Not specified'}
- Grade Level: ${teacher.gradeLevel || 'Not specified'}
- Strengths: ${teacher.strengths ? teacher.strengths.join(', ') : 'Not specified'}
- Growth Areas: ${teacher.growthAreas ? teacher.growthAreas.join(', ') : 'Not specified'}

OBSERVATION CONTEXT:
- Type: ${observationType}
- Focus Areas: ${focusAreas.join(', ')}

RAW OBSERVATION NOTES:
${rawNotes}

INSTRUCTIONS:
Enhance these observation notes by:

1. **Identifying Instructional Strengths** - Highlight specific examples of effective teaching practices
2. **Noting Areas for Growth** - Provide constructive feedback with actionable suggestions
3. **Connecting to Teacher Goals** - Reference any relevant professional development goals
4. **Adding Specific Recommendations** - Suggest concrete next steps for improvement
5. **Maintaining Professional Tone** - Use educational terminology and constructive language

Format the response using Markdown with clear sections:
- **Instructional Strengths Observed**
- **Areas for Growth**
- **Next Steps**
- **Connection to Previous Goals** (if applicable)

Be specific, actionable, and evidence-based. Focus on the teacher's development and student learning outcomes.`
}

 