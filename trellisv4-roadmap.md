# Trellis AI: Comprehensive Project Roadmap for MVP & Scale

## Project Overview

Build a demo-ready MVP that impresses school districts while maintaining a scalable architecture for future growth. The system should handle individual schools for demos but be architected to support multi-district deployments.

## Tech Stack Decision

### Core Framework
- **Next.js 14** (App Router) - Full-stack React framework
- **TypeScript** - Type safety throughout
- **Tailwind CSS** - Utility-first styling
- **Shadcn/UI** - High-quality components

### Database & Backend
- **Supabase** - PostgreSQL with auth, real-time, and RLS
- **Prisma** - Type-safe ORM with migrations
- **Redis** (Upstash) - Caching and job queues
- **BullMQ** - Background job processing

### AI & Processing
- **Vercel AI SDK** - Unified AI interface
- **Google Cloud Vision API** - OCR processing
- **Anthropic Claude API** - Primary AI
- **OpenAI API** - Fallback AI

### Infrastructure
- **Vercel** - Hosting and edge functions
- **Uploadthing** or **AWS S3** - File storage
- **Sentry** - Error tracking
- **PostHog** - Analytics

## Project Structure

```
trellis-ai/
├── apps/
│   ├── web/                    # Next.js main application
│   │   ├── app/
│   │   │   ├── (auth)/        # Auth pages (login, signup)
│   │   │   ├── (dashboard)/   # Protected dashboard routes
│   │   │   │   ├── teachers/
│   │   │   │   ├── observations/
│   │   │   │   ├── evaluations/
│   │   │   │   ├── analytics/
│   │   │   │   └── settings/
│   │   │   ├── api/           # API routes
│   │   │   │   ├── ai/
│   │   │   │   ├── observations/
│   │   │   │   ├── upload/
│   │   │   │   └── webhooks/
│   │   │   └── (marketing)/   # Public pages
│   │   ├── components/
│   │   │   ├── ui/            # Shadcn components
│   │   │   ├── observations/  # Feature components
│   │   │   ├── teachers/
│   │   │   └── analytics/
│   │   ├── lib/               # Utilities
│   │   │   ├── ai/            # AI service abstractions
│   │   │   ├── db/            # Database utilities
│   │   │   ├── auth/          # Auth helpers
│   │   │   └── utils/
│   │   └── hooks/             # Custom React hooks
│   └── worker/                # Background job processor
├── packages/
│   ├── database/              # Shared Prisma schema
│   ├── ai-prompts/           # Centralized AI prompts
│   └── types/                # Shared TypeScript types
└── infrastructure/           # Deployment configs
```

## Database Schema (Prisma)

```prisma
// packages/database/prisma/schema.prisma

model School {
  id                String   @id @default(cuid())
  name              String
  district          String?
  settings          Json     @default("{}")
  evaluationFramework Json   // School's rubric/framework
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  users             User[]
  teachers          Teacher[]
  observations      Observation[]
  evaluations       Evaluation[]
}

model User {
  id                String   @id @default(cuid())
  email             String   @unique
  name              String
  role              Role     @default(EVALUATOR)
  schoolId          String
  school            School   @relation(fields: [schoolId], references: [id])
  
  observations      Observation[]
  evaluations       Evaluation[]
  createdAt         DateTime @default(now())
}

enum Role {
  ADMIN
  EVALUATOR
  DISTRICT_ADMIN
}

model Teacher {
  id                String   @id @default(cuid())
  name              String
  email             String?
  subject           String?
  gradeLevel        String?
  schoolId          String
  school            School   @relation(fields: [schoolId], references: [id])
  
  // Performance tracking
  performanceHistory Json    @default("[]")
  currentGoals      Json     @default("[]")
  strengths         String[]
  growthAreas       String[]
  
  observations      Observation[]
  evaluations       Evaluation[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Observation {
  id                String   @id @default(cuid())
  teacherId         String
  teacher           Teacher  @relation(fields: [teacherId], references: [id])
  observerId        String
  observer          User     @relation(fields: [observerId], references: [id])
  schoolId          String
  school            School   @relation(fields: [schoolId], references: [id])
  
  // Raw observation data
  rawNotes          String   @db.Text
  enhancedNotes     String?  @db.Text
  
  // Structured data
  date              DateTime
  duration          Int?     // minutes
  observationType   ObservationType
  focusAreas        String[]
  
  artifacts         ObservationArtifact[]
  createdAt         DateTime @default(now())
  
  @@index([teacherId])
  @@index([schoolId, createdAt])
}

enum ObservationType {
  FORMAL
  INFORMAL
  WALKTHROUGH
}

model ObservationArtifact {
  id                String   @id @default(cuid())
  observationId     String
  observation       Observation @relation(fields: [observationId], references: [id])
  
  fileName          String
  fileUrl           String
  fileType          String
  ocrText           String?  @db.Text
  processedData     Json?
  
  createdAt         DateTime @default(now())
}

model Evaluation {
  id                String   @id @default(cuid())
  teacherId         String
  teacher           Teacher  @relation(fields: [teacherId], references: [id])
  evaluatorId       String
  evaluator         User     @relation(fields: [evaluatorId], references: [id])
  schoolId          String
  school            School   @relation(fields: [schoolId], references: [id])
  
  type              EvaluationType
  status            EvaluationStatus @default(DRAFT)
  
  // Content
  content           Json     // Structured evaluation data
  summary           String?  @db.Text
  recommendations   String[] 
  nextSteps         String[]
  
  // Metrics (based on school framework)
  scores            Json
  
  submittedAt       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([teacherId])
  @@index([schoolId, createdAt])
}

enum EvaluationType {
  FORMATIVE
  SUMMATIVE
  MID_YEAR
  END_YEAR
}

enum EvaluationStatus {
  DRAFT
  SUBMITTED
  ACKNOWLEDGED
}
```

