// api/src/routers/job.ts
import { publicProcedure, router } from '@/trpc'
import {
  submitJobInputSchema,
  getJobStatusInputSchema,
} from '@/schemas/job.schema'
import { JobStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'

export const jobRouter = router({
  /**
   * 새로운 작업을 생성하고 백그라운드 처리를 위해 큐에 넣습니다.
   */
  submit: publicProcedure
    .input(submitJobInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { meshId } = input

      // 1. Mesh 존재 여부 확인
      const mesh = await ctx.prisma.mesh.findUnique({
        where: { id: meshId },
      })

      if (!mesh) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Mesh with ID ${meshId} not found.`,
        })
      }

      // 2. DB에 Job 레코드 생성 (상태: PENDING)
      console.log(`[job.submit] meshId: ${meshId}`)
      const newDbJob = await ctx.prisma.job.create({
        data: {
          meshId: meshId,
          status: JobStatus.PENDING, // 초기 상태
        },
      })

      try {
        console.log(`[job.submit] newDbJob: ${newDbJob}`)
        // 3. BullMQ 큐에 작업 추가
        //    Job 이름은 Worker에서 처리할 작업의 종류를 나타냅니다.
        //    Job 데이터에는 Worker가 작업을 수행하는 데 필요한 정보를 전달합니다.
        //    여기서는 dbJobId와 meshId를 전달합니다.
        const jobName = 'processMesh' // Worker에서 이 이름으로 작업을 식별
        const jobData = {
          dbJobId: newDbJob.id.toString(), // BigInt를 string으로 변환
          meshId: newDbJob.meshId,
        }
        console.log(`[job.submit] jobData: ${jobData}`)

        // BullMQ 작업 ID를 Prisma Job ID와 동기화 (문자열로 변환)
        const bullJobIdWithPrefix = `job_${newDbJob.id.toString()}`

        // 새 작업을 Redis 큐에 등록하여 백그라운드 처리를 예약하고, 이 등록이 성공할 때까지 기다립니다.
        // 작업이 Redis에 성공적으로 저장되면, BullMQ Worker가 이를 감지하여 비동기적으로 후속 처리합니다.
        await ctx.simSaaSJobQueue.add(jobName, jobData, {
          jobId: bullJobIdWithPrefix,
        })

        console.log(
          `Job ${newDbJob.id} (BullMQ ID: ${bullJobIdWithPrefix}) of type '${jobName}' added to the queue.`
        )

        return {
          message: 'Job submitted and queued successfully.',
          jobId: newDbJob.id.toString(), // 클라이언트에는 string으로 반환
          meshId: meshId,
          bullMQJobId: bullJobIdWithPrefix,
          currentStatus: newDbJob.status,
        }
      } catch (error) {
        console.error(`Failed to add job ${newDbJob.id} to BullMQ:`, error)
        await ctx.prisma.job.update({
          where: { id: newDbJob.id },
          data: { status: JobStatus.FAILED }, // FAILED로 간단히 처리
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to queue the job. The job was marked as FAILED.',
          cause: error,
        })
      }
    }),

  /**
   * 특정 작업 ID의 현재 상태 및 정보를 조회합니다.
   */
  getStatus: publicProcedure
    .input(getJobStatusInputSchema)
    .query(async ({ input, ctx }) => {
      const { jobId } = input
      let jobRecordId: bigint
      try {
        jobRecordId = BigInt(jobId)
      } catch (e) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid Job ID format.',
        })
      }

      const job = await ctx.prisma.job.findUnique({
        where: {
          id: jobRecordId,
        },
        include: {
          result: true,
          mesh: {
            include: {
              geometry: {
                include: {
                  project: true,
                },
              },
            },
          },
        },
      })

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Job with ID ${jobId} not found.`,
        })
      }

      return {
        ...job,
        id: job.id.toString(),
        result: job.result
          ? {
              ...job.result,
              id: job.result.id.toString(),
              jobId: job.result.jobId.toString(),
            }
          : null,
      }
    }),

  /**
   * 작업 목록을 조회합니다.
   */
  list: publicProcedure.query(async ({ ctx }) => {
    const jobs = await ctx.prisma.job.findMany({
      orderBy: {
        id: 'desc',
      },
      include: {
        mesh: {
          select: {
            id: true,
            resolution: true,
            geometryId: true,
          },
        },
        result: {
          select: {
            fileUrl: true,
          },
        },
      },
      take: 50,
    })

    // BigInt 필드를 string으로 변환
    return jobs.map(job => ({
      ...job,
      id: job.id.toString(),
      result: job.result
        ? {
            ...job.result,
          }
        : null,
    }))
  }),
})
