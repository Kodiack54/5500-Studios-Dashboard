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
"[project]/Studio/kodiack-dashboard-5500/src/app/ai-team/api/status/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Studio/kodiack-dashboard-5500/node_modules/next/server.js [app-route] (ecmascript)");
;
// AI Droplet where workers run
const AI_DROPLET = process.env.AI_DROPLET_URL || 'http://161.35.229.220';
// AI Team worker definitions
const AI_WORKERS = [
    {
        id: 'chad',
        name: 'chad-5401',
        port: 5401
    },
    {
        id: 'jen',
        name: 'jen-5402',
        port: 5402
    },
    {
        id: 'susan',
        name: 'susan-5403',
        port: 5403
    },
    {
        id: 'clair',
        name: 'clair-5404',
        port: 5404
    },
    {
        id: 'mike',
        name: 'mike-5405',
        port: 5405
    },
    {
        id: 'tiffany',
        name: 'tiffany-5406',
        port: 5406
    },
    {
        id: 'ryan',
        name: 'ryan-5407',
        port: 5407
    },
    {
        id: 'terminal',
        name: 'terminal-server-5400',
        port: 5400
    },
    {
        id: 'dashboard',
        name: 'kodiack-dashboard-5500',
        port: 5500
    }
];
// Check individual worker health by hitting their /health endpoint
async function checkWorkerHealth(worker) {
    // Dashboard is always online - we're serving this request from it!
    if (worker.id === 'dashboard') {
        return {
            id: worker.id,
            status: 'online',
            lastHeartbeat: new Date().toISOString()
        };
    }
    const startTime = Date.now();
    try {
        const response = await fetch(`${AI_DROPLET}:${worker.port}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
        });
        const responseTime = Date.now() - startTime;
        if (response.ok) {
            const data = await response.json().catch(()=>({}));
            return {
                id: worker.id,
                status: 'online',
                responseTime,
                uptime: data.uptime,
                cpu: data.cpu,
                memory: data.memory,
                lastHeartbeat: new Date().toISOString()
            };
        } else {
            return {
                id: worker.id,
                status: 'error',
                responseTime
            };
        }
    } catch (error) {
        // Worker not responding
        return {
            id: worker.id,
            status: 'offline'
        };
    }
}
async function GET(request) {
    try {
        // Check all workers in parallel
        const workerStatuses = await Promise.all(AI_WORKERS.map((worker)=>checkWorkerHealth(worker)));
        return __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            workers: workerStatuses,
            lastCheck: new Date().toISOString()
        });
    } catch (error) {
        console.error('AI Team status check failed:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Status check failed'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__5bd4a88c._.js.map