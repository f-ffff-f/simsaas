import {
  BullMQJobStatus,
  getJobListInputSchema,
  getJobLogsInputSchema,
  jobDataSchema,
  JobListJob,
  jobListJobSchema,
  jobLogsSchema,
} from '@/schemas/monitor.schema'
import { publicProcedure, router } from '@/trpc'
import { JobStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import type { Job as BullMQJob } from 'bullmq'
import { z } from 'zod'

// BullMQ Job 객체를 Prisma JobStatus enum으로 변환하는 헬퍼 함수
async function getPrismaJobStatus(job: BullMQJob): Promise<JobStatus> {
  const state = await job.getState()
  switch (state) {
    case 'completed':
      return JobStatus.SUCCESS
    case 'failed':
      return JobStatus.FAILED
    case 'active':
      return JobStatus.RUNNING
    case 'waiting':
    case 'waiting-children':
    case 'delayed':
      return JobStatus.PENDING
    default:
      console.warn(
        `Unknown BullMQ job state: ${state} for job ID ${job.id}. Mapping to PENDING.`
      )
      return JobStatus.PENDING
  }
}

// BullMQ Job 객체를 JobListJob (목록 표시용) 타입으로 변환하는 헬퍼 함수
async function bullMQJobToJobListJob(
  job: BullMQJob | null | undefined
): Promise<JobListJob | null> {
  if (!job || !job.id || !job.timestamp) return null // ID나 timestamp가 없는 경우 목록에서 제외

  const status = await getPrismaJobStatus(job)
  const validatedData = jobDataSchema.safeParse(job.data)

  return {
    id: job.id,
    name: job.name,
    status: status,
    createdAt: job.timestamp, // 생성 시간 (epoch ms)
    meshId: validatedData.success ? validatedData.data.meshId : undefined,
  }
}

export const monitorRouter = router({
  // 작업 목록 조회
  getJobList: publicProcedure
    .input(getJobListInputSchema) // 새로운 입력 스키마 사용
    .output(z.array(jobListJobSchema.nullable())) // 새로운 출력 스키마 사용
    .query(async ({ input, ctx }) => {
      const { statuses, start = 0, end = 19, asc = false } = input

      // statuses가 제공되지 않으면 기본 상태 목록 사용 (예: 활성, 대기, 실패)
      const targetStatuses =
        statuses && statuses.length > 0
          ? statuses
          : ([
              'active',
              'waiting',
              'failed',
              'delayed',
              'paused',
              'waiting-children',
            ] as BullMQJobStatus[]) // 기본 상태 목록

      try {
        const jobs = await ctx.simSaaSJobQueue.getJobs(
          targetStatuses,
          start,
          end,
          asc
        )
        // 목록용 헬퍼 함수 사용 및 null 값 필터링
        const jobList = await Promise.all(
          jobs.map(job => bullMQJobToJobListJob(job))
        )
        return jobList.filter((job): job is JobListJob => job !== null) // null이 아닌 작업만 반환
      } catch (error) {
        console.error(
          `Failed to get job list for statuses [${targetStatuses.join(', ')}]:`,
          error
        )
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve job list.',
        })
      }
    }),

  // 작업 로그 조회
  getJobLogs: publicProcedure
    .input(getJobLogsInputSchema)
    .output(jobLogsSchema)
    .query(async ({ input, ctx }) => {
      const { jobId, start, end } = input
      try {
        const logs = await ctx.simSaaSJobQueue.getJobLogs(jobId, start, end)
        return logs
      } catch (error) {
        console.error(`Failed to get job logs for ID ${jobId}:`, error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve job logs.',
        })
      }
    }),
})

export type MonitorRouter = typeof monitorRouter
