'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'


export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/login')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <div className="inline-block">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-cyan-500 rounded-full animate-spin" />
        </div>
        <p className="text-zinc-400 text-sm mt-4 font-medium">Redirigiendo...</p>
      </div>
    </div>
  )
}