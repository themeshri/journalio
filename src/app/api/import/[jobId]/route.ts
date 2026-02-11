import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId } = await auth();
    const { jobId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get job with wallet to verify ownership
    const job = await prisma.importJob.findUnique({
      where: { id: jobId },
      include: {
        wallet: {
          select: { userId: true }
        }
      }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Verify job belongs to user
    if (job.wallet.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Return job status without wallet info
    const { wallet, ...jobStatus } = job;

    return NextResponse.json(jobStatus);
  } catch (error) {
    console.error('Get import status error:', error);
    return NextResponse.json(
      { error: 'Failed to get import status' },
      { status: 500 }
    );
  }
}