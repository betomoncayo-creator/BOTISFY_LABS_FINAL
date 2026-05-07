// lib/database/index.ts
// SELECTOR AUTOMÁTICO: Elige el adaptador según DATABASE_PROVIDER

import { IDatabase } from './interface'
import { SupabaseAdapter } from './supabase-adapter'
// import { FirebaseAdapter } from './firebase-adapter'
// import { PostgreSQLAdapter } from './postgresql-adapter'

// Por defecto usa Supabase, pero puedes cambiar con variable de entorno
const DATABASE_PROVIDER = process.env.NEXT_PUBLIC_DATABASE_PROVIDER || 'supabase'

let db: IDatabase

// Aquí se selecciona el adaptador según la variable de entorno
if (DATABASE_PROVIDER === 'firebase') {
  // db = new FirebaseAdapter()
  throw new Error('Firebase adapter no está implementado aún')
} else if (DATABASE_PROVIDER === 'postgresql') {
  // db = new PostgreSQLAdapter()
  throw new Error('PostgreSQL adapter no está implementado aún')
} else if (DATABASE_PROVIDER === 'supabase') {
  db = new SupabaseAdapter()
} else {
  throw new Error(`Unknown DATABASE_PROVIDER: ${DATABASE_PROVIDER}`)
}

export default db