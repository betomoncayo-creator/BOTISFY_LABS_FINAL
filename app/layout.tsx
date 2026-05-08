import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Botisfy Labs',
  description: 'LMS Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}