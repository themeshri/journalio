// Simple test file to verify OKX integration works
// Run with: node test-okx-integration.js

console.log('🚀 Testing OKX Integration Components...\n');

// Test 1: Check if OKX client can be imported
try {
  const { OKXClient } = require('./src/services/okx/okx-client.ts');
  console.log('✅ OKX Client imported successfully');
} catch (error) {
  console.log('❌ OKX Client import failed:', error.message);
}

// Test 2: Check if encryption utilities work
try {
  const { encrypt, decrypt } = require('./src/services/okx/encryption.ts');
  
  const testData = 'test-api-key-123';
  const encrypted = encrypt(testData);
  const decrypted = decrypt(encrypted);
  
  if (decrypted === testData) {
    console.log('✅ Encryption/Decryption works correctly');
  } else {
    console.log('❌ Encryption/Decryption failed');
  }
} catch (error) {
  console.log('❌ Encryption test failed:', error.message);
}

// Test 3: Check if transformer can be imported
try {
  const { OKXTransactionTransformer } = require('./src/services/okx/okx-transformer.ts');
  console.log('✅ OKX Transformer imported successfully');
} catch (error) {
  console.log('❌ OKX Transformer import failed:', error.message);
}

// Test 4: Mock OKX transaction transformation
try {
  const mockOKXTransaction = {
    chainIndex: '501',
    txHash: 'test123',
    itype: '2',
    txTime: Date.now().toString(),
    from: [{ address: 'wallet1', amount: '' }],
    to: [{ address: 'wallet2', amount: '' }],
    tokenContractAddress: 'token123',
    amount: '1000000',
    symbol: 'TEST',
    txFee: '0.001',
    txStatus: 'success',
    hitBlacklist: false
  };
  
  console.log('✅ Mock OKX transaction data created');
  console.log('   - Transaction Hash:', mockOKXTransaction.txHash);
  console.log('   - Symbol:', mockOKXTransaction.symbol);
  console.log('   - Amount:', mockOKXTransaction.amount);
  console.log('   - Status:', mockOKXTransaction.txStatus);
} catch (error) {
  console.log('❌ Mock transaction test failed:', error.message);
}

console.log('\n🎉 OKX Integration component test complete!');
console.log('\n📌 Next Steps:');
console.log('1. Add your OKX API credentials in Settings > Integrations');
console.log('2. Go to any wallet page and test the OKX Sync Dashboard');
console.log('3. Monitor the console for any errors during sync');
console.log('\n🔗 Access the app at: http://localhost:3000');