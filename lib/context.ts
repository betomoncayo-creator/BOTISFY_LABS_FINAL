import { createContext } from 'react'

// Definimos un valor por defecto seguro en lugar de null
export const UserContext = createContext<any>({
  profile: null,
  loadingProfile: true,
  logout: () => {}
})