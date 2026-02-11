import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: Fetch mistake frequency data for auto-suggestions
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get mistake frequency for the user
    const mistakeFrequency = await prisma.tradeMistake.groupBy({
      by: ['mistakeType'],
      where: {
        trade: {
          wallet: {
            userId: session.userId
          }
        }
      },
      _count: {
        mistakeType: true
      },
      orderBy: {
        _count: {
          mistakeType: 'desc'
        }
      }
    });

    // Transform to frequency object
    const frequency = mistakeFrequency.reduce((acc, item) => {
      acc[item.mistakeType] = item._count.mistakeType;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({ frequency });
  } catch (error) {
    console.error('GET /api/analytics/mistakes/frequency error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}