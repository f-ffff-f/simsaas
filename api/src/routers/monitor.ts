import {
  bullMQJobStatuses,
  getJobListInputSchema,
  getJobLogsInputSchema,
  jobDataSchema,
  JobListJob,
  jobListJobSchema,
  jobLogsSchema,
} from '@/schemas/monitor.schema'
import { publicProcedure, router } from '@/trpc'
import { TRPCError } from '@trpc/server'
import type { Job as BullMQJob, JobState } from 'bullmq'
import { z } from 'zod'

// BullMQ Job 객체를 JobListJob (목록 표시용) 타입으로 변환하는 헬퍼 함수
async function bullMQJobToJobListJob(
  job: BullMQJob | null | undefined
): Promise<JobListJob | null> {
  if (!job || !job.id || !job.timestamp) return null // ID나 timestamp가 없는 경우 목록에서 제외

  const state = (await job.getState()) as JobState
  const validatedData = jobDataSchema.safeParse(job.data)

  return {
    id: job.id,
    name: job.name,
    state: state,
    createdAt: job.timestamp, // 생성 시간 (epoch ms)
    meshId: validatedData.success ? validatedData.data.meshId : undefined,
  }
}

export const monitorRouter = router({
  // 작업 목록 조회
  getJobList: publicProcedure
    .input(getJobListInputSchema)
    .output(z.array(jobListJobSchema))
    .query(async ({ input, ctx }) => {
      const { start = 0, end = 19, asc = true } = input

      try {
        const jobs = await ctx.simSaaSJobQueue.getJobs(
          bullMQJobStatuses,
          start,
          end,
          asc
        )
        // 목록용 헬퍼 함수 사용 및 null 값 필터링
        const jobList = await Promise.all(
          jobs.map(job => bullMQJobToJobListJob(job))
        )

        // null이 아닌 작업만 필터링하고 생성 날짜(createdAt)를 기준으로 내림차순 정렬
        const filteredList = jobList.filter(
          (job: JobListJob | null) => job !== null
        ) as JobListJob[]

        filteredList.sort((a, b) => {
          const dateA = a.createdAt || 0
          const dateB = b.createdAt || 0
          return dateB - dateA
        })

        return filteredList
      } catch (error) {
        console.error(
          `Failed to get job list for states [${bullMQJobStatuses.join(
            ', '
          )}]:`,
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
