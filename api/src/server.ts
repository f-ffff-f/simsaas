// api/src/server.ts
import fastify from 'fastify'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import cors from '@fastify/cors'
import { appRouter } from '@/router' // Root AppRouter
import { createContext } from '@/trpc' // tRPC Context 생성 함수

const server = fastify({
  // Fastify 로거 설정 (개발 시 유용)
  logger: {
    transport: {
      target: 'pino-pretty', // pino-pretty 설치 필요: pnpm add -D pino-pretty --filter api
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
  maxParamLength: 5000, // URL 파라미터 최대 길이 (필요에 따라 조절)
})

// CORS 설정 (필요에 따라 옵션 조정)
server.register(cors, {
  origin: '*', // 실제 프로덕션에서는 특정 도메인으로 제한하는 것이 좋습니다.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
})

// tRPC 플러그인 등록
server.register(fastifyTRPCPlugin, {
  prefix: '/trpc', // tRPC API 엔드포인트 prefix (예: /trpc/project.create)
  trpcOptions: {
    router: appRouter,
    createContext,
    onError: ({ path, error }: { path?: string; error: Error }) => {
      console.error(`Error in tRPC handler on path '${path}':`, error)
      // 여기에 에러 로깅 서비스 연동 가능
    },
  },
})

export default server
