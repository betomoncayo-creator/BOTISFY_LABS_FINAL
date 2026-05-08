import db from './database'

export async function getSession() {
  return await db.getSession()
}

export async function getCurrentUser() {
  return await db.getCurrentUser()
}

export async function getProfile(userId: string) {
  return await db.getProfile(userId)
}