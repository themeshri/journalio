import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schemas
const createJournalEntrySchema = z.object({
  type: z.enum(['trade', 'position', 'general']),
  targetId: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
  tags: z.array(z.string()).max(20, 'Too many tags'),
  rating: z.number().min(1).max(5).optional()
});

const updateJournalEntrySchema = createJournalEntrySchema.partial();

const searchParamsSchema = z.object({
  type: z.enum(['trade', 'position', 'general']).optional(),
  targetId: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tag list
  search: z.string().optional(),
  rating: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional()
});

// GET: Fetch journal entries with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = searchParamsSchema.parse({
      type: searchParams.get('type'),
      targetId: searchParams.get('targetId'),
      tags: searchParams.get('tags'),
      search: searchParams.get('search'),
      rating: searchParams.get('rating'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset')
    });

    // Build where clause
    const where: any = {
      userId: session.userId
    };

    if (params.type) {
      where.type = params.type;
    }

    if (params.targetId) {
      where.targetId = params.targetId;
    }

    if (params.tags) {
      const tagList = params.tags.split(',').filter(Boolean);
      where.tags = {
        hasSome: tagList
      };
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { content: { contains: params.search, mode: 'insensitive' } },
        { tags: { hasSome: [params.search] } }
      ];
    }

    if (params.rating) {
      where.rating = parseInt(params.rating);
    }

    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) {
        where.createdAt.gte = new Date(params.dateFrom);
      }
      if (params.dateTo) {
        where.createdAt.lte = new Date(params.dateTo);
      }
    }

    // Pagination
    const limit = Math.min(parseInt(params.limit || '50'), 100);
    const offset = parseInt(params.offset || '0');

    // Fetch entries with files
    const entries = await prisma.journalEntry.findMany({
      where,
      include: {
        files: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Transform response to match frontend types
    const transformedEntries = entries.map(entry => ({
      ...entry,
      voiceNotes: entry.files.filter(f => f.fileType === 'audio'),
      files: entry.files.filter(f => f.fileType !== 'audio')
    }));

    return NextResponse.json({ 
      entries: transformedEntries,
      hasMore: entries.length === limit 
    });

  } catch (error) {
    console.error('GET /api/journal/entries error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create new journal entry
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createJournalEntrySchema.parse(body);

    // Create journal entry
    const entry = await prisma.journalEntry.create({
      data: {
        ...validatedData,
        userId: session.userId
      },
      include: {
        files: true
      }
    });

    // Update tag usage counts
    if (validatedData.tags.length > 0) {
      for (const tagName of validatedData.tags) {
        await prisma.journalTag.upsert({
          where: {
            userId_name: {
              userId: session.userId,
              name: tagName
            }
          },
          update: {
            usageCount: {
              increment: 1
            }
          },
          create: {
            name: tagName,
            userId: session.userId,
            usageCount: 1
          }
        });
      }
    }

    // Transform response
    const transformedEntry = {
      ...entry,
      voiceNotes: entry.files.filter(f => f.fileType === 'audio'),
      files: entry.files.filter(f => f.fileType !== 'audio')
    };

    return NextResponse.json({ entry: transformedEntry }, { status: 201 });

  } catch (error) {
    console.error('POST /api/journal/entries error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update existing journal entry
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('id');
    
    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateJournalEntrySchema.parse(body);

    // Check if entry exists and belongs to user
    const existingEntry = await prisma.journalEntry.findFirst({
      where: {
        id: entryId,
        userId: session.userId
      }
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Update journal entry
    const entry = await prisma.journalEntry.update({
      where: {
        id: entryId
      },
      data: validatedData,
      include: {
        files: true
      }
    });

    // Update tag usage counts if tags changed
    if (validatedData.tags) {
      // Decrease count for old tags
      if (existingEntry.tags.length > 0) {
        for (const tagName of existingEntry.tags) {
          await prisma.journalTag.updateMany({
            where: {
              userId: session.userId,
              name: tagName
            },
            data: {
              usageCount: {
                decrement: 1
              }
            }
          });
        }
      }

      // Increase count for new tags
      if (validatedData.tags.length > 0) {
        for (const tagName of validatedData.tags) {
          await prisma.journalTag.upsert({
            where: {
              userId_name: {
                userId: session.userId,
                name: tagName
              }
            },
            update: {
              usageCount: {
                increment: 1
              }
            },
            create: {
              name: tagName,
              userId: session.userId,
              usageCount: 1
            }
          });
        }
      }
    }

    // Transform response
    const transformedEntry = {
      ...entry,
      voiceNotes: entry.files.filter(f => f.fileType === 'audio'),
      files: entry.files.filter(f => f.fileType !== 'audio')
    };

    return NextResponse.json({ entry: transformedEntry });

  } catch (error) {
    console.error('PUT /api/journal/entries error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove journal entry and associated files
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('id');
    
    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    // Check if entry exists and belongs to user
    const existingEntry = await prisma.journalEntry.findFirst({
      where: {
        id: entryId,
        userId: session.userId
      },
      include: {
        files: true
      }
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Delete associated files from storage (if any)
    // Note: In a real implementation, you would delete from Supabase storage here
    const fileDeletionPromises = existingEntry.files.map(async (file) => {
      // await deleteFile(file.storageUrl); // Implement this with Supabase
      console.log('Would delete file:', file.fileName);
    });

    await Promise.allSettled(fileDeletionPromises);

    // Update tag usage counts
    if (existingEntry.tags.length > 0) {
      for (const tagName of existingEntry.tags) {
        await prisma.journalTag.updateMany({
          where: {
            userId: session.userId,
            name: tagName
          },
          data: {
            usageCount: {
              decrement: 1
            }
          }
        });
      }
    }

    // Delete journal entry (files will be cascade deleted)
    await prisma.journalEntry.delete({
      where: {
        id: entryId
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('DELETE /api/journal/entries error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}