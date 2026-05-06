import type { Metadata } from 'next'
import './globals.css'
import React from 'react'

export const metadata: Metadata = {
  title: 'Botisfy Labs - Neural Academy',
  description: 'Learning Management System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        
        {/* 🔄 LOADING ÚNICO Y LIMPIO */}
        <style>{`
          .app-init-loader {
            position: fixed;
            inset: 0;
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #000000;
            z-index: 9999;
          }

          .app-init-loader.active {
            display: flex;
          }

          .app-init-loader__logo {
            width: 120px;
            height: 120px;
            margin-bottom: 40px;
            opacity: 0.9;
          }

          .app-init-loader__dots {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
          }

          .dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #00E5FF;
            animation: bounce 1.4s infinite ease-in-out;
          }

          .dot:nth-child(1) {
            animation-delay: -0.32s;
          }

          .dot:nth-child(2) {
            animation-delay: -0.16s;
          }

          .dot:nth-child(3) {
            animation-delay: 0s;
          }

          @keyframes bounce {
            0%, 80%, 100% {
              opacity: 0.3;
              transform: scale(1);
            }
            40% {
              opacity: 1;
              transform: scale(1.2);
            }
          }

          .app-init-loader__text {
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 0.3em;
            color: #00E5FF;
            text-transform: uppercase;
          }
        `}</style>
      </body>
    </html>
  )
}