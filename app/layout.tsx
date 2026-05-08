import type { Metadata } from 'next'
import './globals.css'
import React from 'react'
import { UserContextProvider } from '../components/UserContext'

export const metadata: Metadata = {
  title: 'Botisfy Labs - Neural Academy',
  description: 'Learning Management System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <UserContextProvider>
          {children}
        </UserContextProvider>
      </body>
    </html>
  )
}