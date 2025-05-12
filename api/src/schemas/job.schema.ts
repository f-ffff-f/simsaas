import { z } from 'zod'

export const submitJobInputSchema = z.object({
  meshId: z.number().int().positive(),
})

export const getJobStatusInputSchema = z.object({
  jobId: z.number().int().positive(),
})
