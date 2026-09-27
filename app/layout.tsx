import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ComuniVisual AI',
  description: 'ERP inteligente para comunicação visual'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
