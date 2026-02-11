import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing existing data...');
  
  // Clear all existing data in order (respecting foreign key constraints)
  await prisma.tradeMistake.deleteMany({});
  await prisma.journalFile.deleteMany({});
  await prisma.journalEntry.deleteMany({});
  await prisma.customMistake.deleteMany({});
  await prisma.mistakeCategory.deleteMany({});
  await prisma.trade.deleteMany({});
  await prisma.importJob.deleteMany({});
  await prisma.wallet.deleteMany({});
  
  console.log('✅ Database cleared');
  
  // Now we'll let the API create the example trades on next visit
  console.log('📊 Navigate to http://localhost:3000/dashboard/trades to see example trades');
  console.log('   The app will automatically create 20+ example trades on first visit');
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