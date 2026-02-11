import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MistakeTracker } from '@/components/analytics/mistake-tracker';
import { CustomMistakeManager } from '@/components/mistakes/custom-mistake-manager';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingDown, AlertCircle, Lightbulb } from 'lucide-react';

export default async function MistakesPage() {
  const session = await auth();
  
  if (!session?.userId) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Mistake Analytics</h1>
        </div>
        <p className="text-muted-foreground">
          Track and analyze your trading mistakes to improve performance and avoid repeated errors.
        </p>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingDown className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="font-semibold mb-2">Reduce Frequency</h3>
            <p className="text-sm text-muted-foreground">
              Track mistake patterns to identify and reduce recurring errors
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h3 className="font-semibold mb-2">Impact Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Understand the financial impact of different mistake types
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-blue-500" />
            <h3 className="font-semibold mb-2">Learning Insights</h3>
            <p className="text-sm text-muted-foreground">
              Build prevention strategies and track improvement over time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Manage Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <Suspense 
            fallback={
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading mistake analytics...</p>
                </CardContent>
              </Card>
            }
          >
            <MistakeTracker userId={session.userId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <CustomMistakeManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Learning Tips */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Mistake Tracking Best Practices
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">When to Track</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Right after closing a losing trade</li>
                <li>• When you notice emotional decision-making</li>
                <li>• After breaking your trading rules</li>
                <li>• When you miss a good setup due to hesitation</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Effective Documentation</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Be specific about what went wrong</li>
                <li>• Include emotional state and market context</li>
                <li>• Write learning points while fresh in memory</li>
                <li>• Create actionable prevention strategies</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}