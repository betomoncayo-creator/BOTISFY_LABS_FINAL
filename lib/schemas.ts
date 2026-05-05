import { z } from 'zod'

// ✅ Schema para crear/editar curso
export const courseSchema = z.object({
  title: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .trim(),
  description: z
    .string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional()
    .default('Sin descripción'),
})

export type CourseInput = z.infer<typeof courseSchema>

// ✅ Schema para login
export const loginSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export type LoginInput = z.infer<typeof loginSchema>

// ✅ Schema para crear usuario
export const userSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  full_name: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  role: z
    .enum(['admin', 'estudiante', 'instructor'], {
      errorMap: () => ({ message: 'Rol inválido' })
    }),
})

export type UserInput = z.infer<typeof userSchema>

// ✅ Helper function para validar
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean
  data?: T
  error?: string
} => {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]?.message || 'Error de validación'
      return { success: false, error: firstError }
    }
    return { success: false, error: 'Error desconocido' }
  }
}