import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { ManualTradeInput, TradeSource, TradeActionType } from '@/types/trade';

const prisma = new PrismaClient();

// Manual trade validation schema
const manualTradeSchema = z.object({
  signature: z.string().optional(),
  type: z.enum(['buy', 'sell', 'swap']),
  tokenIn: z.string().min(1),
  tokenOut: z.string().min(1),
  amountIn: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0),
  amountOut: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0),
  priceIn: z.string().optional(),
  priceOut: z.string().optional(),
  dex: z.string().min(1),
  fees: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0),
  blockTime: z.string().datetime(),
  notes: z.string().optional(),
  walletId: z.string().min(1),
});

// GET: Fetch manual trades with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('walletId');
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    
    if (walletId) {
      where.walletId = walletId;
    }
    
    if (source) {
      where.source = source;
    }

    const trades = await prisma.trade.findMany({
      where,
      orderBy: { blockTime: 'desc' },
      take: limit,
      skip: offset,
      include: {
        wallet: {
          select: {
            address: true,
            label: true,
          },
        },
      },
    });

    const total = await prisma.trade.count({ where });

    return NextResponse.json({
      trades,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Failed to fetch manual trades:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create new manual trade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = manualTradeSchema.safeParse(body);
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

    // Check if wallet exists and belongs to user
    const wallet = await prisma.wallet.findUnique({
      where: { id: data.walletId },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Generate signature if not provided
    let signature = data.signature;
    if (!signature) {
      signature = `manual-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    }

    // Check for duplicate signature
    const existingTrade = await prisma.trade.findFirst({
      where: { signature },
    });

    if (existingTrade) {
      return NextResponse.json(
        { error: 'Trade with this signature already exists' },
        { status: 409 }
      );
    }

    // Create the trade
    const trade = await prisma.trade.create({
      data: {
        signature,
        walletId: data.walletId,
        type: data.type,
        tokenIn: data.tokenIn,
        tokenOut: data.tokenOut,
        amountIn: Number(data.amountIn),
        amountOut: Number(data.amountOut),
        priceIn: data.priceIn ? Number(data.priceIn) : null,
        priceOut: data.priceOut ? Number(data.priceOut) : null,
        dex: data.dex,
        fees: Number(data.fees),
        blockTime: new Date(data.blockTime),
        notes: data.notes || null,
        source: 'MANUAL',
        isEditable: true,
        processed: true, // Manual trades are always processed
        modifiedBy: 'user', // In a real app, this would be the user ID from auth
      },
    });

    // Create audit log for trade creation
    await prisma.tradeAuditLog.create({
      data: {
        tradeId: trade.id,
        userId: 'user', // In a real app, this would be from auth
        action: TradeActionType.CREATE,
        reason: 'Manual trade creation',
        timestamp: new Date(),
      },
    });

    // Return the created trade
    const createdTrade = await prisma.trade.findUnique({
      where: { id: trade.id },
      include: {
        wallet: {
          select: {
            address: true,
            label: true,
          },
        },
      },
    });

    return NextResponse.json(createdTrade, { status: 201 });
  } catch (error) {
    console.error('Failed to create manual trade:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update manual trade
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Trade ID is required' },
        { status: 400 }
      );
    }

    // Find the existing trade
    const existingTrade = await prisma.trade.findUnique({
      where: { id },
    });

    if (!existingTrade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    if (!existingTrade.isEditable) {
      return NextResponse.json(
        { error: 'Trade is not editable' },
        { status: 403 }
      );
    }

    // Validate update data
    const updateSchema = manualTradeSchema.partial().omit({ walletId: true });
    const validation = updateSchema.safeParse(updateData);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid update data', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Prepare update object
    const updateObject: any = {
      lastModified: new Date(),
      modifiedBy: 'user', // In a real app, this would be from auth
    };

    // Only update fields that are provided
    if (data.type !== undefined) updateObject.type = data.type;
    if (data.tokenIn !== undefined) updateObject.tokenIn = data.tokenIn;
    if (data.tokenOut !== undefined) updateObject.tokenOut = data.tokenOut;
    if (data.amountIn !== undefined) updateObject.amountIn = Number(data.amountIn);
    if (data.amountOut !== undefined) updateObject.amountOut = Number(data.amountOut);
    if (data.priceIn !== undefined) updateObject.priceIn = data.priceIn ? Number(data.priceIn) : null;
    if (data.priceOut !== undefined) updateObject.priceOut = data.priceOut ? Number(data.priceOut) : null;
    if (data.dex !== undefined) updateObject.dex = data.dex;
    if (data.fees !== undefined) updateObject.fees = Number(data.fees);
    if (data.blockTime !== undefined) updateObject.blockTime = new Date(data.blockTime);
    if (data.notes !== undefined) updateObject.notes = data.notes;

    // Update the trade
    const updatedTrade = await prisma.trade.update({
      where: { id },
      data: updateObject,
      include: {
        wallet: {
          select: {
            address: true,
            label: true,
          },
        },
      },
    });

    // Create audit log for each field that changed
    const auditLogs = [];
    for (const [field, newValue] of Object.entries(updateObject)) {
      if (field === 'lastModified' || field === 'modifiedBy') continue;
      
      const oldValue = existingTrade[field as keyof typeof existingTrade];
      if (oldValue !== newValue) {
        auditLogs.push({
          tradeId: id,
          userId: 'user', // In a real app, this would be from auth
          action: TradeActionType.UPDATE,
          fieldName: field,
          oldValue: String(oldValue || ''),
          newValue: String(newValue || ''),
          reason: body.reason || 'Manual trade update',
          timestamp: new Date(),
        });
      }
    }

    if (auditLogs.length > 0) {
      await prisma.tradeAuditLog.createMany({
        data: auditLogs,
      });
    }

    return NextResponse.json(updatedTrade);
  } catch (error) {
    console.error('Failed to update manual trade:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete manual trade
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Trade ID is required' },
        { status: 400 }
      );
    }

    // Find the existing trade
    const existingTrade = await prisma.trade.findUnique({
      where: { id },
      include: {
        positionTrades: true, // Check if trade is part of positions
      },
    });

    if (!existingTrade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    // Check for dependencies
    if (existingTrade.positionTrades.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete trade that is part of active positions. Please close positions first.' 
        },
        { status: 409 }
      );
    }

    // Create audit log before deletion
    await prisma.tradeAuditLog.create({
      data: {
        tradeId: id,
        userId: 'user', // In a real app, this would be from auth
        action: TradeActionType.DELETE,
        reason: 'Manual trade deletion',
        timestamp: new Date(),
      },
    });

    // Delete the trade (this will cascade to audit logs due to Prisma schema)
    await prisma.trade.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete manual trade:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}