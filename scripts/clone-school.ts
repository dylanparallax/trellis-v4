import { PrismaClient, Prisma, Role } from '../packages/database/node_modules/@prisma/client'
import { config as dotenvConfig } from 'dotenv'
import path from 'path'
import { faker } from '@faker-js/faker'

/**
 * Clone a school and its related data (users, teachers, observations, evaluations).
 * Options:
 *  - sourceSchoolName or sourceSchoolId
 *  - newSchoolName
 *  - anonymizeTeachers: replace teacher names/emails
 *  - dryRun: do not persist changes
 */

// Load env from root .env and apps/web/.env.local if present
dotenvConfig({ path: path.resolve(process.cwd(), '.env') })
dotenvConfig({ path: path.resolve(process.cwd(), 'apps/web/.env.local') })

const prisma = new PrismaClient()

interface CloneOptions {
  sourceSchoolId?: string
  sourceSchoolName?: string
  newSchoolName: string
  anonymizeTeachers?: boolean
  dryRun?: boolean
}

async function findSourceSchool(opts: CloneOptions) {
  if (opts.sourceSchoolId) {
    return prisma.school.findUnique({ where: { id: opts.sourceSchoolId } })
  }
  if (opts.sourceSchoolName) {
    return prisma.school.findFirst({ where: { name: opts.sourceSchoolName } })
  }
  return null
}

function anonymizeTeacher(original: { name: string | null; email: string | null }) {
  const name = faker.person.fullName()
  const email = faker.internet.email({ firstName: name.split(' ')[0], lastName: name.split(' ').slice(-1)[0], provider: 'example.edu' })
  return { name, email }
}

