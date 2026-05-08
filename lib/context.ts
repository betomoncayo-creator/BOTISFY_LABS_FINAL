'use client'
import { createContext } from 'react'
import db from './database'

// Contexto de usuario
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

// Funciones auxiliares
export async function getSession() {
  return await db.getSession()
}

export async function getCurrentUser() {
  return await db.getCurrentUser()
}

export async function getProfile(userId: string) {
  return await db.getProfile(userId)
}