import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import { AppRouter } from 'api'
import dotenv from 'dotenv'

// .env 파일 로드 (API_URL 등 환경변수 사용 위함)
dotenv.config()

// API 서버 URL (환경 변수 등으로 설정하는 것이 좋습니다)
const API_URL = process.env.API_URL || 'http://localhost:3001/trpc'

// 명시적 타입 지정으로 타입 추론 문제 해결
export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: API_URL,
    }),
  ],
}) as ReturnType<typeof createTRPCProxyClient<AppRouter>>
