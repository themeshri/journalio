import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: Fetch custom mistakes for the user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mistakes = await prisma.customMistake.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ mistakes });
  } catch (error) {
    console.error('GET /api/mistakes/custom error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new custom mistake
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, severity, color } = body;

    if (!name || !severity) {
      return NextResponse.json(
        { error: 'Name and severity are required' },
        { status: 400 }
      );
    }

    const mistake = await prisma.customMistake.create({
      data: {
        name,
        description: description || '',
        severity,
        color: color || '#6b7280',
        userId: session.userId,
      },
    });

    return NextResponse.json({ mistake }, { status: 201 });
  } catch (error) {
    console.error('POST /api/mistakes/custom error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update a custom mistake
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mistakeId = searchParams.get('id');

    if (!mistakeId) {
      return NextResponse.json(
        { error: 'Mistake ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.customMistake.findFirst({
      where: {
        id: mistakeId,
        userId: session.userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Mistake not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, severity, color } = body;

    const updated = await prisma.customMistake.update({
      where: { id: mistakeId },
      data: {
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        severity: severity || existing.severity,
        color: color || existing.color,
      },
    });

    return NextResponse.json({ mistake: updated });
  } catch (error) {
    console.error('PUT /api/mistakes/custom error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a custom mistake
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mistakeId = searchParams.get('id');

    if (!mistakeId) {
      return NextResponse.json(
        { error: 'Mistake ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.customMistake.findFirst({
      where: {
        id: mistakeId,
        userId: session.userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Mistake not found' },
        { status: 404 }
      );
    }

    // Check if it's being used
    const usageCount = await prisma.tradeMistake.count({
      where: { customMistakeId: mistakeId },
    });

    if (usageCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete mistake that is being used in trades' },
        { status: 400 }
      );
    }

    await prisma.customMistake.delete({
      where: { id: mistakeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/mistakes/custom error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}