## Phase 1: Foundation (Week 1-2)

### 1.1 Project Setup
```bash
# Create monorepo structure
npx create-turbo@latest trellis-ai
cd trellis-ai

# Setup Next.js app
npx create-next-app@latest apps/web --typescript --tailwind --app

# Install core dependencies
npm install @supabase/supabase-js @prisma/client prisma
npm install @radix-ui/themes class-variance-authority
npm install ai openai @anthropic-ai/sdk
npm install bull bullmq ioredis
npm install zod react-hook-form @hookform/resolvers
npm install date-fns recharts
```

### 1.2 Database Setup
```typescript
// packages/database/index.ts
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

// Add Prisma middleware for audit logging
prisma.$use(async (params, next) => {
  const result = await next(params)
  // Log all data modifications for compliance
  return result
})
```

### 1.3 Authentication Setup
```typescript
// apps/web/lib/auth/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Middleware for protected routes
// apps/web/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req: Request) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  return res
}
```

## Phase 2: Core Features (Week 3-4)

### 2.1 Teacher Management
```typescript
// apps/web/app/api/teachers/route.ts
import { prisma } from '@trellis/database'
import { z } from 'zod'

const teacherSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  subject: z.string().optional(),
  gradeLevel: z.string().optional(),
})

export async function POST(req: Request) {
  const body = await req.json()
  const validated = teacherSchema.parse(body)
  
  const teacher = await prisma.teacher.create({
    data: {
      ...validated,
      schoolId: req.headers.get('x-school-id')!,
    }
  })
  
  return Response.json(teacher)
}

// React component
// apps/web/components/teachers/teacher-list.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/data-table'

export function TeacherList() {
  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => fetch('/api/teachers').then(r => r.json())
  })
  
  return (
    <DataTable
      columns={teacherColumns}
      data={teachers}
      searchKey="name"
    />
  )
}
```

### 2.2 Observation System
```typescript
// apps/web/components/observations/observation-form.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAIEnhancement } from '@/hooks/use-ai-enhancement'

export function ObservationForm({ teacherId }: { teacherId: string }) {
  const [notes, setNotes] = useState('')
  const [artifacts, setArtifacts] = useState<File[]>([])
  const { enhance, isEnhancing } = useAIEnhancement()
  
  const handleSubmit = async () => {
    // 1. Upload artifacts if any
    const artifactUrls = await uploadArtifacts(artifacts)
    
    // 2. Create observation
    const observation = await fetch('/api/observations', {
      method: 'POST',
      body: JSON.stringify({
        teacherId,
        rawNotes: notes,
        artifacts: artifactUrls
      })
    })
    
    // 3. Queue AI enhancement job
    await enhance(observation.id)
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Type your observation notes..."
        className="min-h-[200px]"
      />
      
      <FileUpload
        files={artifacts}
        onChange={setArtifacts}
        accept="image/*,application/pdf"
      />
      
      <Button type="submit" disabled={isEnhancing}>
        Save Observation
      </Button>
    </form>
  )
}
```

