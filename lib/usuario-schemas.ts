import { z } from 'zod'

// Schema para validar usuarios
export const usuarioSchema = z.object({
  full_name: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase(),
  
  role: z
    .enum(['admin', 'estudiante'], {
      errorMap: () => ({ message: 'El rol debe ser "admin" o "estudiante"' })
    }),
  
  avatar_url: z
    .string()
    .url('URL de avatar inválida')
    .optional()
    .or(z.literal('')),
})

// Schema para crear usuario (con password)
export const crearUsuarioSchema = usuarioSchema.extend({
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña es demasiado larga'),
})

// Schema para editar usuario (password opcional)
export const editarUsuarioSchema = usuarioSchema

// Tipos TypeScript
export type Usuario = z.infer<typeof usuarioSchema>
export type CrearUsuario = z.infer<typeof crearUsuarioSchema>
export type EditarUsuario = z.infer<typeof editarUsuarioSchema>

// Helper para validar datos
export function validarUsuario<T>(schema: z.ZodSchema<T>, data: unknown) {
  try {
    const validado = schema.parse(data)
    return { success: true, data: validado }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Error de validación' }
    }
    return { success: false, error: 'Error desconocido' }
  }
}