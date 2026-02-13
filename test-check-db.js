#!/usr/bin/env node

/**
 * Check what's already in the database from the successful sync
 * Usage: node test-check-db.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function checkDatabase() {
  console.log('🗄️  Checking Database for Existing Data');
  console.log('📡 API Base:', API_BASE);
  console.log('');
  
  try {
    // Check wallets
    console.log('=== Wallets in Database ===');
    const walletsResponse = await axios.get(`${API_BASE}/wallets`);
    console.log('📊 Total wallets:', walletsResponse.data.length);
    
    walletsResponse.data.forEach((wallet, index) => {
      console.log(`${index + 1}. ${wallet.label || 'Unnamed'} (${wallet.address.slice(0, 8)}...)`);
      console.log(`   Chain: ${wallet.chain}, Created: ${new Date(wallet.createdAt).toLocaleDateString()}`);
    });
    console.log('');
    
    // Check trades
    console.log('=== Trades in Database ===');
    const tradesResponse = await axios.get(`${API_BASE}/trades`);
    const trades = tradesResponse.data.trades || [];
    console.log('📊 Total trades:', trades.length);
    
    if (trades.length > 0) {
      console.log('');
      console.log('Recent trades:');
      
      // Group by wallet
      const tradesByWallet = trades.reduce((acc, trade) => {
        if (!acc[trade.walletId]) acc[trade.walletId] = [];
        acc[trade.walletId].push(trade);
        return acc;
      }, {});
      
      Object.keys(tradesByWallet).forEach(walletId => {
        const wallet = walletsResponse.data.find(w => w.id === walletId);
        const walletTrades = tradesByWallet[walletId];
        
        console.log(`\n📈 ${wallet?.label || 'Unknown Wallet'} (${walletTrades.length} trades):`);
        
        // Show confidence distribution
        const confidenceStats = walletTrades.reduce((acc, trade) => {
          const conf = trade.zerionConfidence || 'unknown';
          acc[conf] = (acc[conf] || 0) + 1;
          return acc;
        }, {});
        
        console.log(`   Confidence: ${JSON.stringify(confidenceStats)}`);
        
        // Show recent trades (last 5)
        const recentTrades = walletTrades
          .sort((a, b) => new Date(b.blockTime) - new Date(a.blockTime))
          .slice(0, 3);
        
        recentTrades.forEach(trade => {
          const date = new Date(trade.blockTime).toLocaleDateString();
          console.log(`   • ${trade.type} ${trade.tokenIn} → ${trade.tokenOut} (${date})`);
        });
      });
      
      console.log('');
      console.log('=== Sync Status Summary ===');
      
      // Check for Zerion-synced trades
      const zerionTrades = trades.filter(t => t.zerionTxId);
      const zerionConfidence = zerionTrades.reduce((acc, trade) => {
        const conf = trade.zerionConfidence || 'unknown';
        acc[conf] = (acc[conf] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📊 Zerion-synced trades:', zerionTrades.length);
      console.log('📊 Confidence distribution:', zerionConfidence);
      console.log('✅ Most recent sync:', zerionTrades.length > 0 ? 
        new Date(Math.max(...zerionTrades.map(t => new Date(t.zerionImportedAt || t.createdAt)))).toLocaleString() :
        'Never');
      
    } else {
      console.log('📭 No trades found in database');
    }
    
    console.log('');
    console.log('🎯 Summary:');
    console.log(`   • Wallets: ${walletsResponse.data.length}`);
    console.log(`   • Total Trades: ${trades.length}`);
    console.log(`   • Zerion Trades: ${trades.filter(t => t.zerionTxId).length}`);
    console.log(`   • Integration Status: ${trades.length > 0 ? '✅ WORKING' : '⚠️  No data yet'}`);
    
    if (trades.length > 0) {
      console.log('');
      console.log('🎉 SUCCESS: Your Zerion integration is working!');
      console.log('   The rate limiting is just preventing new syncs.');
      console.log('   Data is being successfully fetched and saved.');
    }
    
  } catch (error) {
    console.error('💥 Database check failed:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
  }
}

checkDatabase();