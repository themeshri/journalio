#!/usr/bin/env node

/**
 * Test script to debug wallet fetching issues
 * Usage: node test-wallet-fetch.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testWalletFetch() {
  console.log('🔍 Testing Wallet Fetch Functionality');
  console.log('📡 API Base:', API_BASE);
  console.log('');
  
  try {
    // Test 1: Get all wallets
    console.log('=== Test 1: Get All Wallets ===');
    const walletsResponse = await axios.get(`${API_BASE}/wallets`);
    console.log('✅ Status:', walletsResponse.status);
    console.log('📊 Wallets found:', walletsResponse.data.length);
    
    if (walletsResponse.data.length > 0) {
      const wallet = walletsResponse.data[0];
      console.log('🎯 Using wallet:', wallet.address);
      console.log('');
      
      // Test 2: Get specific wallet
      console.log('=== Test 2: Get Specific Wallet ===');
      const walletResponse = await axios.get(`${API_BASE}/wallets/${wallet.id}`);
      console.log('✅ Status:', walletResponse.status);
      console.log('📊 Wallet data:', JSON.stringify(walletResponse.data, null, 2));
      console.log('');
      
      // Test 3: Test Zerion sync (expect rate limit)
      console.log('=== Test 3: Test Zerion Sync (may hit rate limit) ===');
      try {
        const syncResponse = await axios.post(`${API_BASE}/zerion/sync`, {
          walletId: wallet.id,
          syncType: '24h'
        });
        console.log('✅ Sync Status:', syncResponse.status);
        console.log('📊 Sync result:', syncResponse.data);
      } catch (syncError) {
        console.log('⚠️  Sync Error (expected if rate limited):', syncError.response?.status);
        console.log('📊 Error details:', syncError.response?.data);
      }
      console.log('');
      
      // Test 4: Check providers
      console.log('=== Test 4: Check Sync Providers ===');
      const providersResponse = await axios.get(`${API_BASE}/sync/providers`);
      console.log('✅ Status:', providersResponse.status);
      console.log('📊 Providers:', JSON.stringify(providersResponse.data, null, 2));
      console.log('');
      
      // Test 5: Check Zerion config
      console.log('=== Test 5: Check Zerion Configuration ===');
      const configResponse = await axios.get(`${API_BASE}/zerion/config`);
      console.log('✅ Status:', configResponse.status);
      console.log('📊 Config ready:', configResponse.data.ready);
      console.log('📊 Default provider:', configResponse.data.config.defaultProvider);
      console.log('');
      
    } else {
      console.log('⚠️  No wallets found in database');
    }
    
    console.log('🎉 All wallet API tests completed!');
    
  } catch (error) {
    console.error('💥 Test failed:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      data: error.response?.data
    });
  }
}

// Run the test
testWalletFetch();