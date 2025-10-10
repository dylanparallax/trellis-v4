import { getAuthContext } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { RAGSearchInterface } from '@/components/rag/search-interface'
import { EmbeddingManager } from '@/components/rag/embedding-manager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Search, Database, Brain, Shield, TrendingUp } from 'lucide-react'

export default async function RAGPage() {
  const authContext = await getAuthContext()
  
  if (!authContext) {
    redirect('/login')
  }

  // Only allow ADMIN and DISTRICT_ADMIN to access RAG features
  if (!['ADMIN', 'DISTRICT_ADMIN'].includes(authContext.role)) {
    redirect('/dashboard')
  }

  const isDistrictAdmin = authContext.role === 'DISTRICT_ADMIN'

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">RAG Knowledge System</h1>
              <p className="text-muted-foreground">
                AI-powered search and insights across {isDistrictAdmin ? 'district' : 'school'} observations and evaluations
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {authContext.role}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {isDistrictAdmin ? 'District-wide' : 'School-wide'} Access
            </Badge>
          </div>
        </div>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-600" />
              Semantic Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Search through observations and evaluations using natural language queries to find relevant insights and patterns.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              AI Chat Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get AI-powered insights and recommendations based on your educational data through an interactive chat interface.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-green-600" />
              Knowledge Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access a comprehensive knowledge base built from your {isDistrictAdmin ? 'district\'s' : 'school\'s'} observation and evaluation data.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Interface */}
      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search & Explore
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Manage Embeddings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <RAGSearchInterface />
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <EmbeddingManager 
            userRole={authContext.role as 'ADMIN' | 'DISTRICT_ADMIN'}
            schoolId={authContext.schoolId}
          />
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            Getting Started with RAG
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Search Tips:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Use natural language queries like "classroom management strategies"</li>
                <li>• Search for specific teaching practices or student behaviors</li>
                <li>• Look for trends across subjects or grade levels</li>
                <li>• Filter by content type and relevance threshold</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">AI Chat Examples:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• "What are the most effective questioning techniques?"</li>
                <li>• "Show me trends in student engagement strategies"</li>
                <li>• "What areas need the most improvement?"</li>
                <li>• "Compare teaching practices across different subjects"</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-3 border-t border-blue-200">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> The system uses AI embeddings to understand the semantic meaning of your content. 
              Make sure to generate embeddings for your observations and evaluations in the "Manage Embeddings" tab 
              to get the best search results.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}