import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { tradeImportService } from '@/lib/trade-import-service';
import { z } from 'zod';

const startImportSchema = z.object({
  walletId: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { walletId } = startImportSchema.parse(body);

    // Verify wallet belongs to user
    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId }
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Check for existing running import
    const existingJob = await prisma.importJob.findFirst({
      where: {
        walletId,
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    });

    if (existingJob) {
      return NextResponse.json({
        jobId: existingJob.id,
        message: 'Import already in progress'
      });
    }

    const jobId = await tradeImportService.startImport(walletId);

    return NextResponse.json({ jobId }, { status: 201 });
  } catch (error) {
    console.error('Start import error:', error);
    return NextResponse.json(
      { error: 'Failed to start import' },
      { status: 500 }
    );
  }
}