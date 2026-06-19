import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Image Resizer',
  description: 'Resize images with cover and contain strategies',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