### 2.3 AI Enhancement Service
```typescript
// apps/web/lib/ai/enhancement-service.ts
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

export class AIEnhancementService {
  async enhanceObservation(
    rawNotes: string,
    teacher: Teacher,
    previousObservations: Observation[]
  ) {
    const prompt = this.buildEnhancementPrompt(
      rawNotes,
      teacher,
      previousObservations
    )
    
    try {
      // Try Claude first
      const { text } = await generateText({
        model: anthropic('claude-3-sonnet'),
        prompt,
        temperature: 0.7,
      })
      
      return text
    } catch (error) {
      // Fallback to GPT
      const { text } = await generateText({
        model: openai('gpt-4-turbo'),
        prompt,
      })
      
      return text
    }
  }
  
  private buildEnhancementPrompt(
    notes: string,
    teacher: Teacher,
    history: Observation[]
  ) {
    return `
      You are an expert instructional coach enhancing observation notes.
      
      Teacher Profile:
      - Name: ${teacher.name}
      - Subject: ${teacher.subject}
      - Current Goals: ${JSON.stringify(teacher.currentGoals)}
      - Previous Strengths: ${teacher.strengths.join(', ')}
      
      Recent Observation History:
      ${history.map(obs => `- ${obs.date}: ${obs.enhancedNotes}`).join('\n')}
      
      Today's Raw Notes:
      ${notes}
      
      Please enhance these notes by:
      1. Organizing them into clear observations
      2. Connecting to the teacher's goals and previous observations
      3. Identifying specific strengths demonstrated
      4. Suggesting 2-3 concrete next steps
      5. Maintaining a supportive, growth-oriented tone
    `
  }
}
```

### 2.4 Background Job Processing
```typescript
// apps/worker/src/queues/ai-enhancement.queue.ts
import { Queue, Worker } from 'bullmq'
import { prisma } from '@trellis/database'
import { AIEnhancementService } from './services/ai-enhancement'

// Queue setup
export const enhancementQueue = new Queue('ai-enhancement', {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  }
})

// Worker setup
const worker = new Worker(
  'ai-enhancement',
  async (job) => {
    const { observationId } = job.data
    
    // Get observation data
    const observation = await prisma.observation.findUnique({
      where: { id: observationId },
      include: {
        teacher: true,
        artifacts: true
      }
    })
    
    // Get teacher's observation history
    const history = await prisma.observation.findMany({
      where: {
        teacherId: observation.teacher.id,
        id: { not: observationId }
      },
      orderBy: { date: 'desc' },
      take: 5
    })
    
    // Process any artifacts with OCR
    if (observation.artifacts.length > 0) {
      await processArtifacts(observation.artifacts)
    }
    
    // Enhance the observation
    const enhancedNotes = await aiService.enhanceObservation(
      observation.rawNotes,
      observation.teacher,
      history
    )
    
    // Update the observation
    await prisma.observation.update({
      where: { id: observationId },
      data: { enhancedNotes }
    })
    
    // Update teacher profile with insights
    await updateTeacherProfile(observation.teacher.id, enhancedNotes)
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    }
  }
)
```

## Phase 3: Evaluation System (Week 5-6)

### 3.1 Evaluation Generation
```typescript
// apps/web/app/api/evaluations/generate/route.ts
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export async function POST(req: Request) {
  const { teacherId, evaluationType } = await req.json()
  
  // Gather all data for evaluation
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      observations: {
        orderBy: { date: 'desc' },
        take: 20
      },
      evaluations: {
        orderBy: { createdAt: 'desc' },
        take: 3
      }
    }
  })
  
  const school = await prisma.school.findUnique({
    where: { id: teacher.schoolId }
  })
  
  // Build comprehensive prompt
  const prompt = buildEvaluationPrompt(
    teacher,
    evaluationType,
    school.evaluationFramework
  )
  
  // Stream the response
  const result = await streamText({
    model: anthropic('claude-3-opus'),
    prompt,
    temperature: 0.3, // Lower temp for more consistent evaluations
  })
  
  return new Response(result.textStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
```

### 3.2 Evaluation UI
```typescript
// apps/web/components/evaluations/evaluation-editor.tsx
'use client'

import { useCompletion } from 'ai/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import MDEditor from '@uiw/react-md-editor'

export function EvaluationEditor({ teacherId }: { teacherId: string }) {
  const {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading
  } = useCompletion({
    api: '/api/evaluations/generate',
    body: {
      teacherId,
      evaluationType: 'FORMATIVE'
    }
  })
  
  const [editedContent, setEditedContent] = useState(completion)
  
  useEffect(() => {
    setEditedContent(completion)
  }, [completion])
  
  const saveEvaluation = async () => {
    await fetch('/api/evaluations', {
      method: 'POST',
      body: JSON.stringify({
        teacherId,
        content: editedContent,
        type: 'FORMATIVE'
      })
    })
  }
  
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3>AI Assistant</h3>
        <form onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask for specific changes..."
          />
          <Button type="submit" disabled={isLoading}>
            Update Evaluation
          </Button>
        </form>
      </Card>
      
      <MDEditor
        value={editedContent}
        onChange={setEditedContent}
        height={500}
      />
      
      <Button onClick={saveEvaluation}>
        Save Evaluation
      </Button>
    </div>
  )
}
```

## Phase 4: Analytics & District Intelligence (Week 7-8)

### 4.1 Analytics Dashboard
```typescript
// apps/web/components/analytics/district-dashboard.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, LineChart } from '@/components/ui/charts'
import { useDistrictAnalytics } from '@/hooks/use-district-analytics'

export function DistrictDashboard() {
  const { data, isLoading } = useDistrictAnalytics()
  
  if (isLoading) return <DashboardSkeleton />
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Total Observations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalObservations}</div>
          <p className="text-xs text-muted-foreground">
            +{data.observationGrowth}% from last month
          </p>
        </CardContent>
      </Card>
      
      {/* Trends Chart */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Instructional Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            data={data.trendsOverTime}
            categories={['Engagement', 'Differentiation', 'Assessment']}
          />
        </CardContent>
      </Card>
      
      {/* Heat Map */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>School Performance Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceHeatMap data={data.schoolPerformance} />
        </CardContent>
      </Card>
    </div>
  )
}
```

### 4.2 Analytics API
```typescript
// apps/web/app/api/analytics/district/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const districtId = searchParams.get('districtId')
  const timeframe = searchParams.get('timeframe') || '30d'
  
  // Use database views for performance
  const analytics = await prisma.$queryRaw`
    SELECT 
      COUNT(DISTINCT o.id) as total_observations,
      COUNT(DISTINCT o.teacher_id) as teachers_observed,
      AVG(
        CASE 
          WHEN o.enhanced_notes LIKE '%exemplary%' THEN 4
          WHEN o.enhanced_notes LIKE '%proficient%' THEN 3
          WHEN o.enhanced_notes LIKE '%developing%' THEN 2
          ELSE 1
        END
      ) as avg_performance,
      ARRAY_AGG(
        DISTINCT jsonb_extract_path_text(o.focus_areas)
      ) as common_focus_areas
    FROM observations o
    JOIN schools s ON o.school_id = s.id
    WHERE s.district = ${districtId}
    AND o.created_at >= NOW() - INTERVAL ${timeframe}
  `
  
  // AI-powered insights
  const insights = await generateDistrictInsights(analytics)
  
  return Response.json({
    ...analytics,
    insights,
    recommendations: insights.recommendations
  })
}
```

## Phase 5: Demo & MVP Polish (Week 9-10)