async function cloneSchool(opts: CloneOptions) {
  const source = await findSourceSchool(opts)
  if (!source) {
    throw new Error('Source school not found')
  }

  const dryRun = Boolean(opts.dryRun)

  console.log(`Cloning school: ${source.name} -> ${opts.newSchoolName} ${dryRun ? '(dry-run)' : ''}`)

  // Create school (or simulate)
  const newSchoolData: Prisma.SchoolCreateInput = {
    name: opts.newSchoolName,
    district: source.district,
    settings: source.settings as Prisma.InputJsonValue,
    evaluationFramework: source.evaluationFramework as Prisma.InputJsonValue,
  }

  const newSchool = dryRun ? { id: 'DRY_RUN_SCHOOL_ID', ...newSchoolData } as any : await prisma.school.create({ data: newSchoolData })

  // Users
  const users = await prisma.user.findMany({ where: { schoolId: source.id } })
  const newUsers: Array<{ originalId: string; id: string; role: Role }> = []
  for (const u of users) {
    const data: Prisma.UserCreateInput = {
      email: u.email.replace('@', `+${faker.string.alphanumeric(6)}@`),
      name: u.name,
      role: u.role,
      school: dryRun ? { connect: { id: 'DRY_RUN_SCHOOL_ID' } } : { connect: { id: (newSchool as any).id } },
    }
    const created = dryRun ? { id: `DRY_RUN_USER_${u.id}`, role: u.role } as any : await prisma.user.create({ data })
    newUsers.push({ originalId: u.id, id: created.id, role: u.role })
  }

  // Teachers
  const teachers = await prisma.teacher.findMany({ where: { schoolId: source.id } })
  const newTeachers: Array<{ originalId: string; id: string }> = []
  for (const t of teachers) {
    const maybeAnon = opts.anonymizeTeachers ? anonymizeTeacher({ name: t.name, email: t.email ?? null }) : { name: t.name, email: t.email }
    const data: Prisma.TeacherCreateInput = {
      name: maybeAnon.name ?? t.name,
      email: maybeAnon.email ?? t.email,
      subject: t.subject,
      gradeLevel: t.gradeLevel,
      photoUrl: null,
      strengths: t.strengths,
      growthAreas: t.growthAreas,
      currentGoals: t.currentGoals as Prisma.InputJsonValue,
      performanceHistory: t.performanceHistory as Prisma.InputJsonValue,
      school: dryRun ? { connect: { id: 'DRY_RUN_SCHOOL_ID' } } : { connect: { id: (newSchool as any).id } },
    }
    const created = dryRun ? { id: `DRY_RUN_TEACHER_${t.id}` } as any : await prisma.teacher.create({ data })
    newTeachers.push({ originalId: t.id, id: created.id })
  }

  // Helper maps
  const userMap = new Map(newUsers.map(x => [x.originalId, x.id]))
  const teacherMap = new Map(newTeachers.map(x => [x.originalId, x.id]))

  // Observations
  const observations = await prisma.observation.findMany({ where: { schoolId: source.id }, orderBy: { createdAt: 'asc' } })
  for (const o of observations) {
    const newTeacherId = teacherMap.get(o.teacherId)
    const newObserverId = userMap.get(o.observerId)
    if (!newTeacherId || !newObserverId) continue
    const data: Prisma.ObservationCreateInput = {
      date: o.date,
      duration: o.duration ?? null,
      observationType: o.observationType,
      rawNotes: o.rawNotes,
      enhancedNotes: o.enhancedNotes,
      focusAreas: o.focusAreas,
      teacher: { connect: { id: newTeacherId } },
      observer: { connect: { id: newObserverId } },
      school: dryRun ? { connect: { id: 'DRY_RUN_SCHOOL_ID' } } : { connect: { id: (newSchool as any).id } },
    }
    if (!dryRun) {
      const created = await prisma.observation.create({ data })
      // Artifacts
      const artifacts = await prisma.observationArtifact.findMany({ where: { observationId: o.id } })
      for (const a of artifacts) {
        await prisma.observationArtifact.create({ data: {
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          fileType: a.fileType,
          ocrText: a.ocrText,
          processedData: a.processedData as Prisma.InputJsonValue,
          observation: { connect: { id: created.id } },
        } })
      }
    }
  }

  // Evaluations
  const evaluations = await prisma.evaluation.findMany({ where: { schoolId: source.id }, orderBy: { createdAt: 'asc' } })
  for (const e of evaluations) {
    const newTeacherId = teacherMap.get(e.teacherId)
    const newEvaluatorId = userMap.get(e.evaluatorId)
    if (!newTeacherId || !newEvaluatorId) continue
    const data: Prisma.EvaluationCreateInput = {
      type: e.type,
      status: e.status,
      content: e.content as Prisma.InputJsonValue,
      summary: e.summary,
      recommendations: e.recommendations,
      nextSteps: e.nextSteps,
      scores: e.scores as Prisma.InputJsonValue,
      submittedAt: e.submittedAt,
      teacher: { connect: { id: newTeacherId } },
      evaluator: { connect: { id: newEvaluatorId } },
      school: dryRun ? { connect: { id: 'DRY_RUN_SCHOOL_ID' } } : { connect: { id: (newSchool as any).id } },
    }
    if (!dryRun) {
      await prisma.evaluation.create({ data })
    }
  }

  return {
    schoolId: (newSchool as any).id,
    stats: {
      usersCopied: users.length,
      teachersCopied: teachers.length,
      observationsCopied: observations.length,
      evaluationsCopied: evaluations.length,
    }
  }
}

function parseArgs(argv: string[]): CloneOptions {
  const args = new Map<string, string>()
  for (const arg of argv.slice(2)) {
    const [k, v] = arg.split('=')
    if (k && v !== undefined) args.set(k.replace(/^--/, ''), v)
    else if (k && v === undefined) args.set(k.replace(/^--/, ''), 'true')
  }
  const opts: CloneOptions = {
    sourceSchoolId: args.get('sourceSchoolId'),
    sourceSchoolName: args.get('sourceSchoolName'),
    newSchoolName: args.get('newSchoolName') || 'Cloned School',
    anonymizeTeachers: args.get('anonymize') === 'true' || args.get('anonymizeTeachers') === 'true',
    dryRun: args.get('dryRun') === 'true',
  }
  if (!opts.sourceSchoolId && !opts.sourceSchoolName) {
    throw new Error('Provide --sourceSchoolId or --sourceSchoolName')
  }
  if (!opts.newSchoolName) {
    throw new Error('Provide --newSchoolName')
  }
  return opts
}

if (require.main === module) {
  (async () => {
    try {
      const opts = parseArgs(process.argv)
      const result = await cloneSchool(opts)
      console.log('Clone completed', result)
    } catch (err) {
      console.error('Clone failed:', err)
      process.exitCode = 1
    } finally {
      await prisma.$disconnect()
    }
  })()
}

export { cloneSchool }
