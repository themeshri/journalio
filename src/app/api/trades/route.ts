import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: Fetch all trades for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First ensure user has a wallet
    let wallet = await prisma.wallet.findFirst({
      where: { userId: session.userId }
    });

    if (!wallet) {
      // Create a default wallet
      wallet = await prisma.wallet.create({
        data: {
          address: '7xKXtg2CW87d7TXQ4q6Zqm2Z7Xqr4q5X4q5X4q5X4q5X',
          label: 'Main Trading Wallet',
          chain: 'SOLANA',
          userId: session.userId,
          isActive: true,
        }
      });
    }

    // Check if we have any trades
    const tradesCount = await prisma.trade.count({
      where: { userId: session.userId }
    });

    // If no trades exist, create some example trades
    if (tradesCount === 0) {
      const exampleTrades = [
        // BONK trades - Meme coin success
        {
          type: 'BUY' as const,
          tokenIn: 'SOL',
          tokenOut: 'BONK',
          amountIn: 10,
          amountOut: 500000000,
          priceIn: 95.50,
          priceOut: 0.0000191,
          executedAt: new Date('2024-02-10T10:30:00'),
          transactionHash: '3nX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E4',
          dex: 'Jupiter',
          fees: 0.005,
          walletId: wallet.id,
          userId: session.userId,
          notes: 'Saw increasing volume on DEXScreener, community hype building',
          isManual: false,
        },
        {
          type: 'SELL' as const,
          tokenIn: 'BONK',
          tokenOut: 'SOL',
          amountIn: 250000000,
          amountOut: 5.2,
          priceIn: 0.0000208,
          priceOut: 96.15,
          executedAt: new Date('2024-02-10T14:45:00'),
          transactionHash: '4nX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E5',
          dex: 'Raydium',
          fees: 0.003,
          walletId: wallet.id,
          userId: session.userId,
          notes: 'Taking 50% profits at 2x, letting rest ride',
          isManual: false,
        },

        // WIF trades - Dogwifhat momentum
        {
          type: 'BUY' as const,
          tokenIn: 'USDC',
          tokenOut: 'WIF',
          amountIn: 1000,
          amountOut: 300,
          priceIn: 1,
          priceOut: 3.33,
          executedAt: new Date('2024-02-09T09:15:00'),
          transactionHash: '5nX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E6',
          dex: 'Orca',
          fees: 1.50,
          walletId: wallet.id,
          userId: session.userId,
          notes: 'Dogwifhat breaking out, strong volume, X sentiment bullish',
          isManual: false,
        },
        {
          type: 'SELL' as const,
          tokenIn: 'WIF',
          tokenOut: 'USDC',
          amountIn: 150,
          amountOut: 600,
          priceIn: 4.00,
          priceOut: 1,
          executedAt: new Date('2024-02-11T11:20:00'),
          transactionHash: '6nX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E7',
          dex: 'Jupiter',
          fees: 0.90,
          walletId: wallet.id,
          userId: session.userId,
          notes: 'Partial exit at resistance, keeping 50% for higher targets',
          isManual: false,
        },

        // JTO trades - Governance token play
        {
          type: 'BUY' as const,
          tokenIn: 'SOL',
          tokenOut: 'JTO',
          amountIn: 50,
          amountOut: 1250,
          priceIn: 94.80,
          priceOut: 3.79,
          executedAt: new Date('2024-02-08T16:30:00'),
          transactionHash: '7nX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E8',
          dex: 'Raydium',
          fees: 0.025,
          walletId: wallet.id,
          userId: session.userId,
          notes: 'JTO governance proposal news, expecting pump',
          isManual: true,
        },
        {
          type: 'SELL' as const,
          tokenIn: 'JTO',
          tokenOut: 'SOL',
          amountIn: 1250,
          amountOut: 55,
          priceIn: 4.20,
          priceOut: 95.45,
          executedAt: new Date('2024-02-09T10:15:00'),
          transactionHash: '8nX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E9',
          dex: 'Jupiter',
          fees: 0.0275,
          walletId: wallet.id,
          userId: session.userId,
          notes: 'Quick flip +10%, news priced in',
          isManual: false,
        },

        // PYTH Oracle plays
        {
          type: 'BUY' as const,
          tokenIn: 'USDC',
          tokenOut: 'PYTH',
          amountIn: 2000,
          amountOut: 5000,
          priceIn: 1,
          priceOut: 0.40,
          executedAt: new Date('2024-02-07T13:00:00'),
          transactionHash: '9nX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E0',
          dex: 'Orca',
          fees: 3.00,
          walletId: wallet.id,
          userId: session.userId,
          notes: 'Oracle narrative strong, new chain integrations coming',
          isManual: false,
        },
        {
          type: 'SELL' as const,
          tokenIn: 'PYTH',
          tokenOut: 'USDC',
          amountIn: 2000,
          amountOut: 900,
          priceIn: 0.45,
          priceOut: 1,
          executedAt: new Date('2024-02-08T08:30:00'),
          transactionHash: '1aX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E1',
          dex: 'Jupiter',
          fees: 1.35,
          walletId: wallet.id,
          userId: session.userId,
          notes: 'Scalp trade +12.5%, momentum fading',
          isManual: false,
        },

        // RENDER AI play
        {
          type: 'BUY' as const,
          tokenIn: 'SOL',
          tokenOut: 'RENDER',
          amountIn: 30,
          amountOut: 400,
          priceIn: 93.00,
          priceOut: 6.975,
          executedAt: new Date('2024-02-06T08:45:00'),
          transactionHash: '2aX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E2',
          dex: 'Raydium',
          fees: 0.015,
          walletId: wallet.id,
          userId: session.userId,
          notes: 'AI narrative heating up, NVDA earnings catalyst',
          isManual: true,
        },

        // HNT IoT trade
        {
          type: 'BUY' as const,
          tokenIn: 'USDC',
          tokenOut: 'HNT',
          amountIn: 500,
          amountOut: 100,
          priceIn: 1,
          priceOut: 5.00,
          executedAt: new Date('2024-02-05T15:20:00'),
          transactionHash: '3aX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E3',
          dex: 'Orca',
          fees: 0.75,
          walletId: wallet.id,
          userId: session.userId,
          notes: 'Helium Mobile launch news, IoT narrative',
          isManual: false,
        },

        // RNDR partial loss
        {
          type: 'SELL' as const,
          tokenIn: 'RENDER',
          tokenOut: 'SOL',
          amountIn: 400,
          amountOut: 27,
          priceIn: 6.30,
          priceOut: 92.50,
          executedAt: new Date('2024-02-07T14:00:00'),
          transactionHash: '4aX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E4',
          dex: 'Jupiter',
          fees: 0.0135,
          walletId: wallet.id,
          userId: session.userId,
          notes: 'Stop loss hit, -10% loss, market turned bearish',
          isManual: false,
        },

        // MOBILE speculation
        {
          type: 'BUY' as const,
          tokenIn: 'SOL',
          tokenOut: 'MOBILE',
          amountIn: 20,
          amountOut: 10000,
          priceIn: 95.00,
          priceOut: 0.0019,
          executedAt: new Date('2024-02-04T11:30:00'),
          transactionHash: '5aX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E5',
          dex: 'Raydium',
          fees: 0.010,
          walletId: wallet.id,
          userId: session.userId,
          notes: 'Helium Mobile carrier deal rumors',
          isManual: true,
        },

        // RAY DeFi position
        {
          type: 'BUY' as const,
          tokenIn: 'USDC',
          tokenOut: 'RAY',
          amountIn: 750,
          amountOut: 500,
          priceIn: 1,
          priceOut: 1.50,
          executedAt: new Date('2024-02-03T09:00:00'),
          transactionHash: '6aX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E6',
          dex: 'Raydium',
          fees: 1.125,
          walletId: wallet.id,
          userId: session.userId,
          notes: 'Raydium v3 launch, expecting volume increase',
          isManual: false,
        },

        // MNGO DeFi trade
        {
          type: 'BUY' as const,
          tokenIn: 'SOL',
          tokenOut: 'MNGO',
          amountIn: 15,
          amountOut: 3750,
          priceIn: 92.00,
          priceOut: 0.00368,
          executedAt: new Date('2024-02-02T16:45:00'),
          transactionHash: '7aX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E7',
          dex: 'Jupiter',
          fees: 0.0075,
          walletId: wallet.id,
          userId: session.userId,
          notes: 'Mango Markets v4 beta launch',
          isManual: false,
        },

        // POPCAT meme coin gamble
        {
          type: 'BUY' as const,
          tokenIn: 'SOL',
          tokenOut: 'POPCAT',
          amountIn: 5,
          amountOut: 50000,
          priceIn: 94.00,
          priceOut: 0.0094,
          executedAt: new Date('2024-02-01T12:00:00'),
          transactionHash: '8aX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E8',
          dex: 'Raydium',
          fees: 0.0025,
          walletId: wallet.id,
          userId: session.userId,
          notes: 'Small meme position, viral on TikTok',
          isManual: true,
        },

        // POPCAT exit - huge win
        {
          type: 'SELL' as const,
          tokenIn: 'POPCAT',
          tokenOut: 'SOL',
          amountIn: 50000,
          amountOut: 25,
          priceIn: 0.047,
          priceOut: 94.00,
          executedAt: new Date('2024-02-03T15:30:00'),
          transactionHash: '9aX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E9',
          dex: 'Jupiter',
          fees: 0.0125,
          walletId: wallet.id,
          userId: session.userId,
          notes: '5x on meme coin! Viral success',
          isManual: false,
        },

        // GMT gaming token
        {
          type: 'BUY' as const,
          tokenIn: 'USDC',
          tokenOut: 'GMT',
          amountIn: 600,
          amountOut: 2000,
          priceIn: 1,
          priceOut: 0.30,
          executedAt: new Date('2024-01-31T10:00:00'),
          transactionHash: '1bX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3F0',
          dex: 'Orca',
          fees: 0.90,
          walletId: wallet.id,
          userId: session.userId,
          notes: 'StepN partnership announcement',
          isManual: false,
        },

        // FIDA loss trade
        {
          type: 'BUY' as const,
          tokenIn: 'SOL',
          tokenOut: 'FIDA',
          amountIn: 8,
          amountOut: 400,
          priceIn: 91.00,
          priceOut: 0.182,
          executedAt: new Date('2024-01-30T14:20:00'),
          transactionHash: '2bX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3F1',
          dex: 'Raydium',
          fees: 0.004,
          walletId: wallet.id,
          userId: session.userId,
          notes: 'Bonfida domain speculation',
          isManual: true,
        },
        {
          type: 'SELL' as const,
          tokenIn: 'FIDA',
          tokenOut: 'SOL',
          amountIn: 400,
          amountOut: 6,
          priceIn: 0.137,
          priceOut: 91.50,
          executedAt: new Date('2024-01-31T09:00:00'),
          transactionHash: '3bX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3F2',
          dex: 'Jupiter',
          fees: 0.003,
          walletId: wallet.id,
          userId: session.userId,
          notes: 'Cut loss -25%, no momentum',
          isManual: false,
        },

        // SAMO meme trade
        {
          type: 'BUY' as const,
          tokenIn: 'USDC',
          tokenOut: 'SAMO',
          amountIn: 300,
          amountOut: 30000,
          priceIn: 1,
          priceOut: 0.01,
          executedAt: new Date('2024-01-29T11:00:00'),
          transactionHash: '4bX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3F3',
          dex: 'Orca',
          fees: 0.45,
          walletId: wallet.id,
          userId: session.userId,
          notes: 'Original Solana dog coin, community revival',
          isManual: false,
        },
      ];

      // Create example trades
      await prisma.trade.createMany({
        data: exampleTrades
      });
    }

    // Fetch trades with mistake information
    const trades = await prisma.trade.findMany({
      where: { userId: session.userId },
      include: {
        mistakes: {
          include: {
            category: true,
            customMistake: true
          }
        }
      },
      orderBy: { executedAt: 'desc' }
    });

    // Transform the response
    const transformedTrades = trades.map(trade => ({
      ...trade,
      amountIn: trade.amountIn.toNumber(),
      amountOut: trade.amountOut.toNumber(),
      priceIn: trade.priceIn?.toNumber(),
      priceOut: trade.priceOut?.toNumber(),
      fees: trade.fees.toNumber(),
      mistakes: trade.mistakes?.map(m => ({
        id: m.id,
        mistakeType: m.mistakeType,
        severity: m.severity,
        category: m.category ? {
          name: m.category.name,
          color: m.category.color
        } : null,
        customMistake: m.customMistake ? {
          name: m.customMistake.name,
          color: m.customMistake.color
        } : null
      }))
    }));

    return NextResponse.json({ trades: transformedTrades });
  } catch (error) {
    console.error('GET /api/trades error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new trade
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Create the trade
    const trade = await prisma.trade.create({
      data: {
        ...body,
        userId: session.userId,
        isManual: true
      },
      include: {
        mistakes: {
          include: {
            category: true,
            customMistake: true
          }
        }
      }
    });

    // Transform the response
    const transformedTrade = {
      ...trade,
      amountIn: trade.amountIn.toNumber(),
      amountOut: trade.amountOut.toNumber(),
      priceIn: trade.priceIn?.toNumber(),
      priceOut: trade.priceOut?.toNumber(),
      fees: trade.fees.toNumber(),
      mistakes: trade.mistakes?.map(m => ({
        id: m.id,
        mistakeType: m.mistakeType,
        severity: m.severity,
        category: m.category,
        customMistake: m.customMistake
      }))
    };

    return NextResponse.json({ trade: transformedTrade }, { status: 201 });
  } catch (error) {
    console.error('POST /api/trades error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}