import { PrismaClient } from '../packages/database/node_modules/@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

// Danielson Framework for evaluation
const danielsonFramework = {
  domains: [
    {
      name: 'Planning and Preparation',
      components: [
        'Demonstrating Knowledge of Content and Pedagogy',
        'Demonstrating Knowledge of Students',
        'Setting Instructional Outcomes',
        'Demonstrating Knowledge of Resources',
        'Designing Coherent Instruction',
        'Designing Student Assessments'
      ]
    },
    {
      name: 'Classroom Environment',
      components: [
        'Creating an Environment of Respect and Rapport',
        'Establishing a Culture for Learning',
        'Managing Classroom Procedures',
        'Managing Student Behavior',
        'Organizing Physical Space'
      ]
    },
    {
      name: 'Instruction',
      components: [
        'Communicating with Students',
        'Using Questioning and Discussion Techniques',
        'Engaging Students in Learning',
        'Using Assessment in Instruction',
        'Demonstrating Flexibility and Responsiveness'
      ]
    },
    {
      name: 'Professional Responsibilities',
      components: [
        'Reflecting on Teaching',
        'Maintaining Accurate Records',
        'Communicating with Families',
        'Participating in a Professional Community',
        'Growing and Developing Professionally',
        'Showing Professionalism'
      ]
    }
  ]
}

