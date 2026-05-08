'use client'

import { createContext } from 'react'

export interface UserContextType {
  profile: any
  loadingProfile: boolean
}

export const UserContext = createContext<UserContextType>({
  profile: null,
  loadingProfile: false,
})