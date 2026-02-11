import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { analyticsService } from '@/lib/analytics';
import { z } from 'zod';

const mistakeQuerySchema = z.object({
  userId: z.string().optional(),
  category: z.enum(['EMOTIONAL', 'RISK_MANAGEMENT', 'STRATEGY', 'TIMING', 'TECHNICAL', 'CUSTOM']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  emotionalState: z.enum(['CONFIDENT', 'FEARFUL', 'GREEDY', 'NEUTRAL', 'ANXIOUS', 'EUPHORIC']).optional(),
  startDate: z.string().transform(val => val ? new Date(val) : undefined).optional(),
  endDate: z.string().transform(val => val ? new Date(val) : undefined).optional(),
  tradeId: z.string().optional()
});

// GET: Fetch mistake analytics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryResult = mistakeQuerySchema.safeParse({
      userId: searchParams.get('userId') || undefined,
      category: searchParams.get('category') || undefined,
      severity: searchParams.get('severity') || undefined,
      emotionalState: searchParams.get('emotionalState') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      tradeId: searchParams.get('tradeId') || undefined
    });

    if (!queryResult.success) {
      return NextResponse.json({ 
        error: 'Invalid query parameters',
        details: queryResult.error.errors 
      }, { status: 400 });
    }

    const filters = queryResult.data;
    const targetUserId = filters.userId || session.userId;

    // Only allow users to access their own data
    if (targetUserId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const analytics = await analyticsService.getMistakeAnalytics(targetUserId, {
      category: filters.category,
      severity: filters.severity,
      emotionalState: filters.emotionalState,
      startDate: filters.startDate,
      endDate: filters.endDate,
      tradeId: filters.tradeId
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('GET /api/analytics/mistakes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Add mistake to trade
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      tradeId, 
      mistakeType, 
      customLabel, 
      severity, 
      emotionalState, 
      notes, 
      learningPoints, 
      preventionStrategy 
    } = body;

    if (!tradeId || !mistakeType || !severity) {
      return NextResponse.json(
        { error: 'Trade ID, mistake type, and severity are required' },
        { status: 400 }
      );
    }

    // Verify trade ownership
    const { prisma } = await import('@/lib/db');
    const trade = await prisma.trade.findFirst({
      where: {
        id: tradeId,
        wallet: {
          userId: session.userId
        }
      }
    });

    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found or access denied' },
        { status: 404 }
      );
    }

    // Create mistake record
    const mistake = await prisma.tradeMistake.create({
      data: {
        tradeId,
        mistakeType,
        customLabel,
        severity,
        emotionalState,
        notes,
        learningPoints,
        preventionStrategy
      }
    });

    return NextResponse.json({ mistake }, { status: 201 });
  } catch (error) {
    console.error('POST /api/analytics/mistakes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update mistake details
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mistakeId = searchParams.get('id');

    if (!mistakeId) {
      return NextResponse.json(
        { error: 'Mistake ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { severity, emotionalState, notes, learningPoints, preventionStrategy } = body;

    // Verify mistake ownership
    const { prisma } = await import('@/lib/db');
    const existing = await prisma.tradeMistake.findFirst({
      where: {
        id: mistakeId,
        trade: {
          wallet: {
            userId: session.userId
          }
        }
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Mistake not found or access denied' },
        { status: 404 }
      );
    }

    const updated = await prisma.tradeMistake.update({
      where: { id: mistakeId },
      data: {
        severity: severity || existing.severity,
        emotionalState: emotionalState !== undefined ? emotionalState : existing.emotionalState,
        notes: notes !== undefined ? notes : existing.notes,
        learningPoints: learningPoints !== undefined ? learningPoints : existing.learningPoints,
        preventionStrategy: preventionStrategy !== undefined ? preventionStrategy : existing.preventionStrategy
      }
    });

    return NextResponse.json({ mistake: updated });
  } catch (error) {
    console.error('PUT /api/analytics/mistakes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove mistake from trade
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mistakeId = searchParams.get('id');

    if (!mistakeId) {
      return NextResponse.json(
        { error: 'Mistake ID is required' },
        { status: 400 }
      );
    }

    // Verify mistake ownership
    const { prisma } = await import('@/lib/db');
    const existing = await prisma.tradeMistake.findFirst({
      where: {
        id: mistakeId,
        trade: {
          wallet: {
            userId: session.userId
          }
        }
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Mistake not found or access denied' },
        { status: 404 }
      );
    }

    await prisma.tradeMistake.delete({
      where: { id: mistakeId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/analytics/mistakes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}