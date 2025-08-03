import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

// Add Prisma middleware for audit logging
prisma.$use(async (params, next) => {
  const result = await next(params)
  
  // Log all data modifications for compliance
  if (['create', 'update', 'delete'].includes(params.action)) {
    console.log(`[AUDIT] ${params.action} on ${params.model}:`, {
      timestamp: new Date().toISOString(),
      action: params.action,
      model: params.model,
      args: params.args,
    })
  }
  
  return result
})

export * from '@prisma/client' 