#!/usr/bin/env node

/**
 * Terminal test script for Zerion API
 * Usage: node test-zerion-terminal.js [wallet_address]
 */

const axios = require('axios');

// Configuration
const ZERION_API_KEY = 'emtfY2ZmNTU2ZDQ3M2JiNGM2Zjk4N2I0OGViOTUwNGU1NjI6';
const BASE_URL = 'https://api.zerion.io/v1';
const DEFAULT_WALLET = 'FReKaCqfqYFGD3tqYCwSxwfWoSz2ey9qSPisDkaTj2mK';

// Get wallet address from command line args
const walletAddress = process.argv[2] || DEFAULT_WALLET;

console.log('🔍 Testing Zerion API with wallet:', walletAddress);
console.log('📡 Base URL:', BASE_URL);
console.log('🔑 API Key:', ZERION_API_KEY.substring(0, 12) + '...');
console.log('');

// Create axios client
const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Basic ${ZERION_API_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000
});

// Add request/response interceptors
client.interceptors.request.use(request => {
  console.log('📤 REQUEST:', request.method?.toUpperCase(), request.url);
  console.log('📤 Headers:', JSON.stringify(request.headers, null, 2));
  return request;
});

client.interceptors.response.use(
  response => {
    console.log('✅ RESPONSE:', response.status, `(${response.data?.data?.length || 0} items)`);
    return response;
  },
  error => {
    console.log('❌ ERROR:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

async function testZerionConnection() {
  try {
    console.log('=== Testing Zerion Connection ===\n');
    
    // Test 1: Basic wallet transactions
    console.log('Test 1: Fetch recent transactions (limit 3)');
    const response = await client.get(`/wallets/${walletAddress}/transactions/`, {
      params: {
        'page[size]': 3,
        'filter[trash]': 'only_non_trash'
      }
    });
    
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
    console.log('');
    
    // Test 2: Check rate limiting with delay
    console.log('Test 2: Testing rate limits (with 2s delay)');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response2 = await client.get(`/wallets/${walletAddress}/transactions/`, {
      params: {
        'page[size]': 1,
        'filter[trash]': 'only_non_trash'
      }
    });
    
    console.log('✅ Second request successful');
    console.log('');
    
    // Test 3: Check 24h filter
    console.log('Test 3: Testing 24h transactions');
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response3 = await client.get(`/wallets/${walletAddress}/transactions/`, {
      params: {
        'page[size]': 5,
        'filter[trash]': 'only_non_trash',
        'filter[min_mined_at]': oneDayAgo
      }
    });
    
    console.log('📅 24h transactions found:', response3.data?.data?.length || 0);
    console.log('');
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('💥 Test failed:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    if (error.response?.status === 429) {
      console.log('\n⚠️  RATE LIMIT DETECTED');
      console.log('   Try again in a few minutes');
      console.log('   Consider adding delays between requests');
    }
    
    if (error.response?.status === 401) {
      console.log('\n⚠️  AUTHENTICATION ERROR');
      console.log('   Check your API key configuration');
    }
  }
}

// Run the test
testZerionConnection();