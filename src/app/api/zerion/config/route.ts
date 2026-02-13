import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

/**
 * Get Zerion configuration status
 */
export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const config = {
      // API Configuration
      hasApiKey: !!process.env.ZERION_API_KEY && process.env.ZERION_API_KEY !== 'your-zerion-api-key-here',
      apiKeyMasked: process.env.ZERION_API_KEY 
        ? `${process.env.ZERION_API_KEY.substring(0, 8)}...${process.env.ZERION_API_KEY.substring(-4)}`
        : 'Not configured',
      
      // Feature Flags
      syncEnabled: process.env.ENABLE_ZERION_SYNC !== 'false',
      defaultProvider: process.env.DEFAULT_SYNC_PROVIDER || 'zerion',
      isDefaultProvider: process.env.DEFAULT_SYNC_PROVIDER === 'zerion',
      
      // Sync Configuration
      pageLimit: parseInt(process.env.ZERION_SYNC_PAGE_LIMIT || '10'),
      rateLimitDelay: parseInt(process.env.ZERION_RATE_LIMIT_DELAY || '1000'),
      autoSyncEnabled: process.env.ENABLE_AUTO_SYNC !== 'false',
      autoSyncInterval: parseInt(process.env.AUTO_SYNC_INTERVAL || '24'),
      
      
      // Environment status
      environment: process.env.NODE_ENV || 'development',
      
      // Recommendations
      recommendations: []
    };

    // Generate recommendations
    if (!config.hasApiKey) {
      config.recommendations.push({
        type: 'error',
        message: 'Zerion API key is not configured. Add ZERION_API_KEY to your environment variables.'
      });
    }

    if (!config.syncEnabled) {
      config.recommendations.push({
        type: 'warning',
        message: 'Zerion sync is disabled. Set ENABLE_ZERION_SYNC=true to enable.'
      });
    }

    if (config.defaultProvider !== 'zerion' && config.hasApiKey) {
      config.recommendations.push({
        type: 'info',
        message: 'Zerion is configured but not set as default provider. Set DEFAULT_SYNC_PROVIDER=zerion to use as primary data source.'
      });
    }

    if (config.pageLimit === 0) {
      config.recommendations.push({
        type: 'warning',
        message: 'No page limit set - this may cause very long sync times for wallets with many transactions.'
      });
    }

    if (config.pageLimit > 50) {
      config.recommendations.push({
        type: 'info',
        message: 'High page limit may cause slow sync for large wallets. Consider reducing for better performance.'
      });
    }

    return NextResponse.json({
      success: true,
      config,
      ready: config.hasApiKey && config.syncEnabled,
      message: config.hasApiKey && config.syncEnabled 
        ? 'Zerion integration is ready to use'
        : 'Zerion integration requires configuration'
    });

  } catch (error) {
    console.error('Get Zerion config error:', error);
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    );
  }
}

/**
 * Update Zerion configuration (for runtime settings)
 */
export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    
    // Note: This is a placeholder for runtime configuration updates
    // Environment variables cannot be changed at runtime
    // This could be extended to use a database-stored configuration
    
    return NextResponse.json({
      success: false,
      message: 'Configuration updates require restarting the application with updated environment variables.',
      supportedUpdates: [
        'ENABLE_ZERION_SYNC',
        'DEFAULT_SYNC_PROVIDER', 
        'ZERION_SYNC_PAGE_LIMIT',
        'ZERION_RATE_LIMIT_DELAY'
      ]
    });
    
  } catch (error) {
    console.error('Update Zerion config error:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}