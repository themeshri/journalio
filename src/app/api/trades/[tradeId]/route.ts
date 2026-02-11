import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { TradeActionType } from '@/types/trade';

const prisma = new PrismaClient();

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

// GET: Fetch individual trade details
export async function GET(
  request: NextRequest,
  { params }: { params: { tradeId: string } }
) {
  try {
    const { tradeId } = params;

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        wallet: {
          select: {
            address: true,
            label: true,
            userId: true,
          },
        },
        auditLogs: {
          orderBy: { timestamp: 'desc' },
          take: 10, // Latest 10 audit entries
        },
      },
    });

    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    // In a real app, check if user owns this trade
    // if (trade.wallet.userId !== currentUserId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    // Calculate change impact analysis
    const impactAnalysis = await calculateChangeImpact(tradeId);

    return NextResponse.json({
      ...trade,
      impactAnalysis,
    });
  } catch (error) {
    console.error('Failed to fetch trade details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update existing trade
export async function PUT(
  request: NextRequest,
  { params }: { params: { tradeId: string } }
) {
  try {
    const { tradeId } = params;
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

    // Find the existing trade
    const existingTrade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        wallet: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!existingTrade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    // Check permissions
    // In a real app, verify user ownership
    // if (existingTrade.wallet.userId !== currentUserId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    if (!existingTrade.isEditable) {
      return NextResponse.json(
        { error: 'Trade is not editable' },
        { status: 403 }
      );
    }

    // Prepare update object - only include fields that are being changed
    const updateObject: any = {
      lastModified: new Date(),
      modifiedBy: 'user', // In a real app, this would be from auth
    };

    const auditLogs = [];
    
    // Check each field for changes and prepare audit logs
    if (data.type !== undefined && data.type !== existingTrade.type) {
      updateObject.type = data.type;
      auditLogs.push({
        fieldName: 'type',
        oldValue: existingTrade.type,
        newValue: data.type,
      });
    }

    if (data.tokenIn !== undefined && data.tokenIn !== existingTrade.tokenIn) {
      updateObject.tokenIn = data.tokenIn;
      auditLogs.push({
        fieldName: 'tokenIn',
        oldValue: existingTrade.tokenIn,
        newValue: data.tokenIn,
      });
    }

    if (data.tokenOut !== undefined && data.tokenOut !== existingTrade.tokenOut) {
      updateObject.tokenOut = data.tokenOut;
      auditLogs.push({
        fieldName: 'tokenOut',
        oldValue: existingTrade.tokenOut,
        newValue: data.tokenOut,
      });
    }

    if (data.amountIn !== undefined) {
      const newAmountIn = Number(data.amountIn);
      if (newAmountIn !== Number(existingTrade.amountIn)) {
        updateObject.amountIn = newAmountIn;
        auditLogs.push({
          fieldName: 'amountIn',
          oldValue: existingTrade.amountIn.toString(),
          newValue: newAmountIn.toString(),
        });
      }
    }

    if (data.amountOut !== undefined) {
      const newAmountOut = Number(data.amountOut);
      if (newAmountOut !== Number(existingTrade.amountOut)) {
        updateObject.amountOut = newAmountOut;
        auditLogs.push({
          fieldName: 'amountOut',
          oldValue: existingTrade.amountOut.toString(),
          newValue: newAmountOut.toString(),
        });
      }
    }

    if (data.priceIn !== undefined) {
      const newPriceIn = data.priceIn ? Number(data.priceIn) : null;
      if (newPriceIn !== existingTrade.priceIn) {
        updateObject.priceIn = newPriceIn;
        auditLogs.push({
          fieldName: 'priceIn',
          oldValue: existingTrade.priceIn?.toString() || '',
          newValue: newPriceIn?.toString() || '',
        });
      }
    }

    if (data.priceOut !== undefined) {
      const newPriceOut = data.priceOut ? Number(data.priceOut) : null;
      if (newPriceOut !== existingTrade.priceOut) {
        updateObject.priceOut = newPriceOut;
        auditLogs.push({
          fieldName: 'priceOut',
          oldValue: existingTrade.priceOut?.toString() || '',
          newValue: newPriceOut?.toString() || '',
        });
      }
    }

    if (data.dex !== undefined && data.dex !== existingTrade.dex) {
      updateObject.dex = data.dex;
      auditLogs.push({
        fieldName: 'dex',
        oldValue: existingTrade.dex || '',
        newValue: data.dex,
      });
    }

    if (data.fees !== undefined) {
      const newFees = Number(data.fees);
      if (newFees !== Number(existingTrade.fees)) {
        updateObject.fees = newFees;
        auditLogs.push({
          fieldName: 'fees',
          oldValue: existingTrade.fees.toString(),
          newValue: newFees.toString(),
        });
      }
    }

    if (data.blockTime !== undefined) {
      const newBlockTime = new Date(data.blockTime);
      if (newBlockTime.getTime() !== existingTrade.blockTime.getTime()) {
        updateObject.blockTime = newBlockTime;
        auditLogs.push({
          fieldName: 'blockTime',
          oldValue: existingTrade.blockTime.toISOString(),
          newValue: newBlockTime.toISOString(),
        });
      }
    }

    if (data.notes !== undefined && data.notes !== (existingTrade.notes || '')) {
      updateObject.notes = data.notes || null;
      auditLogs.push({
        fieldName: 'notes',
        oldValue: existingTrade.notes || '',
        newValue: data.notes || '',
      });
    }

    // If no changes detected, return early
    if (auditLogs.length === 0) {
      return NextResponse.json(
        { error: 'No changes detected' },
        { status: 400 }
      );
    }

    // Store original data if this is the first edit
    if (!existingTrade.originalData) {
      updateObject.originalData = {
        signature: existingTrade.signature,
        type: existingTrade.type,
        tokenIn: existingTrade.tokenIn,
        tokenOut: existingTrade.tokenOut,
        amountIn: existingTrade.amountIn,
        amountOut: existingTrade.amountOut,
        priceIn: existingTrade.priceIn,
        priceOut: existingTrade.priceOut,
        dex: existingTrade.dex,
        fees: existingTrade.fees,
        blockTime: existingTrade.blockTime,
        notes: existingTrade.notes,
      };
    }

    // Update the trade in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the trade
      const updatedTrade = await tx.trade.update({
        where: { id: tradeId },
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

      // Create audit logs for all changes
      if (auditLogs.length > 0) {
        await tx.tradeAuditLog.createMany({
          data: auditLogs.map(log => ({
            tradeId,
            userId: 'user', // In a real app, this would be from auth
            action: TradeActionType.UPDATE,
            fieldName: log.fieldName,
            oldValue: log.oldValue,
            newValue: log.newValue,
            reason: data.reason,
            timestamp: new Date(),
          })),
        });
      }

      return updatedTrade;
    });

    // TODO: Trigger position and analytics recalculation
    // await recalculatePositions(tradeId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update trade:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete trade with safety checks
export async function DELETE(
  request: NextRequest,
  { params }: { params: { tradeId: string } }
) {
  try {
    const { tradeId } = params;

    // Find the existing trade with dependencies
    const existingTrade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        wallet: {
          select: {
            userId: true,
          },
        },
        positionTrades: {
          include: {
            position: {
              select: {
                id: true,
                symbol: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!existingTrade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    // Check permissions
    // In a real app, verify user ownership
    // if (existingTrade.wallet.userId !== currentUserId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    // Check for dependencies - prevent deletion if trade affects open positions
    const openPositions = existingTrade.positionTrades.filter(
      pt => pt.position.status === 'open'
    );

    if (openPositions.length > 0) {
      const affectedPositions = openPositions.map(pt => pt.position.symbol).join(', ');
      return NextResponse.json(
        { 
          error: `Cannot delete trade that affects open positions: ${affectedPositions}. Please close positions first.`,
          dependencies: {
            openPositions: openPositions.map(pt => ({
              positionId: pt.position.id,
              symbol: pt.position.symbol,
            })),
          },
        },
        { status: 409 }
      );
    }

    // Calculate deletion impact
    const impactAnalysis = await calculateDeletionImpact(tradeId);

    // Delete in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create final audit log
      await tx.tradeAuditLog.create({
        data: {
          tradeId,
          userId: 'user', // In a real app, this would be from auth
          action: TradeActionType.DELETE,
          reason: 'Trade deletion',
          timestamp: new Date(),
        },
      });

      // Delete the trade (audit logs will be cascade deleted)
      await tx.trade.delete({
        where: { id: tradeId },
      });

      return { success: true };
    });

    // TODO: Trigger position and analytics recalculation
    // await recalculatePositionsAfterDeletion(existingTrade);

    return NextResponse.json({
      ...result,
      impactAnalysis,
    });
  } catch (error) {
    console.error('Failed to delete trade:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate change impact
async function calculateChangeImpact(tradeId: string) {
  try {
    // Get related positions and calculate potential impact
    const positionTrades = await prisma.positionTrade.findMany({
      where: { tradeId },
      include: {
        position: true,
      },
    });

    const impactedPositions = positionTrades.map(pt => ({
      positionId: pt.position.id,
      symbol: pt.position.symbol,
      role: pt.role,
      status: pt.position.status,
    }));

    return {
      positionsAffected: impactedPositions.length,
      positions: impactedPositions,
      willRecalculate: impactedPositions.length > 0,
      warnings: impactedPositions.some(p => p.status === 'open') 
        ? ['Editing this trade will affect open position calculations']
        : [],
    };
  } catch (error) {
    console.error('Failed to calculate impact:', error);
    return {
      positionsAffected: 0,
      positions: [],
      willRecalculate: false,
      warnings: ['Unable to calculate impact'],
    };
  }
}

// Helper function to calculate deletion impact
async function calculateDeletionImpact(tradeId: string) {
  try {
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      select: {
        amountIn: true,
        amountOut: true,
        priceOut: true,
        fees: true,
        type: true,
      },
    });

    if (!trade) return null;

    const tradeValue = Number(trade.amountOut) * Number(trade.priceOut || 1);
    const pnlImpact = trade.type === 'sell' ? tradeValue - Number(trade.fees) : -(tradeValue + Number(trade.fees));

    return {
      tradeValue,
      pnlImpact,
      warning: Math.abs(pnlImpact) > 1000 ? 'High-value trade deletion' : undefined,
    };
  } catch (error) {
    console.error('Failed to calculate deletion impact:', error);
    return null;
  }
}