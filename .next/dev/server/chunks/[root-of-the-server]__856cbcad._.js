module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/app/api/trades/simple/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
// Simple mock data without database dependencies
const exampleTrades = [
    {
        id: '1',
        type: 'BUY',
        tokenIn: 'SOL',
        tokenOut: 'BONK',
        amountIn: 10,
        amountOut: 500000000,
        priceIn: 95.50,
        priceOut: 0.0000191,
        executedAt: '2024-02-10T10:30:00',
        dex: 'Jupiter',
        fees: 0.005,
        notes: 'Saw increasing volume on DEXScreener, community hype building',
        isManual: false,
        mistakes: []
    },
    {
        id: '2',
        type: 'SELL',
        tokenIn: 'BONK',
        tokenOut: 'SOL',
        amountIn: 250000000,
        amountOut: 5.2,
        priceIn: 0.0000208,
        priceOut: 96.15,
        executedAt: '2024-02-10T14:45:00',
        dex: 'Raydium',
        fees: 0.003,
        notes: 'Taking 50% profits at 2x, letting rest ride',
        isManual: false,
        mistakes: []
    },
    {
        id: '3',
        type: 'BUY',
        tokenIn: 'USDC',
        tokenOut: 'WIF',
        amountIn: 1000,
        amountOut: 300,
        priceIn: 1,
        priceOut: 3.33,
        executedAt: '2024-02-09T09:15:00',
        dex: 'Orca',
        fees: 1.50,
        notes: 'Dogwifhat breaking out, strong volume, X sentiment bullish',
        isManual: false,
        mistakes: [
            {
                id: '1',
                mistakeType: 'FOMO Entry',
                severity: 'HIGH',
                category: {
                    name: 'FOMO Entry',
                    color: '#ef4444'
                }
            }
        ]
    },
    {
        id: '4',
        type: 'SELL',
        tokenIn: 'WIF',
        tokenOut: 'USDC',
        amountIn: 150,
        amountOut: 600,
        priceIn: 4.00,
        priceOut: 1,
        executedAt: '2024-02-11T11:20:00',
        dex: 'Jupiter',
        fees: 0.90,
        notes: 'Partial exit at resistance, keeping 50% for higher targets',
        isManual: false,
        mistakes: []
    },
    {
        id: '5',
        type: 'BUY',
        tokenIn: 'SOL',
        tokenOut: 'JTO',
        amountIn: 50,
        amountOut: 1250,
        priceIn: 94.80,
        priceOut: 3.79,
        executedAt: '2024-02-08T16:30:00',
        dex: 'Raydium',
        fees: 0.025,
        notes: 'JTO governance proposal news, expecting pump',
        isManual: true,
        mistakes: []
    },
    {
        id: '6',
        type: 'BUY',
        tokenIn: 'USDC',
        tokenOut: 'PYTH',
        amountIn: 2000,
        amountOut: 5000,
        priceIn: 1,
        priceOut: 0.40,
        executedAt: '2024-02-07T13:00:00',
        dex: 'Orca',
        fees: 3.00,
        notes: 'Oracle narrative strong, new chain integrations coming',
        isManual: false,
        mistakes: []
    },
    {
        id: '7',
        type: 'BUY',
        tokenIn: 'SOL',
        tokenOut: 'POPCAT',
        amountIn: 5,
        amountOut: 50000,
        priceIn: 94.00,
        priceOut: 0.0094,
        executedAt: '2024-02-01T12:00:00',
        dex: 'Raydium',
        fees: 0.0025,
        notes: 'Small meme position, viral on TikTok',
        isManual: true,
        mistakes: []
    },
    {
        id: '8',
        type: 'SELL',
        tokenIn: 'POPCAT',
        tokenOut: 'SOL',
        amountIn: 50000,
        amountOut: 25,
        priceIn: 0.047,
        priceOut: 94.00,
        executedAt: '2024-02-03T15:30:00',
        dex: 'Jupiter',
        fees: 0.0125,
        notes: '5x on meme coin! Viral success',
        isManual: false,
        mistakes: []
    },
    {
        id: '9',
        type: 'BUY',
        tokenIn: 'USDC',
        tokenOut: 'RAY',
        amountIn: 750,
        amountOut: 500,
        priceIn: 1,
        priceOut: 1.50,
        executedAt: '2024-02-03T09:00:00',
        dex: 'Raydium',
        fees: 1.125,
        notes: 'Raydium v3 launch, expecting volume increase',
        isManual: false,
        mistakes: [
            {
                id: '2',
                mistakeType: 'Early Exit',
                severity: 'MEDIUM',
                category: {
                    name: 'Early Exit',
                    color: '#f97316'
                }
            }
        ]
    },
    {
        id: '10',
        type: 'BUY',
        tokenIn: 'SOL',
        tokenOut: 'RENDER',
        amountIn: 30,
        amountOut: 400,
        priceIn: 93.00,
        priceOut: 6.975,
        executedAt: '2024-02-06T08:45:00',
        dex: 'Raydium',
        fees: 0.015,
        notes: 'AI narrative heating up, NVDA earnings catalyst',
        isManual: true,
        mistakes: []
    }
];
async function GET(request) {
    try {
        // Return mock trades data
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            trades: exampleTrades
        });
    } catch (error) {
        console.error('GET /api/trades/simple error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__856cbcad._.js.map