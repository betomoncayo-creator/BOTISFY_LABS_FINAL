'use client'

import { ReactNode, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UserContext, type UserContextType } from '@/lib/context'
import db from '@/lib/database'

export function UserContextProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [contextValue, setContextValue] = useState<UserContextType>({
    profile: null,
    loadingProfile: true,
  })
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const checkSession = async () => {
      try {
        const session = await db.getSession()
        
        if (!session) {
          router.replace('/login')
          return
        }

        const profileData = await db.getProfile(session.user.id)
        setContextValue({
          profile: profileData || { role: 'estudiante' },
          loadingProfile: false,
        })
      } catch (err) {
        console.error('Error fetching profile:', err)
        router.replace('/login')
      }
    }

    checkSession()
  }, [router])

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  )
}