'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Target, Timer, Settings } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { cn } from '@/lib/utils';
import { MistakeAnalytics, MistakeTrend, MistakeCategoryEnum } from '@/types/mistake';

interface MistakeTrackerProps {
  userId: string;
  className?: string;
}

const CATEGORY_COLORS = {
  [MistakeCategoryEnum.EMOTIONAL]: '#ef4444',
  [MistakeCategoryEnum.RISK_MANAGEMENT]: '#f97316',
  [MistakeCategoryEnum.STRATEGY]: '#eab308',
  [MistakeCategoryEnum.TIMING]: '#22c55e',
  [MistakeCategoryEnum.TECHNICAL]: '#3b82f6',
  [MistakeCategoryEnum.CUSTOM]: '#8b5cf6'
};

const CATEGORY_ICONS = {
  [MistakeCategoryEnum.EMOTIONAL]: Brain,
  [MistakeCategoryEnum.RISK_MANAGEMENT]: AlertTriangle,
  [MistakeCategoryEnum.STRATEGY]: Target,
  [MistakeCategoryEnum.TIMING]: Timer,
  [MistakeCategoryEnum.TECHNICAL]: Settings,
  [MistakeCategoryEnum.CUSTOM]: Brain
};

export function MistakeTracker({ userId, className }: MistakeTrackerProps) {
  const [analytics, setAnalytics] = useState<MistakeAnalytics | null>(null);
  const [trends, setTrends] = useState<MistakeTrend[]>([]);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    loadTrends();
  }, [userId, timeframe]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/analytics/mistakes?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to load mistake analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrends = async () => {
    try {
      const response = await fetch(`/api/analytics/mistakes/trends?userId=${userId}&timeframe=${timeframe}&periods=12`);
      if (response.ok) {
        const data = await response.json();
        setTrends(data.trends || []);
      }
    } catch (error) {
      console.error('Failed to load mistake trends:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex justify-center py-12", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No mistake data available</p>
          <p className="text-sm text-muted-foreground mt-2">
            Start tracking mistakes to see analytics
          </p>
        </CardContent>
      </Card>
    );
  }

  const improvementTrend = trends.length > 1 ? 
    trends[trends.length - 1].mistakeRate - trends[trends.length - 2].mistakeRate : 0;

  const categoryData = Object.entries(analytics.mistakesByCategory)
    .map(([category, count]) => ({
      category,
      count,
      color: CATEGORY_COLORS[category as MistakeCategoryEnum] || '#8b5cf6'
    }))
    .filter(item => item.count > 0);

  const severityData = Object.entries(analytics.mistakesBySeverity)
    .map(([severity, count]) => ({
      severity,
      count,
      color: severity === 'HIGH' ? '#ef4444' : severity === 'MEDIUM' ? '#f97316' : '#22c55e'
    }))
    .filter(item => item.count > 0);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Mistakes</p>
                <p className="text-2xl font-bold">{analytics.totalMistakes}</p>
              </div>
              <Brain className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mistake Rate</p>
                <p className="text-2xl font-bold">{analytics.mistakeFrequency.toFixed(1)}%</p>
                <div className="flex items-center gap-1 text-xs">
                  {improvementTrend < 0 ? (
                    <TrendingDown className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingUp className="h-3 w-3 text-red-500" />
                  )}
                  <span className={cn(
                    improvementTrend < 0 ? 'text-green-500' : 'text-red-500'
                  )}>
                    {Math.abs(improvementTrend).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="text-right">
                <Progress 
                  value={Math.min(analytics.mistakeFrequency, 100)} 
                  className="w-20"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Loss</p>
                <p className="text-2xl font-bold">
                  ${analytics.mistakeImpact.totalLoss.toFixed(0)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Loss/Mistake</p>
                <p className="text-2xl font-bold">
                  ${analytics.mistakeImpact.avgLossPerMistake.toFixed(0)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="common">Most Common</TabsTrigger>
          </TabsList>
          
          <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mistake Frequency Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'mistakeRate' ? `${value.toFixed(1)}%` : value,
                      name === 'mistakeRate' ? 'Mistake Rate' : 'Mistakes'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="mistakeRate" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.1}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="mistakeCount" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mistakes by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ category, count }) => `${category}: ${count}`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mistakes by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={severityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="severity" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8">
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.map(({ category, count, color }) => {
                  const Icon = CATEGORY_ICONS[category as MistakeCategoryEnum];
                  const percentage = analytics.totalMistakes > 0 ? (count / analytics.totalMistakes) * 100 : 0;
                  
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{category.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Progress value={percentage} className="w-20" />
                        <span className="text-sm font-medium">{count}</span>
                        <span className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="common" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Common Mistakes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.mostCommonMistakes.slice(0, 10).map((mistake, index) => {
                  const category = mistake.type.split('_')[0];
                  const severityColor = mistake.avgSeverity === 'HIGH' ? 'bg-red-500' : 
                                      mistake.avgSeverity === 'MEDIUM' ? 'bg-orange-500' : 'bg-green-500';
                  
                  return (
                    <div key={mistake.type} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-muted-foreground">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{mistake.label}</span>
                            <Badge 
                              variant="outline"
                              className={cn("text-xs", severityColor, "text-white")}
                            >
                              {mistake.avgSeverity}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{mistake.count} occurrences</span>
                            <span>•</span>
                            <span>${mistake.totalImpact.toFixed(0)} total loss</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-500">
                          ${(mistake.totalImpact / mistake.count).toFixed(0)}
                        </div>
                        <div className="text-xs text-muted-foreground">avg loss</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}