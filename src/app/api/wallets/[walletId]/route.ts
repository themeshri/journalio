import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateWalletSchema } from '@/lib/wallet-validation';
import { z } from 'zod';

interface RouteParams {
  params: { walletId: string };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wallet = await prisma.wallet.findFirst({
      where: {
        id: params.walletId,
        userId,
        isActive: true
      }
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Get wallet error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify wallet belongs to user
    const existingWallet = await prisma.wallet.findFirst({
      where: {
        id: params.walletId,
        userId,
        isActive: true
      }
    });

    if (!existingWallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateWalletSchema.parse(body);

    const wallet = await prisma.wallet.update({
      where: { id: params.walletId },
      data: validatedData
    });

    return NextResponse.json(wallet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid wallet data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update wallet error:', error);
    return NextResponse.json(
      { error: 'Failed to update wallet' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify wallet belongs to user
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: params.walletId,
        userId
      }
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Soft delete wallet (set isActive to false)
    await prisma.wallet.update({
      where: { id: params.walletId },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete wallet error:', error);
    return NextResponse.json(
      { error: 'Failed to delete wallet' },
      { status: 500 }
    );
  }
}