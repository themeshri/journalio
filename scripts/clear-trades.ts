import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing trades and wallets...');
  
  try {
    // Clear trades and wallets to allow fresh creation
    await prisma.trade.deleteMany({});
    await prisma.wallet.deleteMany({});
    
    console.log('✅ Trades and wallets cleared');
    console.log('📊 Now navigate to http://localhost:3000/dashboard/trades');
    console.log('   The app will automatically create example trades!');
  } catch (error) {
    console.log('📝 Tables may not exist yet, that\'s ok');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });