#!/usr/bin/env node

/**
 * Test with a different wallet address to avoid rate limits
 * Usage: node test-fresh-wallet.js [your_wallet_address]
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Use a different wallet address to test
const TEST_WALLET = process.argv[2] || 'EhE2QdgvgAWBKnNhkEJ2Uyv4ggZgKDCqZdnCkCjrJh6c'; // Different Solana wallet

async function testFreshWallet() {
  console.log('🆕 Testing with Fresh Wallet Address');
  console.log('📡 API Base:', API_BASE);
  console.log('🎯 Test Wallet:', TEST_WALLET);
  console.log('');
  
  try {
    // Step 1: Add the new wallet
    console.log('=== Step 1: Adding New Test Wallet ===');
    try {
      const addWalletResponse = await axios.post(`${API_BASE}/wallets`, {
        address: TEST_WALLET,
        name: 'Test Wallet',
        chain: 'SOLANA'
      });
      
      console.log('✅ Wallet added:', addWalletResponse.status);
      console.log('🆔 New wallet ID:', addWalletResponse.data.wallet.id);
      
      const newWallet = addWalletResponse.data.wallet;
      
      // Step 2: Test sync with fresh wallet
      console.log('');
      console.log('=== Step 2: Testing Sync with Fresh Wallet ===');
      
      const syncResponse = await axios.post(`${API_BASE}/zerion/sync`, {
        walletId: newWallet.id,
        walletAddress: newWallet.address,
        syncType: '24h'
      });
      
      console.log('✅ Sync Status:', syncResponse.status);
      console.log('📊 Sync Result:', JSON.stringify(syncResponse.data, null, 2));
      
      // Step 3: Check if transactions were saved
      console.log('');
      console.log('=== Step 3: Check Saved Transactions ===');
      
      // Wait a moment for async processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const tradesResponse = await axios.get(`${API_BASE}/trades`);
      const newWalletTrades = tradesResponse.data.filter(trade => 
        trade.walletId === newWallet.id
      );
      
      console.log('📊 Total trades in system:', tradesResponse.data.length);
      console.log('📊 Trades for new wallet:', newWalletTrades.length);
      
      if (newWalletTrades.length > 0) {
        console.log('✅ Sample trade:', {
          signature: newWalletTrades[0].signature,
          type: newWalletTrades[0].type,
          tokenIn: newWalletTrades[0].tokenIn,
          tokenOut: newWalletTrades[0].tokenOut,
          confidence: newWalletTrades[0].zerionConfidence
        });
      }
      
    } catch (addError) {
      if (addError.response?.data?.error?.includes('already exists')) {
        console.log('ℹ️  Wallet already exists, testing sync only');
        
        // Get existing wallet
        const walletsResponse = await axios.get(`${API_BASE}/wallets`);
        const existingWallet = walletsResponse.data.find(w => w.address === TEST_WALLET);
        
        if (existingWallet) {
          console.log('🎯 Using existing wallet:', existingWallet.id);
          
          const syncResponse = await axios.post(`${API_BASE}/zerion/sync`, {
            walletId: existingWallet.id,
            walletAddress: existingWallet.address,
            syncType: '24h'
          });
          
          console.log('✅ Sync Status:', syncResponse.status);
          console.log('📊 Sync Result:', JSON.stringify(syncResponse.data, null, 2));
        }
      } else {
        throw addError;
      }
    }
    
    console.log('');
    console.log('🎉 Fresh wallet test completed!');
    console.log('💡 If you want to test with your own wallet, run:');
    console.log(`   node test-fresh-wallet.js YOUR_WALLET_ADDRESS`);
    
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('⚠️  Still rate limited. Try these options:');
      console.log('   1. Use a different API key if available');
      console.log('   2. Wait 10-15 minutes for rate limit to reset');
      console.log('   3. Test with a wallet that has fewer recent API calls');
    } else {
      console.error('💥 Test failed:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
    }
  }
}

testFreshWallet();