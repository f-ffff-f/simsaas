import { z } from 'zod'

export const createGeometryInputSchema = z.object({
  projectId: z
    .number()
    .int()
    .positive({ message: 'Project ID는 양의 정수여야 합니다.' }),
  fileUrl: z
    .string()
    .url({ message: '유효한 URL 형식이어야 합니다.' })
    .min(1, { message: '파일 URL을 입력해주세요.' }),
})

export const listGeometriesByProjectInputSchema = z.object({
  projectId: z
    .number()
    .int()
    .positive({ message: 'Project ID는 양의 정수여야 합니다.' }),
})

export const getGeometryByIdInputSchema = z.object({
  geometryId: z
    .number()
    .int()
    .positive({ message: 'Geometry ID는 양의 정수여야 합니다.' }),
})

export const deleteGeometryInputSchema = z.object({
  geometryId: z
    .number()
    .int()
    .positive({ message: 'Geometry ID는 양의 정수여야 합니다.' }),
})
