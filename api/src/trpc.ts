// api/src/trpc.ts
import prisma from '@/lib/prisma'
import { initTRPC } from '@trpc/server'
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify'
import superjson from 'superjson'
import type { simSaaSJobQueue as _simSaaSJobQueue } from '@/lib/queue' // 실제 큐 인스턴스의 타입 임포트

// 컨텍스트 타입에 simSaaSJobQueue 추가
export interface Context {
  req: CreateFastifyContextOptions['req']
  res: CreateFastifyContextOptions['res']
  prisma: typeof prisma
  simSaaSJobQueue: typeof _simSaaSJobQueue // 타입 명시
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure
export const middleware = t.middleware
