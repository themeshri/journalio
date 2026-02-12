#!/usr/bin/env node

// Standalone OKX API Test Script
// Run with: node test-okx-api.js

const crypto = require('crypto');
const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔧 OKX API Test Script');
console.log('========================\n');

// Check environment variables
const API_KEY = process.env.OKX_API_KEY;
const SECRET_KEY = process.env.OKX_SECRET_KEY;
const PASSPHRASE = process.env.OKX_PASSPHRASE;

console.log('1. Checking API Credentials...');
if (!API_KEY || !SECRET_KEY || !PASSPHRASE) {
    console.log('❌ Missing OKX API credentials in .env.local');
    console.log('   Required: OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE');
    process.exit(1);
}

if (API_KEY === 'your-okx-api-key-here' || 
    SECRET_KEY === 'your-okx-secret-key-here' || 
    PASSPHRASE === 'your-okx-passphrase-here') {
    console.log('❌ OKX API credentials are still placeholder values');
    console.log('   Please set real credentials in .env.local');
    process.exit(1);
}

console.log('✅ API credentials found');

// Generate OKX API signature
function generateSignature(timestamp, method, requestPath, body = '') {
    const message = timestamp + method.toUpperCase() + requestPath + body;
    return crypto.createHmac('sha256', SECRET_KEY).update(message).digest('base64');
}

// Test wallet address (you can change this)
const TEST_WALLET = 'FReKaCqfqYFGD3tqYCwSxwfWoSz2ey9qSPisDkaTj2mK';

console.log('2. Testing OKX API Connection...');
console.log(`   Wallet: ${TEST_WALLET}`);

// Calculate 24 hours ago
const endTime = Date.now();
const startTime = endTime - (24 * 60 * 60 * 1000); // 24 hours ago

const requestPath = `/api/v6/dex/post-transaction/transactions-by-address`;
const queryParams = `?chains=501&address=${TEST_WALLET}&begin=${startTime}&end=${endTime}&limit=50`;
const fullPath = requestPath + queryParams;

const timestamp = Date.now().toString();
const signature = generateSignature(timestamp, 'GET', fullPath);

const options = {
    hostname: 'web3.okx.com',
    port: 443,
    path: fullPath,
    method: 'GET',
    headers: {
        'OK-ACCESS-KEY': API_KEY,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': PASSPHRASE,
        'Content-Type': 'application/json'
    }
};

console.log('3. Making API Request...');
console.log(`   URL: https://web3.okx.com${fullPath}`);

const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            
            console.log(`\n4. API Response (Status: ${res.statusCode}):`);
            console.log('   Headers:', res.headers);
            
            if (res.statusCode === 200) {
                console.log('✅ API Request Successful!');
                
                if (response.code === '0') {
                    const transactions = response.data?.[0]?.transactions || [];
                    console.log(`✅ Found ${transactions.length} transactions in last 24h`);
                    
                    if (transactions.length > 0) {
                        console.log('\n📊 Sample Transactions:');
                        transactions.slice(0, 3).forEach((tx, i) => {
                            console.log(`   ${i + 1}. Hash: ${tx.txHash}`);
                            console.log(`      Type: ${tx.itype} (0=native, 2=token)`);
                            console.log(`      Time: ${new Date(parseInt(tx.txTime)).toISOString()}`);
                            console.log(`      Amount: ${tx.amount} ${tx.symbol || 'SOL'}`);
                            console.log(`      Status: ${tx.txStatus}`);
                            console.log('');
                        });
                    } else {
                        console.log('ℹ️  No transactions found in the last 24 hours');
                        console.log('   This could be normal if the wallet has no recent activity');
                    }
                } else {
                    console.log(`❌ OKX API Error: ${response.msg || 'Unknown error'}`);
                    console.log(`   Code: ${response.code}`);
                }
            } else {
                console.log(`❌ HTTP Error ${res.statusCode}`);
                console.log('   Response:', response);
            }
            
            console.log('\n🔍 Full Response:');
            console.log(JSON.stringify(response, null, 2));
            
        } catch (error) {
            console.log('❌ Failed to parse response:');
            console.log('   Raw data:', data);
            console.log('   Error:', error.message);
        }
    });
});

req.on('error', (error) => {
    console.log('❌ Request failed:');
    console.log('   Error:', error.message);
});

req.setTimeout(10000, () => {
    console.log('❌ Request timeout');
    req.destroy();
});

req.end();

console.log('   Waiting for response...');