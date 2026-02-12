import { requireAuth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createWalletSchema } from '@/lib/wallet-validation';
import { z } from 'zod';

export async function GET() {
  try {
    const userId = await requireAuth();

    const wallets = await prisma.wallet.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(wallets);
  } catch (error) {
    console.error('Get wallets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallets' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();

    const body = await request.json();
    const validatedData = createWalletSchema.parse(body);

    // Ensure user exists, create if not (for dev mode)
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        clerkId: userId, // In dev mode, use same ID
        email: 'dev@chainjournal.com',
        name: 'Dev User'
      },
      update: {} // Do nothing if exists
    });

    // Check if wallet already exists for this user
    const existingWallet = await prisma.wallet.findUnique({
      where: {
        userId_address_chain: {
          userId,
          address: validatedData.address,
          chain: validatedData.chain
        }
      }
    });

    if (existingWallet) {
      return NextResponse.json(
        { error: 'Wallet address already added' },
        { status: 400 }
      );
    }

    const wallet = await prisma.wallet.create({
      data: {
        address: validatedData.address,
        chain: validatedData.chain,
        label: validatedData.label,
        userId
      }
    });

    return NextResponse.json(wallet, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid wallet data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create wallet error:', error);
    return NextResponse.json(
      { error: 'Failed to create wallet' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('id');

    if (!walletId) {
      return NextResponse.json(
        { error: 'Wallet ID is required' },
        { status: 400 }
      );
    }

    // Verify wallet ownership before deleting
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId
      }
    });

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the wallet (this will cascade delete related records due to DB constraints)
    await prisma.wallet.delete({
      where: { id: walletId }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Wallet deleted successfully' 
    });
  } catch (error) {
    console.error('Delete wallet error:', error);
    return NextResponse.json(
      { error: 'Failed to delete wallet' },
      { status: 500 }
    );
  }
}