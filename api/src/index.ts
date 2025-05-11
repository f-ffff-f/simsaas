import server from '@/server' // Fastify 서버 인스턴스
import dotenv from 'dotenv'
import path from 'path'
export { AppRouter } from '@/router'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

if (!process.env.PORT || !process.env.HOST) {
  throw new Error('PORT and HOST must be set')
}

const PORT = parseInt(process.env.PORT)
const HOST = process.env.HOST

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
