import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'

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
    const { rawNotes, teacher, observationType, focusAreas } = await request.json()

    // Validate required fields
    if (!rawNotes || !teacher || !observationType) {
      return NextResponse.json(
        { error: 'Missing required fields: rawNotes, teacher, observationType' },
        { status: 400 }
      )
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

 