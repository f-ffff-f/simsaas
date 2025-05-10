import server from '@/server' // Fastify 서버 인스턴스
import dotenv from 'dotenv'

export { AppRouter } from './router'

const PORT = parseInt(dotenv.config().parsed?.PORT || '3001', 10)
const HOST = process.env.HOST || '0.0.0.0' // 모든 IP에서 접속 허용

const start = async () => {
  try {
    await server.listen({ port: PORT, host: HOST })
    server.log.info(`🚀 API server listening on http://${HOST}:${PORT}`)
    server.log.info(`💉 tRPC API ready at http://${HOST}:${PORT}/trpc`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
