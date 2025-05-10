import { publicProcedure, router } from '@/trpc'
import {
  submitJobInputSchema,
  getJobStatusInputSchema,
  //   getListJobsInputSchema,
} from '@/schemas/job.schema'
import { JobStatus } from '@prisma/client'

export const jobRouter = router({
  /**
   * 새로운 시뮬레이션 작업을 제출(생성)합니다.
   * 초기에는 DB에 Job 레코드만 PENDING 상태로 생성합니다.
   * 추후 BullMQ와 연동하여 실제 작업을 큐에 넣도록 수정될 예정입니다.
   */
  submit: publicProcedure
    .input(submitJobInputSchema) // 입력 유효성 검사
    .mutation(async ({ input, ctx }) => {
      const { meshId } = input

      const mesh = await ctx.prisma.mesh.findUnique({
        where: {
          id: meshId,
        },
      })
      if (!mesh) {
        throw new Error('Mesh not found')
      }

      const newJob = await ctx.prisma.job.create({
        data: {
          meshId: meshId,
          status: JobStatus.PENDING, // Prisma 스키마의 JobStatus enum 값 사용
          // startedAt, finishedAt 등은 작업이 실제로 시작/종료될 때 업데이트됩니다.
        },
      })
      return newJob
    }),

  /**
   * 특정 작업 ID의 현재 상태 및 정보를 조회합니다.
   */
  getStatus: publicProcedure
    .input(getJobStatusInputSchema) // 입력 유효성 검사
    .query(async ({ input, ctx }) => {
      const { jobId } = input

      const job = await ctx.prisma.job.findUnique({
        where: {
          id: BigInt(jobId), // Prisma에서 BigInt ID를 조회할 때는 BigInt로 변환
        },
        // 필요하다면 include를 사용하여 관련된 Mesh 정보 등을 함께 가져올 수 있습니다.
        // include: {
        //   mesh: true,
        // }
      })

      if (!job) {
        throw new Error('Job not found')
      }

      return job
    }),

  /**
   * 작업 목록을 조회합니다.
   */
  list: publicProcedure
    // .input(getListJobsInputSchema)
    .query(async ({ input, ctx }) => {
      // const { status, limit } = input || {}; // 입력값이 있다면 사용
      const jobs = await ctx.prisma.job.findMany({
        // where: {
        //   ...(status && { status }),
        // },
        // take: limit || 10, // 기본적으로 최근 10개 등
        orderBy: {
          id: 'desc', // 최근 작업부터 보여주기
        },
      })
      return jobs
    }),
})
