#!/bin/bash

# OKX API Test with CURL
# Usage: ./test-okx-curl.sh [API_KEY] [SECRET_KEY] [PASSPHRASE] [WALLET]

echo "🔧 OKX API cURL Test"
echo "===================="
echo ""

# Check if credentials provided
if [ $# -lt 3 ]; then
    echo "Usage: ./test-okx-curl.sh [API_KEY] [SECRET_KEY] [PASSPHRASE] [WALLET]"
    echo ""
    echo "Example:"
    echo "./test-okx-curl.sh your_api_key your_secret your_pass FReKaCqfqYFGD3tqYCwSxwfWoSz2ey9qSPisDkaTj2mK"
    echo ""
    echo "This will test the OKX API directly with curl to verify:"
    echo "1. API authentication"
    echo "2. Wallet history fetching"
    echo "3. Response format"
    echo ""
    echo "🔗 To get OKX credentials:"
    echo "1. Go to https://web3.okx.com/"
    echo "2. Create account and API key"
    echo "3. Enable wallet permissions"
    exit 1
fi

API_KEY="$1"
SECRET_KEY="$2" 
PASSPHRASE="$3"
WALLET="${4:-FReKaCqfqYFGD3tqYCwSxwfWoSz2ey9qSPisDkaTj2mK}"

echo "Testing with:"
echo "API Key: ${API_KEY:0:8}..."
echo "Secret: ${SECRET_KEY:0:8}..."  
echo "Passphrase: ${PASSPHRASE:0:3}..."
echo "Wallet: $WALLET"
echo ""

# Calculate time range (last 24 hours)
END_TIME=$(date +%s000)  # Current timestamp in milliseconds
START_TIME=$((END_TIME - 86400000))  # 24 hours ago

# Build request path
REQUEST_PATH="/api/v6/dex/post-transaction/transactions-by-address"
QUERY_PARAMS="?chains=501&address=${WALLET}&begin=${START_TIME}&end=${END_TIME}&limit=50"
FULL_PATH="${REQUEST_PATH}${QUERY_PARAMS}"

# Generate timestamp
TIMESTAMP=$(date +%s000)

# Create signature
# Format: timestamp + method + path + body
MESSAGE="${TIMESTAMP}GET${FULL_PATH}"
SIGNATURE=$(echo -n "$MESSAGE" | openssl dgst -sha256 -hmac "$SECRET_KEY" -binary | base64)

echo "🚀 Making API Request..."
echo "URL: https://web3.okx.com${FULL_PATH}"
echo "Timestamp: $TIMESTAMP"
echo "Signature: ${SIGNATURE:0:20}..."
echo ""

# Make the API call
echo "📡 API Response:"
echo "================"

curl -s \
  -H "OK-ACCESS-KEY: $API_KEY" \
  -H "OK-ACCESS-SIGN: $SIGNATURE" \
  -H "OK-ACCESS-TIMESTAMP: $TIMESTAMP" \
  -H "OK-ACCESS-PASSPHRASE: $PASSPHRASE" \
  -H "Content-Type: application/json" \
  "https://web3.okx.com${FULL_PATH}" | jq '.'

echo ""
echo "🔍 Response Analysis:"

# Test just the status
RESPONSE=$(curl -s \
  -H "OK-ACCESS-KEY: $API_KEY" \
  -H "OK-ACCESS-SIGN: $SIGNATURE" \
  -H "OK-ACCESS-TIMESTAMP: $TIMESTAMP" \
  -H "OK-ACCESS-PASSPHRASE: $PASSPHRASE" \
  -H "Content-Type: application/json" \
  "https://web3.okx.com${FULL_PATH}")

CODE=$(echo "$RESPONSE" | jq -r '.code // "unknown"')
MESSAGE_TEXT=$(echo "$RESPONSE" | jq -r '.msg // "no message"')
TX_COUNT=$(echo "$RESPONSE" | jq -r '.data[0].transactions | length // 0')

if [ "$CODE" = "0" ]; then
    echo "✅ SUCCESS! API authentication working"
    echo "📊 Found $TX_COUNT transactions in last 24 hours"
    
    if [ "$TX_COUNT" -gt 0 ]; then
        echo ""
        echo "🎯 Sample Transaction:"
        echo "$RESPONSE" | jq -r '.data[0].transactions[0] | 
        "Hash: \(.txHash)
Type: \(.itype) (0=SOL, 2=Token)  
Time: \(.txTime | tonumber / 1000 | strftime("%Y-%m-%d %H:%M:%S"))
Amount: \(.amount) \(.symbol // "SOL")
Status: \(.txStatus)"'
    else
        echo "ℹ️  No recent transactions (wallet may be inactive)"
    fi
else
    echo "❌ API Error: $MESSAGE_TEXT"
    echo "Error Code: $CODE"
    
    case "$CODE" in
        "50001") echo "   → API Key authentication failed" ;;
        "50002") echo "   → Timestamp error" ;;  
        "50003") echo "   → Passphrase error" ;;
        "50004") echo "   → Signature error" ;;
        *) echo "   → Check OKX API documentation" ;;
    esac
fi

echo ""
echo "✅ Test complete!"