'use client'

import { useEffect } from 'react'
import Link from 'next/link'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('Unhandled application error:', error)
  }, [error])

  const isProd = process.env.NODE_ENV === 'production'

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-lg w-full space-y-4 text-center">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            {isProd ? (
              <>
                <p className="text-muted-foreground">
                  An unexpected error occurred while loading the page.
                </p>
                {error?.digest && (
                  <p className="text-xs text-muted-foreground">Error digest: {error.digest}</p>
                )}
              </>
            ) : (
              <>
                <pre className="text-left whitespace-pre-wrap text-sm bg-muted p-3 rounded-md overflow-auto">
                  {String(error?.stack || error?.message || 'Unknown error')}
                </pre>
                {error?.digest && (
                  <p className="text-xs text-muted-foreground">Error digest: {error.digest}</p>
                )}
              </>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => reset()}
                className="px-4 py-2 rounded-md border"
              >
                Try again
              </button>
              <Link href="/" className="px-4 py-2 rounded-md border">
                Go home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}