### 5.1 Demo Data Seeder
```typescript
// scripts/seed-demo-data.ts
import { faker } from '@faker-js/faker'
import { prisma } from '@trellis/database'

async function seedDemoData() {
  // Create demo school
  const school = await prisma.school.create({
    data: {
      name: 'Lincoln Elementary School',
      district: 'Riverside Unified',
      evaluationFramework: {
        domains: [
          'Planning and Preparation',
          'Classroom Environment',
          'Instruction',
          'Professional Responsibilities'
        ],
        rubric: danielsonFramework // Import from a constant
      }
    }
  })
  
  // Create demo users
  const admin = await prisma.user.create({
    data: {
      email: 'demo@trellis.ai',
      name: 'Sarah Johnson',
      role: 'ADMIN',
      schoolId: school.id
    }
  })
  
  // Create 25 teachers with realistic data
  const teachers = await Promise.all(
    Array.from({ length: 25 }, async () => {
      return prisma.teacher.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          subject: faker.helpers.arrayElement([
            'Mathematics',
            'English Language Arts',
            'Science',
            'Social Studies',
            'Special Education'
          ]),
          gradeLevel: faker.helpers.arrayElement(['K', '1', '2', '3', '4', '5']),
          schoolId: school.id,
          strengths: faker.helpers.arrayElements([
            'Classroom management',
            'Student engagement',
            'Differentiated instruction',
            'Technology integration',
            'Parent communication'
          ], 2),
          currentGoals: [
            {
              goal: 'Implement project-based learning',
              progress: faker.number.int({ min: 20, max: 80 })
            }
          ]
        }
      })
    })
  )
  
  // Generate observations with realistic patterns
  for (const teacher of teachers) {
    const observationCount = faker.number.int({ min: 3, max: 8 })
    
    for (let i = 0; i < observationCount; i++) {
      await prisma.observation.create({
        data: {
          teacherId: teacher.id,
          observerId: admin.id,
          schoolId: school.id,
          date: faker.date.recent({ days: 90 }),
          duration: faker.number.int({ min: 15, max: 45 }),
          observationType: faker.helpers.arrayElement(['FORMAL', 'INFORMAL', 'WALKTHROUGH']),
          rawNotes: generateRealisticObservationNotes(teacher),
          enhancedNotes: generateEnhancedObservationNotes(teacher),
          focusAreas: faker.helpers.arrayElements([
            'Student Engagement',
            'Differentiation',
            'Assessment Strategies',
            'Classroom Management',
            'Higher-Order Thinking'
          ], 2)
        }
      })
    }
  }
}
```

### 5.2 Demo Mode Features
```typescript
// apps/web/components/demo/demo-banner.tsx
export function DemoBanner() {
  const [showTour, setShowTour] = useState(false)
  
  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2">
        <div className="container flex items-center justify-between">
          <p className="text-sm">
            🎓 You're viewing a demo with sample data
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowTour(true)}
          >
            Take a Tour
          </Button>
        </div>
      </div>
      
      {showTour && <InteractiveTour />}
    </>
  )
}

// Interactive tour component
import { driver } from 'driver.js'

export function InteractiveTour() {
  useEffect(() => {
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '#teacher-list',
          popover: {
            title: 'Teacher Dashboard',
            description: 'View all teachers and their performance metrics'
          }
        },
        {
          element: '#quick-observation',
          popover: {
            title: 'Quick Observation',
            description: 'Start an observation with just one click'
          }
        },
        {
          element: '#ai-enhance',
          popover: {
            title: 'AI Enhancement',
            description: 'Watch how AI transforms rough notes into professional feedback'
          }
        }
      ]
    })
    
    driverObj.drive()
  }, [])
  
  return null
}
```

## Phase 6: Production Readiness

### 6.1 Environment Configuration
```typescript
// apps/web/.env.example
# App
NEXT_PUBLIC_APP_URL=https://app.trellis.ai
NEXT_PUBLIC_DEMO_MODE=false

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# AI Services
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Google Cloud (for OCR)
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_KEY_FILE=

# Redis
REDIS_URL=

# File Storage
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=

# Analytics
POSTHOG_API_KEY=
SENTRY_DSN=
```

### 6.2 Security & Compliance
```typescript
// apps/web/lib/security/rls-policies.sql
-- Row Level Security Policies

-- Teachers: Users can only see teachers in their school
CREATE POLICY "Users can view teachers in their school" ON teachers
  FOR SELECT USING (school_id = auth.jwt() ->> 'school_id');

-- Observations: Users can only see observations they created or for their school
CREATE POLICY "Users can view observations" ON observations
  FOR SELECT USING (
    observer_id = auth.uid() OR
    school_id = auth.jwt() ->> 'school_id'
  );

-- Evaluations: Similar policies
CREATE POLICY "Users can view evaluations" ON evaluations
  FOR SELECT USING (
    evaluator_id = auth.uid() OR
    school_id = auth.jwt() ->> 'school_id'
  );

-- District admins can see anonymized data across schools
CREATE POLICY "District admins can view all data" ON observations
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'DISTRICT_ADMIN' AND
    school_id IN (
      SELECT id FROM schools WHERE district = auth.jwt() ->> 'district'
    )
  );
```

