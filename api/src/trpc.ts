// api/src/trpc.ts
import prisma from '@/lib/prisma'
import { initTRPC } from '@trpc/server'
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify'
import superjson from 'superjson'

// 1. tRPC 컨텍스트 정의
//    요청마다 생성되며, 모든 tRPC 프로시저에서 접근 가능합니다.
//    여기서는 Prisma Client 인스턴스를 컨텍스트에 포함시킵니다.
export async function createContext({ req, res }: CreateFastifyContextOptions) {
  return {
    req,
    res,
    prisma,
  }
}

// 컨텍스트의 타입을 추론합니다.
export type Context = Awaited<ReturnType<typeof createContext>>

// 2. tRPC 초기화
const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

// 3. 재사용 가능한 컴포넌트 export
export const router = t.router // 라우터 생성 함수
export const publicProcedure = t.procedure // 인증이 필요 없는 공개 프로시저
export const middleware = t.middleware // 미들웨어 생성 함수
