'use client'
import { createContext, useEffect, useState, ReactNode } from 'react'
import db from '../lib/database/index'

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
  [key: string]: any
}

interface UserContextType {
  profile: UserProfile | null
  loading: boolean
}

export const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserContextProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const session = await db.getSession()
        if (session) {
          const userProfile = await db.getProfile(session.user.id)
          setProfile(userProfile)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  return (
    <UserContext.Provider value={{ profile, loading }}>
      {children}
    </UserContext.Provider>
  )
}