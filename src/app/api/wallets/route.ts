import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createWalletSchema } from '@/lib/wallet-validation';
import { z } from 'zod';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createWalletSchema.parse(body);

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