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
"[project]/Studio/kodiack-dashboard-5500/src/config/tradelines.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Tradeline Configuration
// Engine Droplet: 64.23.151.201
// Tradelines are loaded from dev_tradelines table
// This file contains fallback defaults and type definitions
__turbopack_context__.s([
    "ENGINE_HOST",
    ()=>ENGINE_HOST,
    "defaultTradelines",
    ()=>defaultTradelines,
    "devServices",
    ()=>devServices,
    "getAllServices",
    ()=>getAllServices,
    "getTradelinePorts",
    ()=>getTradelinePorts,
    "patcherServices",
    ()=>patcherServices,
    "portalServices",
    ()=>portalServices,
    "tradelines",
    ()=>tradelines,
    "workerRoles",
    ()=>workerRoles
]);
const ENGINE_HOST = process.env.ENGINE_HOST || '64.23.151.201';
const defaultTradelines = [
    {
        id: 'security',
        name: 'Security',
        mainPort: 3002,
        host: '64.23.151.201'
    },
    {
        id: 'administrative',
        name: 'Administrative',
        mainPort: 3003,
        host: '64.23.151.201'
    },
    {
        id: 'facilities',
        name: 'Facilities',
        mainPort: 3004,
        host: '64.23.151.201'
    },
    {
        id: 'logistics',
        name: 'Logistics',
        mainPort: 3005,
        host: '64.23.151.201'
    },
    {
        id: 'electrical',
        name: 'Electrical',
        mainPort: 3006,
        host: '64.23.151.201'
    },
    {
        id: 'lowvoltage',
        name: 'Low Voltage',
        mainPort: 3007,
        host: '64.23.151.201'
    },
    {
        id: 'landscaping',
        name: 'Landscaping',
        mainPort: 3008,
        host: '64.23.151.201'
    },
    {
        id: 'hvac',
        name: 'HVAC',
        mainPort: 3009,
        host: '64.23.151.201'
    },
    {
        id: 'plumbing',
        name: 'Plumbing',
        mainPort: 3010,
        host: '64.23.151.201'
    },
    {
        id: 'janitorial',
        name: 'Janitorial',
        mainPort: 3011,
        host: '64.23.151.201'
    },
    {
        id: 'support',
        name: 'Support',
        mainPort: 3012,
        host: '64.23.151.201'
    },
    {
        id: 'waste',
        name: 'Waste',
        mainPort: 3013,
        host: '64.23.151.201'
    },
    {
        id: 'construction',
        name: 'Construction',
        mainPort: 3014,
        host: '64.23.151.201'
    },
    {
        id: 'roofing',
        name: 'Roofing',
        mainPort: 3015,
        host: '64.23.151.201'
    },
    {
        id: 'painting',
        name: 'Painting',
        mainPort: 3016,
        host: '64.23.151.201'
    },
    {
        id: 'flooring',
        name: 'Flooring',
        mainPort: 3017,
        host: '64.23.151.201'
    },
    {
        id: 'demolition',
        name: 'Demolition',
        mainPort: 3018,
        host: '64.23.151.201'
    },
    {
        id: 'environmental',
        name: 'Environmental',
        mainPort: 3019,
        host: '64.23.151.201'
    },
    {
        id: 'concrete',
        name: 'Concrete',
        mainPort: 3020,
        host: '64.23.151.201'
    },
    {
        id: 'fencing',
        name: 'Fencing',
        mainPort: 3021,
        host: '64.23.151.201'
    }
];
const tradelines = defaultTradelines;
const workerRoles = [
    {
        offset: 100,
        role: 'sow',
        name: 'SOW',
        description: 'SOW processing'
    },
    {
        offset: 200,
        role: 'docs',
        name: 'Docs',
        description: 'Document processing'
    },
    {
        offset: 300,
        role: 'proposal',
        name: 'Proposal',
        description: 'AI proposal writer material'
    }
];
function getTradelinePorts(mainPort) {
    return {
        main: mainPort,
        fetch: mainPort + 100,
        parse: mainPort + 200,
        ai: mainPort + 300,
        store: mainPort + 400
    };
}
function getAllServices() {
    const services = [];
    for (const tl of tradelines){
        // Main server
        services.push({
            id: `${tl.id}-main`,
            tradeline: tl.id,
            tradelineName: tl.name,
            type: 'main',
            role: 'main',
            roleName: 'Main',
            port: tl.mainPort
        });
        // Workers
        for (const worker of workerRoles){
            services.push({
                id: `${tl.id}-${worker.role}`,
                tradeline: tl.id,
                tradelineName: tl.name,
                type: 'worker',
                role: worker.role,
                roleName: worker.name,
                port: tl.mainPort + worker.offset
            });
        }
    }
    return services;
}
const patcherServices = [
    {
        id: 'gateway',
        name: 'Gateway',
        port: 7000,
        description: 'JWT auth hub'
    },
    {
        id: 'patcher',
        name: 'Patcher',
        port: 7100,
        description: 'Deployment orchestrator'
    },
    {
        id: 'dashboard',
        name: 'Dashboard',
        port: 7500,
        description: 'Dev command center'
    }
];
const portalServices = [
    {
        id: 'nextbidder',
        name: 'NextBidder',
        port: 8001,
        description: 'Win SUPPLY contracts'
    },
    {
        id: 'nexttech',
        name: 'NextTech',
        port: 8002,
        description: 'Dispatch/Tech App/SOP'
    },
    {
        id: 'nextsource',
        name: 'NextSource',
        port: 8003,
        description: 'AI source learner'
    },
    {
        id: 'portal',
        name: 'Portal',
        port: 8004,
        description: 'User opportunity/proposal UI'
    }
];
const devServices = [
    {
        id: 'nextbid-live',
        name: 'NextBid Live',
        port: 5000,
        description: 'Test engine before prod'
    },
    {
        id: 'nextbid-dev',
        name: 'NextBid Dev',
        port: 5100,
        description: 'Engine development'
    },
    {
        id: 'nextbidder-live',
        name: 'NextBidder Live',
        port: 5001,
        description: 'Test before prod'
    },
    {
        id: 'nextbidder-dev',
        name: 'NextBidder Dev',
        port: 5101,
        description: 'Development'
    },
    {
        id: 'nexttech-live',
        name: 'NextTech Live',
        port: 5002,
        description: 'Test before prod'
    },
    {
        id: 'nexttech-dev',
        name: 'NextTech Dev',
        port: 5102,
        description: 'Development'
    },
    {
        id: 'source-live',
        name: 'Source Live',
        port: 5003,
        description: 'Test before prod'
    },
    {
        id: 'source-dev',
        name: 'Source Dev',
        port: 5103,
        description: '400+ sources dev'
    },
    {
        id: 'portal-live',
        name: 'Portal Live',
        port: 5004,
        description: 'Test before prod'
    },
    {
        id: 'portal-dev',
        name: 'Portal Dev',
        port: 5104,
        description: 'Portal development'
    }
];
}),
"[project]/Studio/kodiack-dashboard-5500/src/app/api/engine/health/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Studio/kodiack-dashboard-5500/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$src$2f$config$2f$tradelines$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Studio/kodiack-dashboard-5500/src/config/tradelines.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$esm$2f$wrapper$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Studio/kodiack-dashboard-5500/node_modules/@supabase/supabase-js/dist/esm/wrapper.mjs [app-route] (ecmascript)");
;
;
;
const dynamic = 'force-dynamic';
// Get engine slots from database, fallback to config
async function getEngineSlots() {
    try {
        const supabaseUrl = ("TURBOPACK compile-time value", "https://sgfrqmkimrwmqqnafisw.supabase.co");
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZnJxbWtpbXJ3bXFxbmFmaXN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODgxOTksImV4cCI6MjA3OTc2NDE5OX0.JwvxmZ4V4NbKljYEhPUTk0rmzDXPeFmIKIQc38hfqmQ");
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$esm$2f$wrapper$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])(supabaseUrl, supabaseKey);
        // Get slots with tradeline names joined
        const { data, error } = await supabase.from('dev_engine_slots').select(`
        id,
        slot_number,
        main_port,
        host,
        assigned_tradeline,
        dev_tradeline_types ( name )
      `).order('slot_number');
        if (error || !data || data.length === 0) {
            console.log('No engine slots in DB, using defaults:', error?.message);
            return __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$src$2f$config$2f$tradelines$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["defaultTradelines"].map((t, i)=>({
                    id: `slot-${i + 1}`,
                    slotNumber: i + 1,
                    tradeline: t.id,
                    tradelineName: t.name,
                    mainPort: t.mainPort,
                    host: t.host
                }));
        }
        return data.map((slot)=>({
                id: slot.id,
                slotNumber: slot.slot_number,
                tradeline: slot.assigned_tradeline,
                tradelineName: slot.dev_tradeline_types?.name || Array.isArray(slot.dev_tradeline_types) && slot.dev_tradeline_types[0]?.name || (slot.assigned_tradeline ? slot.assigned_tradeline : 'Unassigned'),
                mainPort: slot.main_port,
                host: slot.host
            }));
    } catch (err) {
        console.error('Failed to fetch engine slots:', err);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$src$2f$config$2f$tradelines$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["defaultTradelines"].map((t, i)=>({
                id: `slot-${i + 1}`,
                slotNumber: i + 1,
                tradeline: t.id,
                tradelineName: t.name,
                mainPort: t.mainPort,
                host: t.host
            }));
    }
}
async function checkHealth(host, port) {
    const start = Date.now();
    try {
        const controller = new AbortController();
        const timeout = setTimeout(()=>controller.abort(), 3000);
        // Try /health first, fall back to root path
        // Any response (even 404) means the server is running
        const res = await fetch(`http://${host}:${port}/health`, {
            signal: controller.signal,
            cache: 'no-store'
        });
        clearTimeout(timeout);
        const responseTime = Date.now() - start;
        // 200 = healthy, 404/other = online but no health endpoint
        if (res.ok) {
            return {
                status: 'online',
                responseTime
            };
        }
        // Got a response but not 200 - server is running (degraded or just no /health route)
        return {
            status: 'online',
            responseTime
        };
    } catch (err) {
        // Fetch failed - could be timeout, connection refused, etc.
        // Try root path as fallback
        try {
            const controller2 = new AbortController();
            const timeout2 = setTimeout(()=>controller2.abort(), 2000);
            const res2 = await fetch(`http://${host}:${port}/`, {
                signal: controller2.signal,
                cache: 'no-store'
            });
            clearTimeout(timeout2);
            const responseTime = Date.now() - start;
            // Any response means online
            return {
                status: 'online',
                responseTime
            };
        } catch  {
            return {
                status: 'offline'
            };
        }
    }
}
async function GET() {
    const slots = await getEngineSlots();
    const results = [];
    const checks = [];
    for (const slot of slots){
        // Check main server
        checks.push(checkHealth(slot.host, slot.mainPort).then((health)=>{
            results.push({
                id: `${slot.id}-main`,
                slotId: slot.id,
                slotNumber: slot.slotNumber,
                tradeline: slot.tradeline,
                tradelineName: slot.tradelineName,
                role: 'main',
                port: slot.mainPort,
                host: slot.host,
                ...health
            });
        }));
        // Check workers
        for (const worker of __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$src$2f$config$2f$tradelines$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["workerRoles"]){
            const workerPort = slot.mainPort + worker.offset;
            checks.push(checkHealth(slot.host, workerPort).then((health)=>{
                results.push({
                    id: `${slot.id}-${worker.role}`,
                    slotId: slot.id,
                    slotNumber: slot.slotNumber,
                    tradeline: slot.tradeline,
                    tradelineName: slot.tradelineName,
                    role: worker.role,
                    port: workerPort,
                    host: slot.host,
                    ...health
                });
            }));
        }
    }
    // Run all checks in parallel
    await Promise.all(checks);
    // Sort by slot number and role
    results.sort((a, b)=>{
        if (a.slotNumber !== b.slotNumber) return a.slotNumber - b.slotNumber;
        if (a.role === 'main') return -1;
        if (b.role === 'main') return 1;
        return a.port - b.port;
    });
    // Summary stats
    const online = results.filter((r)=>r.status === 'online').length;
    const offline = results.filter((r)=>r.status === 'offline').length;
    const degraded = results.filter((r)=>r.status === 'degraded').length;
    return __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        total: results.length,
        online,
        offline,
        degraded,
        slots: slots.map((s)=>({
                id: s.id,
                slotNumber: s.slotNumber,
                tradeline: s.tradeline,
                tradelineName: s.tradelineName,
                mainPort: s.mainPort
            })),
        services: results
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1e4c4f40._.js.map