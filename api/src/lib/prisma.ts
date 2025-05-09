import { PrismaClient } from '@prisma/client'

// Prisma Client 인스턴스를 생성합니다.
// 애플리케이션 전체에서 이 인스턴스를 재사용하는 것이 좋습니다.
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

export default prisma