### 6.3 Performance Optimizations
```typescript
// apps/web/lib/db/indexes.sql
-- Performance indexes
CREATE INDEX idx_observations_teacher_date ON observations(teacher_id, date DESC);
CREATE INDEX idx_observations_school_created ON observations(school_id, created_at DESC);
CREATE INDEX idx_evaluations_teacher ON evaluations(teacher_id);
CREATE INDEX idx_teachers_school ON teachers(school_id);

-- Full text search
ALTER TABLE observations ADD COLUMN search_vector tsvector;
UPDATE observations SET search_vector = to_tsvector('english', raw_notes || ' ' || COALESCE(enhanced_notes, ''));
CREATE INDEX idx_observations_search ON observations USING GIN(search_vector);
```

## Deployment Strategy

### Production Architecture
```yaml
# vercel.json
{
  "functions": {
    "apps/web/app/api/ai/enhance/route.ts": {
      "maxDuration": 60
    },
    "apps/web/app/api/evaluations/generate/route.ts": {
      "maxDuration": 300
    }
  },
  "crons": [
    {
      "path": "/api/cron/analytics",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Monitoring Setup (continued)
```typescript
// apps/web/lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  beforeSend(event, hint) {
    // Scrub sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies
    }
    return event
  },
})

// apps/web/lib/monitoring/posthog.ts
import posthog from 'posthog-js'

export function initAnalytics() {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: 'https://app.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
    })
  }
}

// Track key events
export function trackEvent(event: string, properties?: any) {
  posthog?.capture(event, properties)
}
```

## Key Implementation Files

### 1. AI Prompt Management
```typescript
// packages/ai-prompts/src/prompts.ts
export const OBSERVATION_ENHANCEMENT_PROMPT = `
You are an expert instructional coach with 20+ years of experience in teacher development.
Your role is to transform rough observation notes into constructive, growth-oriented feedback.

TEACHER CONTEXT:
{teacherContext}

OBSERVATION NOTES:
{observationNotes}

PREVIOUS OBSERVATIONS SUMMARY:
{previousObservations}

SCHOOL PRIORITIES:
{schoolPriorities}

Please provide enhanced observation notes that:
1. Identify 3-5 specific instructional strengths with concrete examples
2. Connect observations to the teacher's stated growth goals
3. Suggest 2-3 actionable next steps that build on strengths
4. Reference progress from previous observations when relevant
5. Maintain a warm, supportive tone that encourages growth
6. Use the school's instructional framework terminology

Format the response with clear sections and bullet points for readability.
`

