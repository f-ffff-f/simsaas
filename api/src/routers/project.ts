// api/src/routers/project.ts
import { z } from 'zod'
import { publicProcedure, router } from '@/trpc'

export const projectRouter = router({
  // 프로젝트 생성 뮤테이션
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, { message: 'Project name cannot be empty' }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 컨텍스트(ctx)를 통해 Prisma Client에 접근
      const newProject = await ctx.prisma.project.create({
        data: {
          name: input.name,
        },
      })
      return newProject
    }),

  // 프로젝트 목록 조회 쿼리
  list: publicProcedure.query(async ({ ctx }) => {
    const projects = await ctx.prisma.project.findMany({
      include: {
        geometries: true, // relation 추가
      },
    })
    return projects
  }),
})
