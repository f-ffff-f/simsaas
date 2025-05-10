// api/src/router.ts
import { router } from '@/trpc'
import { projectRouter } from '@/routers/project'
import { jobRouter } from '@/routers/job'
import { geometryRouter } from '@/routers/geometry'
import { meshRouter } from '@/routers/mesh'

// 여러 라우터들을 여기에 병합합니다.
// 결과: baseURL/trpc/...
export const appRouter = router({
  project: projectRouter, // 'project' 네임스페이스로 projectRouter를 마운트
  job: jobRouter, // 'job' 네임스페이스로 jobRouter를 마운트
  geometry: geometryRouter, // 'geometry' 네임스페이스로 geometryRouter 마운트
  mesh: meshRouter, // 'mesh' 네임스페이스로 meshRouter를 마운트
  // 예: health: publicProcedure.query(() => 'OK'), // 간단한 헬스 체크
})

// AppRouter의 타입을 export합니다. 클라이언트에서 이 타입을 사용합니다.
// prisma => router => appRouter => trpcClient => 클라이언트에서 통합된 타입 사용
export type AppRouter = typeof appRouter
