import { z } from 'zod'

export const submitProjectInputSchema = z.object({
  name: z.string().min(1, { message: 'Project name cannot be empty' }),
})