export const EVALUATION_GENERATION_PROMPT = `
You are creating a {evaluationType} evaluation for a teacher based on multiple observations.

TEACHER PROFILE:
{teacherProfile}

OBSERVATION SUMMARY:
{observationSummary}

EVALUATION FRAMEWORK:
{evaluationFramework}

PREVIOUS EVALUATIONS:
{previousEvaluations}

Generate a comprehensive evaluation that:
1. Synthesizes evidence from multiple observations
2. Rates performance according to the provided framework
3. Celebrates specific growth and achievements
4. Identifies 2-3 priority areas for continued development
5. Provides concrete recommendations with resources
6. Sets measurable goals for the next evaluation period
7. Maintains professional language while being encouraging

Structure the evaluation with clear sections matching the district format.
`
```

### 2. Real-time Features
```typescript
// apps/web/hooks/use-realtime.ts
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useRealtimeObservations(teacherId: string) {
  const [observations, setObservations] = useState<Observation[]>([])
  
  useEffect(() => {
    // Initial fetch
    fetchObservations()
    
    // Set up realtime subscription
    const channel = supabase
      .channel(`teacher:${teacherId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'observations',
          filter: `teacher_id=eq.${teacherId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setObservations(prev => [payload.new as Observation, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setObservations(prev => 
              prev.map(obs => 
                obs.id === payload.new.id ? payload.new as Observation : obs
              )
            )
          }
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [teacherId])
  
  return observations
}
```

### 3. File Processing Service
```typescript
// apps/web/lib/services/file-processor.ts
import { Storage } from '@google-cloud/storage'
import vision from '@google-cloud/vision'
import { pdfParse } from 'pdf-parse'

export class FileProcessorService {
  private visionClient = new vision.ImageAnnotatorClient()
  private storage = new Storage()
  
  async processArtifact(file: File): Promise<ProcessedArtifact> {
    const fileUrl = await this.uploadFile(file)
    
    if (file.type.startsWith('image/')) {
      return this.processImage(fileUrl)
    } else if (file.type === 'application/pdf') {
      return this.processPDF(file)
    }
    
    return { fileUrl, text: null }
  }
  
  private async processImage(imageUrl: string) {
    const [result] = await this.visionClient.textDetection(imageUrl)
    const text = result.fullTextAnnotation?.text || ''
    
    // Also extract other useful data
    const [labels] = await this.visionClient.labelDetection(imageUrl)
    const metadata = {
      labels: labels.labelAnnotations?.map(l => l.description),
      confidence: labels.labelAnnotations?.[0]?.score
    }
    
    return {
      fileUrl: imageUrl,
      text,
      metadata
    }
  }
  
  private async processPDF(file: File) {
    const buffer = await file.arrayBuffer()
    const data = await pdfParse(Buffer.from(buffer))
    
    return {
      fileUrl: await this.uploadFile(file),
      text: data.text,
      metadata: {
        pages: data.numpages,
        info: data.info
      }
    }
  }
  
  private async uploadFile(file: File): Promise<string> {
    const bucket = this.storage.bucket(process.env.GCS_BUCKET!)
    const fileName = `artifacts/${Date.now()}-${file.name}`
    const fileBuffer = await file.arrayBuffer()
    
    const gcsFile = bucket.file(fileName)
    await gcsFile.save(Buffer.from(fileBuffer))
    
    return `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${fileName}`
  }
}
```

### 4. District Analytics Engine
```typescript
// apps/web/lib/analytics/district-analytics.ts
import { prisma } from '@trellis/database'
import { startOfMonth, subMonths } from 'date-fns'

export class DistrictAnalyticsEngine {
  async generateDistrictReport(districtId: string, timeframe: string) {
    const schools = await this.getDistrictSchools(districtId)
    
    // Parallel data fetching
    const [
      observationTrends,
      performanceMetrics,
      focusAreaAnalysis,
      teacherGrowth
    ] = await Promise.all([
      this.getObservationTrends(schools, timeframe),
      this.getPerformanceMetrics(schools),
      this.analyzeFocusAreas(schools),
      this.analyzeTeacherGrowth(schools)
    ])
    
    // AI-powered insights
    const insights = await this.generateAIInsights({
      observationTrends,
      performanceMetrics,
      focusAreaAnalysis,
      teacherGrowth
    })
    
    return {
      summary: {
        totalSchools: schools.length,
        totalTeachers: await this.countTeachers(schools),
        totalObservations: observationTrends.total,
        avgObservationsPerTeacher: observationTrends.average
      },
      trends: observationTrends,
      performance: performanceMetrics,
      focusAreas: focusAreaAnalysis,
      growth: teacherGrowth,
      insights,
      recommendations: insights.recommendations
    }
  }
  
  private async analyzeFocusAreas(schools: School[]) {
    const recentDate = subMonths(new Date(), 3)
    
    const focusAreas = await prisma.observation.groupBy({
      by: ['focusAreas'],
      where: {
        schoolId: { in: schools.map(s => s.id) },
        date: { gte: recentDate }
      },
      _count: true
    })
    
    // Identify trending topics
    const trending = this.identifyTrends(focusAreas)
    
    return {
      topAreas: focusAreas.slice(0, 10),
      trending,
      recommendations: this.generateFocusRecommendations(trending)
    }
  }
  
  private async generateAIInsights(data: AnalyticsData) {
    const prompt = `
      Analyze this district education data and provide strategic insights:
      
      ${JSON.stringify(data, null, 2)}
      
      Provide:
      1. 3-5 key insights about instructional trends
      2. Areas of concern that need immediate attention
      3. Success stories that can be replicated
      4. 3 specific, actionable recommendations for district leadership
      5. Predicted challenges for the next quarter
    `
    
    const response = await generateText({
      model: anthropic('claude-3-sonnet'),
      prompt,
      temperature: 0.3
    })
    
    return JSON.parse(response.text)
  }
}
```

### 5. Demo Experience Enhancements
```typescript
// apps/web/components/demo/ai-simulation.tsx
'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export function AIEnhancementDemo() {
  const [showEnhanced, setShowEnhanced] = useState(false)
  
  const rawNotes = `
    - Students working in groups of 4
    - Some confusion about the task
    - Teacher circulating, answering questions
    - Good energy in the room
    - Ran out of time for closure
  `
  
  const enhancedNotes = `
    **Collaborative Learning Environment** 
    Ms. Rodriguez effectively implemented collaborative learning with well-structured groups of 4 students. The classroom energy was notably positive, with students actively engaged in peer discussions.
    
    **Areas of Strength:**
    • Effective circulation and proximity - consistently moved throughout the room providing support
    • Responsive to student needs - promptly addressed confusion when it arose
    • Student engagement - maintained high energy and participation throughout the lesson
    
    **Growth Opportunities:**
    • Consider providing written task instructions in addition to verbal directions to reduce initial confusion
    • Build in 5-minute buffer for lesson closure to ensure students can consolidate their learning
    
    **Connection to Previous Observations:**
    Excellent progress on classroom management goal from October observation. Student engagement has noticeably improved.
    
    **Next Steps:**
    1. Implement a visible timer to help pace lessons
    2. Create a "closing routine" checklist for consistent lesson wrap-up
  `
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Enhancement Magic
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Your Raw Notes</h4>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
              {rawNotes}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">AI Enhanced</h4>
            {!showEnhanced ? (
              <div className="bg-muted p-4 rounded-lg flex items-center justify-center h-full">
                <Button
                  onClick={() => setShowEnhanced(true)}
                  className="bg-gradient-to-r from-purple-500 to-blue-500"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Enhance with AI
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-muted p-4 rounded-lg prose prose-sm max-w-none"
              >
                <div dangerouslySetInnerHTML={{ __html: marked(enhancedNotes) }} />
              </motion.div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

## Testing Strategy

### 1. Unit Tests
```typescript
// apps/web/__tests__/ai-enhancement.test.ts
import { AIEnhancementService } from '@/lib/ai/enhancement-service'

describe('AIEnhancementService', () => {
  it('should enhance observation notes with teacher context', async () => {
    const service = new AIEnhancementService()
    const result = await service.enhanceObservation(
      'Students working in groups',
      mockTeacher,
      mockObservationHistory
    )
    
    expect(result).toContain('Areas of Strength')
    expect(result).toContain('Growth Opportunities')
    expect(result).toContain(mockTeacher.currentGoals[0].goal)
  })
})
```

### 2. Integration Tests
```typescript
// apps/web/__tests__/integration/observation-flow.test.ts
import { createMocks } from 'node-mocks-http'

describe('Observation Flow', () => {
  it('should create observation and trigger enhancement', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        teacherId: 'test-teacher-id',
        rawNotes: 'Test observation notes'
      }
    })
    
    await POST(req, res)
    
    expect(res._getStatusCode()).toBe(200)
    
    // Verify job was queued
    const jobs = await enhancementQueue.getJobs(['waiting'])
    expect(jobs).toHaveLength(1)
    expect(jobs[0].data.observationId).toBeDefined()
  })
})
```

## Launch Checklist

### Pre-Launch
- [ ] Complete security audit
- [ ] Load testing (target: 1000 concurrent users)
- [ ] FERPA compliance review
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Cross-browser testing
- [ ] Mobile responsiveness check
- [ ] Demo data quality review
- [ ] AI prompt optimization
- [ ] Error tracking setup
- [ ] Analytics implementation

### Launch Day
- [ ] Enable production monitoring
- [ ] Set up on-call rotation
- [ ] Prepare support documentation
- [ ] Customer success team training
- [ ] Marketing site live
- [ ] Demo environment ready
- [ ] Backup procedures tested
- [ ] Scale settings configured

### Post-Launch
- [ ] Monitor error rates
- [ ] Track user engagement
- [ ] Gather feedback
- [ ] Performance optimization
- [ ] Feature usage analytics
- [ ] Customer success check-ins

## Success Metrics

### Technical Metrics
- Page load time < 2 seconds
- AI enhancement < 5 seconds
- 99.9% uptime
- Zero data breaches

### Business Metrics
- 10 district demos scheduled in first month
- 3 pilot schools onboarded
- 80% daily active usage in pilot schools
- 90% positive feedback on evaluations

This comprehensive roadmap provides everything needed to build a production-ready MVP that will impress school districts while maintaining the flexibility to scale. The architecture supports both immediate demo needs and long-term growth, with a clear path from single-school pilots to district-wide deployments.