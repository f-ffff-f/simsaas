import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from 'api'

// API 서버 URL (환경 변수 등으로 설정하는 것이 좋습니다)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/trpc'

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: API_URL,
    }),
  ],
})
