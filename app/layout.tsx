import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sanctuary',
  description: 'Survive the apocalypse. Protect your citizens.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}