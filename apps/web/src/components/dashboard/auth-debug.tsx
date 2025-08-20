'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function AuthDebug() {
  const [authState, setAuthState] = useState<{
    hasSession: boolean
    cookies: string[]
    localStorage: string[]
    sessionStorage: string[]
    error?: string
  } | null>(null)

  const [isLoading, setIsLoading] = useState(false)

  const checkAuth = async () => {
    setIsLoading(true)
    try {
      // Check for Supabase cookies
      const cookies = document.cookie.split(';').map(c => c.trim())
      const supabaseCookies = cookies.filter(c => c.startsWith('sb-'))
      
      // Check localStorage and sessionStorage
      const localStorage = Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('auth'))
      const sessionStorage = Object.keys(sessionStorage).filter(k => k.includes('supabase') || k.includes('auth'))
      
      // Try to get session from API
      const response = await fetch('/api/me')
      const hasSession = response.ok
      
      setAuthState({
        hasSession,
        cookies: supabaseCookies,
        localStorage,
        sessionStorage,
      })
    } catch (error) {
      setAuthState({
        hasSession: false,
        cookies: [],
        localStorage: [],
        sessionStorage: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearAuth = () => {
    // Clear all Supabase-related storage
    const cookies = document.cookie.split(';').map(c => c.trim())
    cookies.forEach(cookie => {
      if (cookie.startsWith('sb-')) {
        const name = cookie.split('=')[0]
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      }
    })
    
    // Clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key)
      }
    })
    
    // Clear sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        sessionStorage.removeItem(key)
      }
    })
    
    // Refresh the page
    window.location.reload()
  }

  useEffect(() => {
    checkAuth()
  }, [])

  if (!authState) {
    return <div>Loading auth debug info...</div>
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Authentication Debug
          <div className="flex gap-2">
            <Button onClick={checkAuth} disabled={isLoading} size="sm">
              {isLoading ? 'Checking...' : 'Refresh'}
            </Button>
            <Button onClick={clearAuth} variant="destructive" size="sm">
              Clear Auth
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">Session Status:</span>
          <Badge variant={authState.hasSession ? 'default' : 'destructive'}>
            {authState.hasSession ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        
        {authState.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <span className="text-red-800 text-sm">Error: {authState.error}</span>
          </div>
        )}
        
        <div>
          <h4 className="font-medium mb-2">Supabase Cookies ({authState.cookies.length}):</h4>
          {authState.cookies.length > 0 ? (
            <div className="space-y-1">
              {authState.cookies.map((cookie, i) => (
                <div key={i} className="text-sm bg-gray-50 p-2 rounded border">
                  {cookie}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No Supabase cookies found</p>
          )}
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Local Storage ({authState.localStorage.length}):</h4>
          {authState.localStorage.length > 0 ? (
            <div className="space-y-1">
              {authState.localStorage.map((key, i) => (
                <div key={i} className="text-sm bg-gray-50 p-2 rounded border">
                  {key}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No auth-related localStorage found</p>
          )}
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Session Storage ({authState.sessionStorage.length}):</h4>
          {authState.sessionStorage.length > 0 ? (
            <div className="space-y-1">
              {authState.sessionStorage.map((key, i) => (
                <div key={i} className="text-sm bg-gray-50 p-2 rounded border">
                  {key}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No auth-related sessionStorage found</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
