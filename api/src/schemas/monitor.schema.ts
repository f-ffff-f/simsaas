import { z } from 'zod'
// Prisma 클라이언트에서 JobStatus enum을 가져옵니다.
// 프로젝트 구조에 따라 경로가 다를 수 있습니다. (예: '@prisma/client' 또는 상대 경로)
import { JobStatus } from '@prisma/client' // PENDING, RUNNING, FAILED, SUCCESS

// BullMQ 작업 상태 문자열 배열입니다.
export const bullMQJobStatuses = [
  'completed',
  'waiting',
  'active',
  'delayed',
  'failed',
  'paused', // BullMQ v5+
  'waiting-children', // BullMQ v5+
] as const
export type BullMQJobStatus = (typeof bullMQJobStatuses)[number]

// 작업 데이터 스키마입니다. 현재 프로젝트에서는 meshId만 포함합니다.
// JobListJob에서 사용됩니다.
export const jobDataSchema = z.object({
  meshId: z.string(),
})

// CLI 목록 표시에 사용할 간결한 Job 정보 스키마
export const jobListJobSchema = z.object({
  id: z.string(), // BullMQ Job ID
  name: z.string(),
  status: z.nativeEnum(JobStatus),
  createdAt: z.number(),
  meshId: z.string().optional(),
})
export type JobListJob = z.infer<typeof jobListJobSchema>

// getJobList 쿼리의 입력 스키마
export const getJobListInputSchema = z
  .object({
    // 상태 필터링: 선택 사항, 없으면 모든 주요 상태 조회
    statuses: z.array(z.enum(bullMQJobStatuses)).optional(),
    start: z.number().int().min(0).optional().default(0),
    end: z.number().int().min(0).optional().default(19), // 기본적으로 20개 조회
    asc: z.boolean().optional().default(false), // 기본: 최신 작업 먼저 (내림차순)
  })
  .default({}) // 입력이 없을 경우 빈 객체를 기본값으로 사용
export type GetJobListInput = z.infer<typeof getJobListInputSchema>

// getJobLogs 관련 스키마 (로그 기능이 필요하다면 유지, 아니면 제거)
export const getJobLogsInputSchema = z.object({
  jobId: z.string(),
  start: z.number().optional(),
  end: z.number().optional(),
})

export const jobLogsSchema = z.object({
  logs: z.array(z.string()),
  count: z.number(),
})
export type JobLogs = z.infer<typeof jobLogsSchema>
