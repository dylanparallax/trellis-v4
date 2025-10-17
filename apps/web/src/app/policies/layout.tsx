import type { ReactNode } from 'react'

export const metadata = {
  title: 'Policies – Trellis LLC',
  description: 'Privacy, security, data processing, and accessibility policies for Trellis LLC.',
}

export default function PoliciesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full">
      <header className="border-b bg-white/60 dark:bg-black/40 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/40">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <h1 className="text-2xl font-semibold tracking-tight">Policies</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Privacy, security, data processing, and accessibility for Trellis LLC.</p>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10">
        {children}
      </main>
    </div>
  )
}


