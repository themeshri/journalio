import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { analyticsService } from '@/lib/analytics';
import { z } from 'zod';

const trendsQuerySchema = z.object({
  userId: z.string().optional(),
  timeframe: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  periods: z.string().transform(val => val ? parseInt(val) : 12).default(12)
});

// GET: Fetch mistake trends by timeframe
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryResult = trendsQuerySchema.safeParse({
      userId: searchParams.get('userId') || undefined,
      timeframe: searchParams.get('timeframe') || 'weekly',
      periods: searchParams.get('periods') || '12'
    });

    if (!queryResult.success) {
      return NextResponse.json({ 
        error: 'Invalid query parameters',
        details: queryResult.error.errors 
      }, { status: 400 });
    }

    const { userId, timeframe, periods } = queryResult.data;
    const targetUserId = userId || session.userId;

    // Only allow users to access their own data
    if (targetUserId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const trends = await analyticsService.getMistakesByTimeframe(
      targetUserId, 
      timeframe, 
      periods
    );

    return NextResponse.json({ trends });
  } catch (error) {
    console.error('GET /api/analytics/mistakes/trends error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}