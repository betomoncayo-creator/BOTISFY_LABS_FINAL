import { redirect } from 'next/navigation'

export default function Home() {
  // CORRECCIÓN: Ahora manda siempre a la raíz del dashboard
  redirect('/dashboard')
}