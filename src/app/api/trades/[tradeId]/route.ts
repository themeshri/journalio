import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Trade edit validation schema
const tradeEditSchema = z.object({
  type: z.enum(['buy', 'sell', 'swap']).optional(),
  tokenIn: z.string().min(1).optional(),
  tokenOut: z.string().min(1).optional(),
  amountIn: z.string().refine(val => val === '' || (!isNaN(Number(val)) && Number(val) > 0)).optional(),
  amountOut: z.string().refine(val => val === '' || (!isNaN(Number(val)) && Number(val) > 0)).optional(),
  priceIn: z.string().optional(),
  priceOut: z.string().optional(),
  dex: z.string().optional(),
  fees: z.string().refine(val => val === '' || (!isNaN(Number(val)) && Number(val) >= 0)).optional(),
  blockTime: z.string().datetime().optional(),
  notes: z.string().optional(),
  reason: z.string().min(1, 'Reason for edit is required'),
});

// Mock data from simple endpoint
const exampleTrades = [
  {
    id: '1',
    type: 'BUY',
    tokenIn: 'SOL',
    tokenOut: 'BONK',
    amountIn: 10,
    amountOut: 500000000,
    priceIn: 95.50,
    priceOut: 0.0000191,
    executedAt: '2024-02-10T10:30:00',
    dex: 'Jupiter',
    fees: 0.005,
    notes: 'Saw increasing volume on DEXScreener, community hype building',
    isManual: false,
    mistakes: []
  },
  {
    id: '2',
    type: 'SELL',
    tokenIn: 'BONK',
    tokenOut: 'SOL',
    amountIn: 250000000,
    amountOut: 5.2,
    priceIn: 0.0000208,
    priceOut: 96.15,
    executedAt: '2024-02-10T14:45:00',
    dex: 'Raydium',
    fees: 0.003,
    notes: 'Taking 50% profits at 2x, letting rest ride',
    isManual: false,
    mistakes: []
  },
  {
    id: '3',
    type: 'BUY',
    tokenIn: 'USDC',
    tokenOut: 'WIF',
    amountIn: 1000,
    amountOut: 300,
    priceIn: 1,
    priceOut: 3.33,
    executedAt: '2024-02-09T09:15:00',
    dex: 'Orca',
    fees: 1.50,
    notes: 'Dogwifhat breaking out, strong volume, X sentiment bullish',
    isManual: false,
    mistakes: [{
      id: '1',
      mistakeType: 'FOMO Entry',
      severity: 'HIGH',
      category: { name: 'FOMO Entry', color: '#ef4444' }
    }]
  },
  {
    id: '4',
    type: 'SELL',
    tokenIn: 'WIF',
    tokenOut: 'USDC',
    amountIn: 150,
    amountOut: 600,
    priceIn: 4.00,
    priceOut: 1,
    executedAt: '2024-02-11T11:20:00',
    dex: 'Jupiter',
    fees: 0.90,
    notes: 'Partial exit at resistance, keeping 50% for higher targets',
    isManual: false,
    mistakes: []
  },
  {
    id: '5',
    type: 'BUY',
    tokenIn: 'SOL',
    tokenOut: 'JTO',
    amountIn: 50,
    amountOut: 1250,
    priceIn: 94.80,
    priceOut: 3.79,
    executedAt: '2024-02-08T16:30:00',
    dex: 'Raydium',
    fees: 0.025,
    notes: 'JTO governance proposal news, expecting pump',
    isManual: true,
    mistakes: []
  },
  {
    id: '6',
    type: 'BUY',
    tokenIn: 'USDC',
    tokenOut: 'PYTH',
    amountIn: 2000,
    amountOut: 5000,
    priceIn: 1,
    priceOut: 0.40,
    executedAt: '2024-02-07T13:00:00',
    dex: 'Orca',
    fees: 3.00,
    notes: 'Oracle narrative strong, new chain integrations coming',
    isManual: false,
    mistakes: []
  },
  {
    id: '7',
    type: 'BUY',
    tokenIn: 'SOL',
    tokenOut: 'POPCAT',
    amountIn: 5,
    amountOut: 50000,
    priceIn: 94.00,
    priceOut: 0.0094,
    executedAt: '2024-02-01T12:00:00',
    dex: 'Raydium',
    fees: 0.0025,
    notes: 'Small meme position, viral on TikTok',
    isManual: true,
    mistakes: []
  },
  {
    id: '8',
    type: 'SELL',
    tokenIn: 'POPCAT',
    tokenOut: 'SOL',
    amountIn: 50000,
    amountOut: 25,
    priceIn: 0.047,
    priceOut: 94.00,
    executedAt: '2024-02-03T15:30:00',
    dex: 'Jupiter',
    fees: 0.0125,
    notes: '5x on meme coin! Viral success',
    isManual: false,
    mistakes: []
  },
  {
    id: '9',
    type: 'BUY',
    tokenIn: 'USDC',
    tokenOut: 'RAY',
    amountIn: 750,
    amountOut: 500,
    priceIn: 1,
    priceOut: 1.50,
    executedAt: '2024-02-03T09:00:00',
    dex: 'Raydium',
    fees: 1.125,
    notes: 'Raydium v3 launch, expecting volume increase',
    isManual: false,
    mistakes: [{
      id: '2',
      mistakeType: 'Early Exit',
      severity: 'MEDIUM',
      category: { name: 'Early Exit', color: '#f97316' }
    }]
  },
  {
    id: '10',
    type: 'BUY',
    tokenIn: 'SOL',
    tokenOut: 'RENDER',
    amountIn: 30,
    amountOut: 400,
    priceIn: 93.00,
    priceOut: 6.975,
    executedAt: '2024-02-06T08:45:00',
    dex: 'Raydium',
    fees: 0.015,
    notes: 'AI narrative heating up, NVDA earnings catalyst',
    isManual: true,
    mistakes: []
  }
];

