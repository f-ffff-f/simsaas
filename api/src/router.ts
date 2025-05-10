// api/src/router.ts
import { router } from '@/trpc'
import { projectRouter } from '@/routers/project'

// 여러 라우터들을 여기에 병합합니다.
export const appRouter = router({
  project: projectRouter, // 'project' 네임스페이스로 projectRouter를 마운트
  // 예: health: publicProcedure.query(() => 'OK'), // 간단한 헬스 체크
})

// AppRouter의 타입을 export합니다. 클라이언트에서 이 타입을 사용합니다.
export type AppRouter = typeof appRouter
