import { z } from 'zod'

export const createMeshInputSchema = z.object({
  geometryId: z
    .number()
    .int()
    .positive({ message: 'Geometry ID는 양의 정수여야 합니다.' }),
  resolution: z
    .number()
    .int()
    .min(1)
    .max(10, { message: '해상도는 1에서 10 사이의 정수여야 합니다.' }), // 예시: 해상도 레벨 (1~10)
  // 또는 resolution: z.enum(['LOW', 'MEDIUM', 'HIGH']) 등으로 정의 가능
})

export const listMeshesByGeometryInputSchema = z.object({
  geometryId: z
    .number()
    .int()
    .positive({ message: 'Geometry ID는 양의 정수여야 합니다.' }),
})

export const getMeshByIdInputSchema = z.object({
  meshId: z
    .number()
    .int()
    .positive({ message: 'Mesh ID는 양의 정수여야 합니다.' }),
})

export const deleteMeshInputSchema = z.object({
  meshId: z
    .number()
    .int()
    .positive({ message: 'Mesh ID는 양의 정수여야 합니다.' }),
})
