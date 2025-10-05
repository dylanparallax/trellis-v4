'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import remarkGfm from 'remark-gfm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import LoadingAnimation from '@/components/ui/loading-animation'
import Link from 'next/link'

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })

export default function GuidePage() {
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const res = await fetch('/userGuide.md', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load guide')
        const text = await res.text()
        if (isMounted) setContent(text)
      } catch {
        if (isMounted) setError('Unable to load guide. Please try again later.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    })()
    return () => { isMounted = false }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button asChild variant="ghost" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Guide</CardTitle>
          <CardDescription>Quick walkthrough of features and workflows</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoadingAnimation label="Loading guide" size={24} />
              Loading guide…
            </div>
          ) : error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : (
            <div className="prose max-w-none prose-headings:scroll-mt-24">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


