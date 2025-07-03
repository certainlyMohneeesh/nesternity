import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard - Nesternity',
  description: 'Administrative interface for Nesternity',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}