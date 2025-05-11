import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import { AppRouter } from 'api'
import superjson from 'superjson'
import dotenv from 'dotenv'
import path from 'path'

// 명시적으로 .env 파일 경로 지정
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const API_URL = process.env.API_URL

if (!API_URL) {
  throw new Error('API_URL is not defined')
}

export const trpcClient = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: API_URL,
    }),
  ],
}) as ReturnType<typeof createTRPCProxyClient<AppRouter>>
