// api/src/server.ts
import prisma from '@/lib/prisma'
import { simSaaSJobQueue } from '@/lib/queue'
import bullMQPlugin from '@/plugins/bullmq'
import { appRouter } from '@/router'
import type { Context } from '@/trpc'
import cors from '@fastify/cors'
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import fastify from 'fastify'

const server = fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
  maxParamLength: 5000,
})

// CORS 설정
server.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
})

// BullMQ 플러그인 등록
// 이 플러그인은 Worker를 시작하고, 서버 종료 시 리소스를 정리합니다.
server.register(bullMQPlugin)

// tRPC 플러그인 등록
server.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: {
    router: appRouter,
    createContext: ({ req, res }: CreateFastifyContextOptions): Context => {
      // 여기서 직접 컨텍스트 객체를 생성하여 반환합니다.
      // trpc.ts에 정의된 Context 타입과 일치해야 합니다.
      return {
        req,
        res,
        prisma,
        simSaaSJobQueue,
      }
    },
    onError({ path, error }: { path: any; error: any }) {
      console.error(`Error in tRPC handler on path '${path}':`, error)
      // 필요시 여기에 외부 로깅 서비스 연동
    },
  },
})

export default server