// GET: Fetch individual trade details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    // Await params for Next.js 15+
    const { tradeId } = await params;

    console.log('Fetching trade with ID:', tradeId);

    // Find trade in mock data
    const trade = exampleTrades.find(t => t.id === tradeId);

    if (!trade) {
      console.log('Trade not found:', tradeId);
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    console.log('Found trade:', trade.tokenIn, '→', trade.tokenOut);

    // Return trade with additional metadata needed for edit page
    return NextResponse.json({
      ...trade,
      signature: `mock_${tradeId}_signature`,
      blockTime: trade.executedAt,
      source: 'mock',
      isEditable: true,
      lastModified: new Date().toISOString(),
      wallet: {
        address: 'DEMO123...WALLET',
        label: 'Demo Wallet'
      },
      originalData: trade, // For edit comparison
      impactAnalysis: {
        positionsAffected: 0,
        positions: [],
        willRecalculate: false,
        warnings: []
      }
    });
  } catch (error) {
    console.error('Failed to fetch trade details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update existing trade (mock implementation)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    // Await params for Next.js 15+
    const { tradeId } = await params;
    const body = await request.json();

    // Validate input
    const validation = tradeEditSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid trade data', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Find the existing trade in mock data
    const existingTrade = exampleTrades.find(t => t.id === tradeId);

    if (!existingTrade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    // Mock update - just return success with updated data
    const updatedTrade = {
      ...existingTrade,
      ...data,
      lastModified: new Date().toISOString(),
      signature: `mock_${tradeId}_signature`,
      blockTime: data.blockTime || existingTrade.executedAt,
      wallet: {
        address: 'DEMO123...WALLET',
        label: 'Demo Wallet'
      }
    };

    return NextResponse.json(updatedTrade);
  } catch (error) {
    console.error('Failed to update trade:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete trade (mock implementation)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    // Await params for Next.js 15+
    const { tradeId } = await params;

    // Find the existing trade in mock data
    const existingTrade = exampleTrades.find(t => t.id === tradeId);

    if (!existingTrade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    // Mock deletion - just return success
    return NextResponse.json({
      success: true,
      message: 'Trade deleted successfully (mock)'
    });
  } catch (error) {
    console.error('Failed to delete trade:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}