import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { OKXClient } from '@/services/okx/okx-client';
import { encrypt, decrypt } from '@/services/okx/encryption';

/**
 * Save OKX API configuration
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const { apiKey, secretKey, passphrase } = await req.json();

    // Validate required fields
    if (!apiKey || !secretKey || !passphrase) {
      return NextResponse.json(
        { error: 'Missing required credentials' },
        { status: 400 }
      );
    }

    // Test credentials by making a test API call
    const testClient = new OKXClient(apiKey, secretKey, passphrase);
    try {
      await testClient.testConnection();
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid OKX API credentials')) {
        return NextResponse.json(
          { error: 'Invalid OKX API credentials. Please check your API key, secret, and passphrase.' },
          { status: 400 }
        );
      }
      // Other errors might be network issues, let them through
      console.error('OKX connection test error:', error);
    }

    // Encrypt sensitive data
    const encryptedApiKey = encrypt(apiKey);
    const encryptedSecretKey = encrypt(secretKey);
    const encryptedPassphrase = encrypt(passphrase);

    // Save or update configuration
    await prisma.oKXApiConfig.upsert({
      where: { userId },
      update: {
        apiKey: encryptedApiKey,
        secretKey: encryptedSecretKey,
        passphrase: encryptedPassphrase,
        isActive: true,
        lastUsed: new Date()
      },
      create: {
        userId,
        apiKey: encryptedApiKey,
        secretKey: encryptedSecretKey,
        passphrase: encryptedPassphrase,
        isActive: true
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'OKX API configuration saved successfully'
    });

  } catch (error) {
    console.error('Config save error:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}

/**
 * Get OKX API configuration status
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth();
    
    const config = await prisma.oKXApiConfig.findUnique({
      where: { userId },
      select: { 
        isActive: true, 
        lastUsed: true, 
        createdAt: true,
        updatedAt: true
      }
    });

    if (!config) {
      return NextResponse.json({
        configured: false,
        isActive: false,
        message: 'No OKX API configuration found'
      });
    }

    return NextResponse.json({
      configured: true,
      isActive: config.isActive,
      lastUsed: config.lastUsed,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    });

  } catch (error) {
    console.error('Config fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    );
  }
}

/**
 * Delete OKX API configuration
 */
export async function DELETE(req: NextRequest) {
  try {
    const userId = await requireAuth();
    
    await prisma.oKXApiConfig.delete({
      where: { userId }
    });

    return NextResponse.json({ 
      success: true,
      message: 'OKX API configuration deleted successfully'
    });

  } catch (error) {
    console.error('Config delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete configuration' },
      { status: 500 }
    );
  }
}