async function seedDemoData() {
  console.log('🌱 Starting database seeding...')

  try {
    // Clear existing data
    console.log('Clearing existing data...')
    await prisma.evaluation.deleteMany()
    await prisma.observation.deleteMany()
    await prisma.teacher.deleteMany()
    await prisma.user.deleteMany()
    await prisma.school.deleteMany()
    // Create demo school
    console.log('Creating demo school...')
    const school = await prisma.school.create({
      data: {
        name: 'Lincoln Elementary School',
        district: 'Riverside Unified School District',
        settings: {
          academicYear: '2024-2025',
          observationFrequency: 'monthly',
          evaluationCycle: 'annual'
        },
        evaluationFramework: danielsonFramework
      }
    })

    // Create demo users
    console.log('Creating demo users...')
    const admin = await prisma.user.create({
      data: {
        email: 'admin@lincoln.edu',
        name: 'Sarah Johnson',
        role: 'ADMIN',
        schoolId: school.id
      }
    })

    const evaluator1 = await prisma.user.create({
      data: {
        email: 'evaluator1@lincoln.edu',
        name: 'Michael Chen',
        role: 'EVALUATOR',
        schoolId: school.id
      }
    })

    const evaluator2 = await prisma.user.create({
      data: {
        email: 'evaluator2@lincoln.edu',
        name: 'Emily Rodriguez',
        role: 'EVALUATOR',
        schoolId: school.id
      }
    })

    // Create 25 teachers with realistic data
    console.log('Creating teachers...')
    const teachers = await Promise.all(
      Array.from({ length: 25 }, async () => {
        const subjects = [
          'Mathematics',
          'English Language Arts',
          'Science',
          'Social Studies',
          'Special Education',
          'Physical Education',
          'Art',
          'Music',
          'Technology',
          'Library'
        ]

        const gradeLevels = ['K', '1', '2', '3', '4', '5', '6']

        const strengths = [
          'Classroom management',
          'Student engagement',
          'Differentiated instruction',
          'Technology integration',
          'Parent communication',
          'Assessment strategies',
          'Inquiry-based learning',
          'Collaborative learning',
          'Cultural responsiveness',
          'Data-driven instruction'
        ]

        const growthAreas = [
          'Technology integration',
          'Student-led discussions',
          'Higher-order thinking questions',
          'Individual student support',
          'Assessment variety',
          'Cross-curricular connections',
          'Student self-assessment',
          'Project-based learning',
          'Digital literacy',
          'Social-emotional learning'
        ]

        return prisma.teacher.create({
          data: {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            subject: faker.helpers.arrayElement(subjects),
            gradeLevel: faker.helpers.arrayElement(gradeLevels),
            schoolId: school.id,
            strengths: faker.helpers.arrayElements(strengths, faker.number.int({ min: 3, max: 6 })),
            growthAreas: faker.helpers.arrayElements(growthAreas, faker.number.int({ min: 2, max: 4 })),
            currentGoals: [
              {
                goal: 'Implement project-based learning in 50% of lessons',
                progress: faker.number.int({ min: 20, max: 80 })
              },
              {
                goal: 'Enhance technology integration for student engagement',
                progress: faker.number.int({ min: 30, max: 90 })
              },
              {
                goal: 'Develop more comprehensive assessment strategies',
                progress: faker.number.int({ min: 15, max: 70 })
              }
            ],
            performanceHistory: []
          }
        })
      })
    )

    // Generate observations with realistic patterns
    console.log('Creating observations...')
    const observationTypes = ['FORMAL', 'INFORMAL', 'WALKTHROUGH'] as const
    const focusAreas = [
      'Student Engagement',
      'Differentiation',
      'Assessment Strategies',
      'Classroom Management',
      'Higher-Order Thinking',
      'Technology Integration',
      'Student Collaboration',
      'Cultural Responsiveness',
      'Data-Driven Instruction',
      'Inquiry-Based Learning'
    ]

    const observers = [admin.id, evaluator1.id, evaluator2.id]

    for (const teacher of teachers) {
      const observationCount = faker.number.int({ min: 3, max: 8 })
      
      for (let i = 0; i < observationCount; i++) {
        const observationDate = faker.date.recent({ days: 90 })
        const duration = faker.number.int({ min: 15, max: 60 })
        const observationType = faker.helpers.arrayElement(observationTypes)
        const observerId = faker.helpers.arrayElement(observers)
        const selectedFocusAreas = faker.helpers.arrayElements(focusAreas, faker.number.int({ min: 1, max: 3 }))

        const rawNotes = generateRealisticObservationNotes(teacher, observationType, selectedFocusAreas)
        const enhancedNotes = generateEnhancedObservationNotes(teacher, rawNotes, selectedFocusAreas)

        await prisma.observation.create({
          data: {
            teacherId: teacher.id,
            observerId,
            schoolId: school.id,
            date: observationDate,
            duration,
            observationType,
            rawNotes,
            enhancedNotes,
            focusAreas: selectedFocusAreas
          }
        })
      }
    }

    // Generate some evaluations
    console.log('Creating evaluations...')
    const evaluationTypes = ['FORMATIVE', 'SUMMATIVE', 'MID_YEAR', 'END_YEAR'] as const

    for (const teacher of teachers.slice(0, 15)) { // Create evaluations for first 15 teachers
      const evaluationType = faker.helpers.arrayElement(evaluationTypes)
      const evaluatorId = faker.helpers.arrayElement(observers)
      const evaluationDate = faker.date.recent({ days: 180 })

      const content = generateEvaluationContent(teacher, evaluationType)
      const scores = generateEvaluationScores()

      await prisma.evaluation.create({
        data: {
          teacherId: teacher.id,
          evaluatorId,
          schoolId: school.id,
          type: evaluationType,
          status: 'SUBMITTED',
          content,
          summary: generateEvaluationSummary(teacher, evaluationType),
          recommendations: generateRecommendations(teacher),
          nextSteps: generateNextSteps(teacher),
          scores,
          submittedAt: evaluationDate
        }
      })
    }

    console.log('✅ Database seeding completed successfully!')
    console.log(`Created:
    - 1 School
    - 3 Users (1 admin, 2 evaluators)
    - ${teachers.length} Teachers
    - ${teachers.length * 5} Observations (average)
    - 15 Evaluations`)

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

function generateRealisticObservationNotes(teacher: any, type: string, focusAreas: string[]): string {
  const templates = {
    FORMAL: [
      `During this formal observation of ${teacher.name}'s ${teacher.subject} class, I observed a ${type.toLowerCase()} lesson focused on ${focusAreas.join(', ')}. The lesson began with a clear learning objective displayed on the board. Students were actively engaged in ${faker.helpers.arrayElement(['small group activities', 'whole class discussion', 'hands-on learning', 'technology-based tasks'])}.`,
      `This formal observation of ${teacher.name}'s classroom revealed strong implementation of ${focusAreas.join(', ')}. The lesson structure was well-organized with appropriate transitions between activities. Students demonstrated understanding through ${faker.helpers.arrayElement(['verbal responses', 'written work', 'group presentations', 'individual assessments'])}.`
    ],
    INFORMAL: [
      `During this informal walkthrough, I observed ${teacher.name} working with students on ${focusAreas.join(', ')}. The classroom environment was ${faker.helpers.arrayElement(['calm and focused', 'energetic and engaged', 'collaborative and supportive'])}.`,
      `This informal observation showed ${teacher.name} effectively managing ${focusAreas.join(', ')}. Students were ${faker.helpers.arrayElement(['on-task and engaged', 'working independently', 'collaborating in groups', 'participating in discussions'])}.`
    ],
    WALKTHROUGH: [
      `Quick walkthrough observation of ${teacher.name}'s classroom showed students engaged in ${focusAreas.join(', ')}. The lesson appeared to be progressing well with students ${faker.helpers.arrayElement(['actively participating', 'focused on tasks', 'working collaboratively', 'demonstrating understanding'])}.`,
      `During this brief walkthrough, I observed ${teacher.name} implementing ${focusAreas.join(', ')}. The classroom atmosphere was ${faker.helpers.arrayElement(['positive and productive', 'focused and organized', 'energetic and learning-focused'])}.`
    ]
  }

  const template = faker.helpers.arrayElement(templates[type as keyof typeof templates])
  
  // Add specific details based on focus areas
  let details = ''
  if (focusAreas.includes('Student Engagement')) {
    details += ` Student engagement was high throughout the lesson, with students actively participating in discussions and activities.`
  }
  if (focusAreas.includes('Differentiation')) {
    details += ` I noticed effective differentiation strategies being used to support diverse learners.`
  }
  if (focusAreas.includes('Technology Integration')) {
    details += ` Technology was appropriately integrated to enhance student learning.`
  }
  if (focusAreas.includes('Classroom Management')) {
    details += ` Classroom management was strong with clear expectations and smooth transitions.`
  }

  return template + details
}

function generateEnhancedObservationNotes(teacher: any, rawNotes: string, focusAreas: string[]): string {
  return `**Instructional Strengths Observed:**
• Effective implementation of ${focusAreas.join(', ')}
• Strong student engagement throughout the lesson
• Appropriate use of instructional strategies for ${teacher.subject}
• Good classroom management and organization

**Areas for Growth:**
• Consider providing more opportunities for student-led discussions
• Continue developing higher-order thinking questions
• Explore additional differentiation strategies for diverse learners

**Next Steps:**
1. Implement more collaborative learning activities
2. Add more formative assessment opportunities
3. Continue building on the strong foundation established

**Connection to Previous Goals:**
Excellent progress on the professional development goals. The focus on ${focusAreas.join(', ')} shows continued growth and commitment to improvement.`
}

function generateEvaluationContent(teacher: any, type: string): any {
  return {
    domains: danielsonFramework.domains.map(domain => ({
      name: domain.name,
      score: faker.number.float({ min: 2.5, max: 4.0, precision: 0.1 }),
      evidence: `Strong evidence of ${domain.name.toLowerCase()} practices observed throughout the evaluation period.`,
      recommendations: `Continue to develop and refine ${domain.name.toLowerCase()} strategies.`
    })),
    overallScore: faker.number.float({ min: 2.8, max: 4.0, precision: 0.1 }),
    strengths: teacher.strengths.slice(0, 3),
    growthAreas: teacher.growthAreas.slice(0, 2)
  }
}

function generateEvaluationScores(): any {
  return {
    planning: faker.number.float({ min: 2.5, max: 4.0, precision: 0.1 }),
    environment: faker.number.float({ min: 2.5, max: 4.0, precision: 0.1 }),
    instruction: faker.number.float({ min: 2.5, max: 4.0, precision: 0.1 }),
    professional: faker.number.float({ min: 2.5, max: 4.0, precision: 0.1 })
  }
}

function generateEvaluationSummary(teacher: any, type: string): string {
  return `${teacher.name} demonstrates strong instructional practices in ${teacher.subject}. The ${type.toLowerCase()} evaluation shows consistent growth in key areas including ${teacher.strengths.slice(0, 2).join(', ')}. Areas for continued development include ${teacher.growthAreas.slice(0, 2).join(', ')}.`
}

function generateRecommendations(teacher: any): string[] {
  return [
    `Continue developing ${teacher.growthAreas[0]} strategies`,
    `Explore additional ${teacher.growthAreas[1]} opportunities`,
    `Maintain focus on ${teacher.strengths[0]} while expanding other areas`
  ]
}

function generateNextSteps(teacher: any): string[] {
  return [
    `Attend professional development on ${teacher.growthAreas[0]}`,
    `Implement new strategies for ${teacher.growthAreas[1]}`,
    `Continue collaboration with colleagues on best practices`
  ]
}

// Run the seeder
if (require.main === module) {
  seedDemoData()
    .then(() => {
      console.log('Seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Seeding failed:', error)
      process.exit(1)
    })
}

export { seedDemoData } 