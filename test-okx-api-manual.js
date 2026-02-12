#!/usr/bin/env node

// Manual OKX API Test Script
// Usage: node test-okx-api-manual.js [API_KEY] [SECRET_KEY] [PASSPHRASE] [WALLET_ADDRESS]
// Example: node test-okx-api-manual.js your_key your_secret your_pass FReKa...

const crypto = require('crypto');
const https = require('https');

console.log('🔧 Manual OKX API Test');
console.log('======================\n');

// Get credentials from command line arguments or show help
const [,, apiKey, secretKey, passphrase, walletAddress] = process.argv;

if (!apiKey || !secretKey || !passphrase) {
    console.log('Usage: node test-okx-api-manual.js [API_KEY] [SECRET_KEY] [PASSPHRASE] [WALLET_ADDRESS]');
    console.log('');
    console.log('Example:');
    console.log('node test-okx-api-manual.js your_api_key your_secret_key your_passphrase FReKaCqfqYFGD3tqYCwSxwfWoSz2ey9qSPisDkaTj2mK');
    console.log('');
    console.log('To get OKX API credentials:');
    console.log('1. Visit https://web3.okx.com/');
    console.log('2. Sign up and create an API key');
    console.log('3. Enable wallet permissions');
    console.log('');
    console.log('Current test (with placeholder credentials):');
    testPlaceholder();
    return;
}

const testWallet = walletAddress || 'FReKaCqfqYFGD3tqYCwSxwfWoSz2ey9qSPisDkaTj2mK';

console.log('Testing with provided credentials...');
console.log(`API Key: ${apiKey.substring(0, 8)}...`);
console.log(`Secret: ${secretKey.substring(0, 8)}...`);
console.log(`Passphrase: ${passphrase.substring(0, 3)}...`);
console.log(`Wallet: ${testWallet}`);
console.log('');

// Test the API
testOKXAPI(apiKey, secretKey, passphrase, testWallet);

function testPlaceholder() {
    console.log('🧪 Testing API Request Format...');
    
    // Show what the request would look like
    const testWallet = 'FReKaCqfqYFGD3tqYCwSxwfWoSz2ey9qSPisDkaTj2mK';
    const endTime = Date.now();
    const startTime = endTime - (24 * 60 * 60 * 1000);
    const requestPath = '/api/v6/dex/post-transaction/transactions-by-address';
    const queryParams = `?chains=501&address=${testWallet}&begin=${startTime}&end=${endTime}&limit=50`;
    
    console.log('Request Details:');
    console.log(`URL: https://web3.okx.com${requestPath}${queryParams}`);
    console.log(`Chain: Solana (chainIndex=501)`);
    console.log(`Wallet: ${testWallet}`);
    console.log(`Time Range: Last 24 hours`);
    console.log(`Start: ${new Date(startTime).toISOString()}`);
    console.log(`End: ${new Date(endTime).toISOString()}`);
    
    console.log('\n📋 Required Headers:');
    console.log('- OK-ACCESS-KEY: [your api key]');
    console.log('- OK-ACCESS-SIGN: [HMAC SHA256 signature]');
    console.log('- OK-ACCESS-TIMESTAMP: [current timestamp]');
    console.log('- OK-ACCESS-PASSPHRASE: [your passphrase]');
    console.log('- Content-Type: application/json');
    
    console.log('\n🔗 To test with real credentials, run:');
    console.log('node test-okx-api-manual.js [API_KEY] [SECRET_KEY] [PASSPHRASE] [WALLET]');
}

function generateSignature(timestamp, method, requestPath, body, secretKey) {
    const message = timestamp + method.toUpperCase() + requestPath + body;
    return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
}

function testOKXAPI(apiKey, secretKey, passphrase, walletAddress) {
    const endTime = Date.now();
    const startTime = endTime - (24 * 60 * 60 * 1000); // 24 hours ago
    
    const requestPath = '/api/v6/dex/post-transaction/transactions-by-address';
    const queryParams = `?chains=501&address=${walletAddress}&begin=${startTime}&end=${endTime}&limit=50`;
    const fullPath = requestPath + queryParams;
    
    const timestamp = Date.now().toString();
    const signature = generateSignature(timestamp, 'GET', fullPath, '', secretKey);
    
    const options = {
        hostname: 'web3.okx.com',
        port: 443,
        path: fullPath,
        method: 'GET',
        headers: {
            'OK-ACCESS-KEY': apiKey,
            'OK-ACCESS-SIGN': signature,
            'OK-ACCESS-TIMESTAMP': timestamp,
            'OK-ACCESS-PASSPHRASE': passphrase,
            'Content-Type': 'application/json'
        }
    };
    
    console.log('🚀 Making API Request...');
    console.log(`   Timestamp: ${timestamp}`);
    console.log(`   Signature: ${signature.substring(0, 20)}...`);
    
    const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                
                console.log(`\n📡 Response (HTTP ${res.statusCode}):`);
                
                if (res.statusCode === 200) {
                    if (response.code === '0') {
                        console.log('✅ SUCCESS! API authentication working');
                        const transactions = response.data?.[0]?.transactions || [];
                        console.log(`📊 Found ${transactions.length} transactions in last 24h`);
                        
                        if (transactions.length > 0) {
                            console.log('\n🔍 Recent Transactions:');
                            transactions.slice(0, 5).forEach((tx, i) => {
                                console.log(`${i + 1}. ${tx.txHash.substring(0, 20)}...`);
                                console.log(`   Type: ${getTransactionType(tx.itype)}`);
                                console.log(`   Time: ${new Date(parseInt(tx.txTime)).toLocaleString()}`);
                                console.log(`   Amount: ${tx.amount} ${tx.symbol || 'SOL'}`);
                                console.log(`   Status: ${tx.txStatus}`);
                                console.log('');
                            });
                        } else {
                            console.log('ℹ️  No recent transactions (this is normal for inactive wallets)');
                        }
                    } else {
                        console.log(`❌ OKX API Error: ${response.msg}`);
                        console.log(`   Error Code: ${response.code}`);
                        
                        if (response.code === '50001') {
                            console.log('   → API Key authentication failed');
                        } else if (response.code === '50002') {
                            console.log('   → Timestamp error');
                        } else if (response.code === '50003') {
                            console.log('   → Passphrase error');
                        } else if (response.code === '50004') {
                            console.log('   → Signature error');
                        }
                    }
                } else {
                    console.log(`❌ HTTP Error ${res.statusCode}`);
                    if (res.statusCode === 401) {
                        console.log('   → Authentication failed - check your API credentials');
                    } else if (res.statusCode === 403) {
                        console.log('   → Access forbidden - check API permissions');
                    } else if (res.statusCode === 429) {
                        console.log('   → Rate limited - try again later');
                    }
                }
                
                console.log('\n🔍 Full API Response:');
                console.log(JSON.stringify(response, null, 2));
                
            } catch (error) {
                console.log('❌ Failed to parse response:');
                console.log('Raw response:', data);
                console.log('Parse error:', error.message);
            }
        });
    });
    
    req.on('error', (error) => {
        console.log('❌ Network error:', error.message);
    });
    
    req.setTimeout(15000, () => {
        console.log('❌ Request timeout (15s)');
        req.destroy();
    });
    
    req.end();
}

function getTransactionType(itype) {
    switch(itype) {
        case '0': return 'Native SOL Transfer';
        case '2': return 'SPL Token Transfer';
        case '1': return 'Contract Interaction';
        default: return `Unknown (${itype})`;
    }
}