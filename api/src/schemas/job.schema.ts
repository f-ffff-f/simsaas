import { z } from 'zod'
import { JobStatus } from '@prisma/client'

export const JobStatusEnum = z.nativeEnum(JobStatus)

export const submitJobInputSchema = z.object({
  meshId: z.number().int().positive(),
})

export const getJobStatusInputSchema = z.object({
  jobId: z.number().int().positive(),
})

export const getListJobsInputSchema = z.object({
  status: JobStatusEnum.optional(),
  limit: z.number().int().positive().optional(),
})
