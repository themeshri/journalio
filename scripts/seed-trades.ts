import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with example trades...');

  try {
    // First check if wallet exists
    let wallet = await prisma.wallet.findFirst({
      where: {
        userId: 'dev-user-123',
        address: '7xKXtg2CW87d7TXQ4q6Zqm2Z7Xqr4q5X4q5X4q5X4q5X',
        chain: 'SOLANA'
      }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          address: '7xKXtg2CW87d7TXQ4q6Zqm2Z7Xqr4q5X4q5X4q5X4q5X',
          label: 'Main Trading Wallet',
          chain: 'SOLANA',
          userId: 'dev-user-123',
          isActive: true,
        },
      });
      console.log('✅ Created wallet:', wallet.label || 'Wallet');
    } else {
      console.log('✅ Using existing wallet:', wallet.label || 'Wallet');
    }

    // Create sample trades
    const trades = [
      {
        type: 'BUY' as const,
        tokenIn: 'SOL',
        tokenOut: 'BONK',
        amountIn: 10,
        amountOut: 5000000,
        priceIn: 95.50,
        priceOut: 0.0000191,
        executedAt: new Date('2024-02-10T10:30:00'),
        transactionHash: '3nX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E4',
        dex: 'Jupiter',
        fees: 0.005,
        walletId: wallet.id,
        userId: 'dev-user-123',
        notes: 'Saw increasing volume, good entry point',
        isManual: false,
      },
      {
        type: 'SELL' as const,
        tokenIn: 'BONK',
        tokenOut: 'SOL',
        amountIn: 2500000,
        amountOut: 5.2,
        priceIn: 0.0000208,
        priceOut: 96.15,
        executedAt: new Date('2024-02-10T14:45:00'),
        transactionHash: '4nX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E5',
        dex: 'Raydium',
        fees: 0.003,
        walletId: wallet.id,
        userId: 'dev-user-123',
        notes: 'Taking partial profits at resistance',
        isManual: false,
      },
      {
        type: 'BUY' as const,
        tokenIn: 'USDC',
        tokenOut: 'WIF',
        amountIn: 500,
        amountOut: 150,
        priceIn: 1,
        priceOut: 3.33,
        executedAt: new Date('2024-02-09T09:15:00'),
        transactionHash: '5nX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E6',
        dex: 'Orca',
        fees: 0.75,
        walletId: wallet.id,
        userId: 'dev-user-123',
        notes: 'Dogwifhat looking strong, momentum play',
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
        userId: 'dev-user-123',
        notes: 'Great trade! +20% profit',
        isManual: false,
      },
      {
        type: 'BUY' as const,
        tokenIn: 'SOL',
        tokenOut: 'JTO',
        amountIn: 25,
        amountOut: 625,
        priceIn: 94.80,
        priceOut: 3.79,
        executedAt: new Date('2024-02-08T16:30:00'),
        transactionHash: '7nX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E8',
        dex: 'Raydium',
        fees: 0.0125,
        walletId: wallet.id,
        userId: 'dev-user-123',
        notes: 'JTO airdrop news, expecting pump',
        isManual: true,
      },
      {
        type: 'BUY' as const,
        tokenIn: 'USDC',
        tokenOut: 'PYTH',
        amountIn: 1000,
        amountOut: 2500,
        priceIn: 1,
        priceOut: 0.40,
        executedAt: new Date('2024-02-07T13:00:00'),
        transactionHash: '8nX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E9',
        dex: 'Orca',
        fees: 1.5,
        walletId: wallet.id,
        userId: 'dev-user-123',
        notes: 'Oracle play, mainnet launch coming',
        isManual: false,
      },
      {
        type: 'SELL' as const,
        tokenIn: 'PYTH',
        tokenOut: 'USDC',
        amountIn: 1000,
        amountOut: 450,
        priceIn: 0.45,
        priceOut: 1,
        executedAt: new Date('2024-02-08T10:15:00'),
        transactionHash: '9nX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E0',
        dex: 'Jupiter',
        fees: 0.675,
        walletId: wallet.id,
        userId: 'dev-user-123',
        notes: 'Quick scalp trade, +12.5%',
        isManual: false,
      },
      {
        type: 'BUY' as const,
        tokenIn: 'SOL',
        tokenOut: 'RENDER',
        amountIn: 15,
        amountOut: 200,
        priceIn: 93.00,
        priceOut: 6.975,
        executedAt: new Date('2024-02-06T08:45:00'),
        transactionHash: '1aX9h2K4m5L6p7Q8r9S1t2U3v4W5x6Y7z8A9b1C2d3E1',
        dex: 'Raydium',
        fees: 0.0075,
        walletId: wallet.id,
        userId: 'dev-user-123',
        notes: 'AI narrative still strong',
        isManual: true,
      },
    ];

    // Check if trades already exist
    const existingTrades = await prisma.trade.count({
      where: { userId: 'dev-user-123' }
    });

    if (existingTrades > 0) {
      console.log(`ℹ️  Found ${existingTrades} existing trades, skipping trade creation`);
    } else {
      // Create trades
      for (const tradeData of trades) {
        const trade = await prisma.trade.create({
          data: tradeData,
        });
        console.log(`✅ Created ${trade.type} trade: ${trade.tokenIn} → ${trade.tokenOut}`);
      }
    }

    // Create predefined mistake categories if they don't exist
    const mistakeCategories = [
      {
        code: 'FOMO_ENTRY',
        name: 'FOMO Entry',
        description: 'Entered trade due to fear of missing out',
        severity: 'HIGH' as const,
        color: '#ef4444',
      },
      {
        code: 'POOR_RISK_MGMT',
        name: 'Poor Risk Management',
        description: 'Position size too large or no stop loss',
        severity: 'HIGH' as const,
        color: '#dc2626',
      },
      {
        code: 'EARLY_EXIT',
        name: 'Early Exit',
        description: 'Exited position too early, left profits on table',
        severity: 'MEDIUM' as const,
        color: '#f97316',
      },
      {
        code: 'NO_PLAN',
        name: 'No Trading Plan',
        description: 'Entered without clear entry/exit strategy',
        severity: 'MEDIUM' as const,
        color: '#fb923c',
      },
    ];

    for (const category of mistakeCategories) {
      const existing = await prisma.mistakeCategory.findFirst({
        where: { code: category.code }
      });
      
      if (!existing) {
        await prisma.mistakeCategory.create({
          data: category,
        });
        console.log(`✅ Created mistake category: ${category.name}`);
      }
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('📊 You can now view trades at http://localhost:3000/dashboard/trades');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });