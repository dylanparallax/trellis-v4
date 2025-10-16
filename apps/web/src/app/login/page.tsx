'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
// Note: Avoid importing Supabase at module scope to prevent pre-login initialization

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setInfo('')

    try {
      const { supabase, isSupabaseConfigured } = await import('@/lib/auth/supabase')
      if (!isSupabaseConfigured) {
        setError('Authentication is not configured. Please contact support.')
        return
      }
      // Clear any stale auth cookies to avoid bad session state
      try {
        document.cookie = 'sb-access-token=; Max-Age=0; path=/'
        document.cookie = 'sb-refresh-token=; Max-Age=0; path=/'
      } catch {}

      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
      const isRateLimit = (err: unknown) => {
        const msg = (err as { message?: string; status?: number } | null)?.message?.toLowerCase() || ''
        const status = (err as { status?: number } | null)?.status
        return status === 429 || msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('over_request_rate_limit')
      }

      const MAX_ATTEMPTS = 5
      let attempt = 0
      let lastError: string | null = null
      while (attempt < MAX_ATTEMPTS) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (!error && data.session) {
          // Ensure server cookies are set via callback
          await fetch('/api/auth/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token } })
          }).catch(() => {})
          // Success
          setInfo('')
          router.push('/dashboard')
          return
        }
        if (error && isRateLimit(error)) {
          const backoffMs = Math.min(30000, 1000 * 2 ** attempt)
          setInfo(`Rate limited. Retrying in ${Math.round(backoffMs / 1000)}s…`)
          await sleep(backoffMs)
          attempt += 1
          lastError = error.message
          continue
        }
        if (error) {
          setError(error.message)
          return
        }
        break
      }
      if (lastError) {
        setError(lastError)
        return
      }
      if (!lastError) {
        setError('Login failed. Try again.')
      }
    } catch {
      setError('Login failed. Check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md border-none">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Trellis</CardTitle>
          <CardDescription>
            Sign in to access your teacher feedback dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
            {!error && info && (
              <div className="text-sm text-blue-600 bg-blue-100 p-3 rounded-md">
                {info}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <a href="/signup" className="underline">Create one</a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 