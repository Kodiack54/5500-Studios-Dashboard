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
"[project]/Studio/kodiack-dashboard-5500/src/app/api/servers/health/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Studio/kodiack-dashboard-5500/node_modules/next/server.js [app-route] (ecmascript)");
;
// Patcher endpoints
const PATCHER_URL = process.env.PATCHER_URL || 'http://localhost:7100';
const ENGINE_PATCHER_URL = process.env.ENGINE_PATCHER_URL || 'http://localhost:7101';
// Tradeline mapping for the 20 engine slots
const TRADELINE_MAP = {
    '01': 'security',
    '02': 'administrative',
    '03': 'facilities',
    '04': 'logistics',
    '05': 'electrical',
    '06': 'lowvoltage',
    '07': 'landscaping',
    '08': 'hvac',
    '09': 'plumbing',
    '10': 'janitorial',
    '11': 'support',
    '12': 'waste',
    '13': 'construction',
    '14': 'roofing',
    '15': 'painting',
    '16': 'flooring',
    '17': 'demolition',
    '18': 'environmental',
    '19': 'concrete',
    '20': 'fencing'
};
// Worker name mapping
// (Main)Engine / (W1)Discovery / (W2)Scope of Work / (W3)Full Report / (W4)Proposal
const WORKER_NAMES = {
    0: 'Engine',
    1: 'Discovery',
    2: 'Scope of Work',
    3: 'Full Report',
    4: 'Proposal'
};
// Calculate overall health from workers
// Green (healthy) = all workers online
// Yellow (degraded) = some workers offline but not all
// Red (critical) = all workers offline
function calculateSlotHealth(workers) {
    if (workers.length === 0) return 'offline';
    const onlineCount = workers.filter((w)=>w.status === 'online').length;
    const totalCount = workers.length;
    // All offline = critical (red)
    if (onlineCount === 0) return 'critical';
    // All online = healthy (green)
    if (onlineCount === totalCount) return 'healthy';
    // Some online, some offline = degraded (yellow)
    return 'degraded';
}
// Calculate project health from slots
function calculateProjectHealth(slots) {
    if (slots.length === 0) return 'offline';
    const healthyCount = slots.filter((s)=>s.health === 'healthy').length;
    const degradedCount = slots.filter((s)=>s.health === 'degraded').length;
    const offlineCount = slots.filter((s)=>s.health === 'critical' || s.health === 'offline').length;
    // All offline = critical (red)
    if (healthyCount === 0 && degradedCount === 0) return 'critical';
    // All healthy = healthy (green)
    if (offlineCount === 0 && degradedCount === 0) return 'healthy';
    // At least one healthy or degraded = degraded (yellow)
    return 'degraded';
}
// Fetch engine health from patcher 7101
async function fetchEngineHealth() {
    const project = {
        id: 'tradelines',
        name: 'NextBid Engine',
        patcherPort: 7101,
        prodPort: '31001-31020',
        health: 'unknown',
        slots: [],
        totalSlots: 20,
        healthySlots: 0,
        degradedSlots: 0,
        offlineSlots: 0,
        lastCheck: new Date().toISOString()
    };
    try {
        // Try to get health from engine patcher
        const response = await fetch(`${ENGINE_PATCHER_URL}/server/health-all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(5000)
        });
        if (response.ok) {
            const data = await response.json();
            // Parse the health data from patcher
            // Patcher returns: { tradelines: { tradeline_name: { slotId, displayName, port, online, total, status, processes } } }
            if (data.tradelines && typeof data.tradelines === 'object') {
                project.slots = Object.entries(data.tradelines).map(([tradeline, info])=>{
                    // Map PM2 process names to worker display names
                    // Process names: slot-XX-main, slot-XX-w1-discovery, slot-XX-w2-sow, slot-XX-w3-docs, slot-XX-w4-proposal
                    const workerNameMap = {
                        'main': 'Engine',
                        'w1-discovery': 'Discovery',
                        'w2-sow': 'Scope of Work',
                        'w3-docs': 'Full Report',
                        'w4-proposal': 'Proposal'
                    };
                    // Calculate 5-digit port from slotId: 3[Droplet][Worker][SlotId]
                    const slotNum = info.slotId || '00';
                    const workerPorts = {
                        'Engine': parseInt(`310${slotNum}`),
                        'Discovery': parseInt(`311${slotNum}`),
                        'Scope of Work': parseInt(`312${slotNum}`),
                        'Full Report': parseInt(`313${slotNum}`),
                        'Proposal': parseInt(`314${slotNum}`)
                    };
                    // Map processes to workers
                    const runningWorkers = (info.processes || []).map((p)=>{
                        // Extract worker type from process name (e.g., "slot-06-w2-sow" -> "w2-sow")
                        const nameParts = p.name?.split('-') || [];
                        const workerType = nameParts.length >= 3 ? nameParts.slice(2).join('-') : p.name;
                        const displayName = workerNameMap[workerType] || workerType;
                        return {
                            port: workerPorts[displayName] || p.pm2_env?.PORT || 0,
                            name: displayName,
                            status: p.status === 'online' ? 'online' : p.status === 'stopped' ? 'offline' : 'error',
                            pid: p.pid,
                            uptime: p.pm2_env?.pm_uptime,
                            lastPing: p.pm2_env?.pm_uptime ? `${Math.floor((Date.now() - p.pm2_env.pm_uptime) / 1000)}s` : undefined
                        };
                    });
                    // Ensure all 5 workers are present (add missing ones as offline)
                    const allWorkerNames = [
                        'Engine',
                        'Discovery',
                        'Scope of Work',
                        'Full Report',
                        'Proposal'
                    ];
                    const workers = allWorkerNames.map((name)=>{
                        const existing = runningWorkers.find((w)=>w.name === name);
                        if (existing) return existing;
                        // Add missing worker as offline
                        return {
                            port: workerPorts[name],
                            name,
                            status: 'offline'
                        };
                    });
                    // Calculate slot health based on all 5 workers (not just patcher status)
                    // Green = all 5 online, Yellow = some offline, Red = all offline
                    const slotHealth = {
                        slotId: info.slotId || '00',
                        tradeline: tradeline,
                        mainPort: info.port || parseInt(`310${info.slotId || '00'}`),
                        workers,
                        health: calculateSlotHealth(workers),
                        cpu: info.cpu,
                        memory: info.memory
                    };
                    return slotHealth;
                });
                // Sort slots by slotId
                project.slots.sort((a, b)=>a.slotId.localeCompare(b.slotId));
                // Calculate slot counts
                project.healthySlots = project.slots.filter((s)=>s.health === 'healthy').length;
                project.degradedSlots = project.slots.filter((s)=>s.health === 'degraded').length;
                project.offlineSlots = project.slots.filter((s)=>s.health === 'critical' || s.health === 'offline').length;
                project.health = calculateProjectHealth(project.slots);
            } else if (data.health) {
                project.health = data.health;
            }
        } else {
            // Patcher responded but with error
            project.health = 'degraded';
        }
    } catch (error) {
        // Can't reach patcher - mark as offline
        console.error('Failed to fetch engine health:', error);
        project.health = 'offline';
        // Generate placeholder slots showing offline status
        // Port format: 3[Droplet][Worker][SlotId] - e.g., 31006 = Droplet 1, Engine (0), Slot 06
        project.slots = Array.from({
            length: 20
        }, (_, i)=>{
            const slotId = String(i + 1).padStart(2, '0');
            return {
                slotId,
                tradeline: TRADELINE_MAP[slotId],
                mainPort: parseInt(`310${slotId}`),
                workers: [
                    {
                        port: parseInt(`310${slotId}`),
                        name: 'Engine',
                        status: 'offline'
                    },
                    {
                        port: parseInt(`311${slotId}`),
                        name: 'Discovery',
                        status: 'offline'
                    },
                    {
                        port: parseInt(`312${slotId}`),
                        name: 'Scope of Work',
                        status: 'offline'
                    },
                    {
                        port: parseInt(`313${slotId}`),
                        name: 'Full Report',
                        status: 'offline'
                    },
                    {
                        port: parseInt(`314${slotId}`),
                        name: 'Proposal',
                        status: 'offline'
                    }
                ],
                health: 'offline'
            };
        });
        project.offlineSlots = 20;
    }
    return project;
}
// Placeholder slot definitions for each product
// These will be replaced with real data when patchers return slot info
const PRODUCT_SLOTS = {
    sources: [
        {
            slotId: '01',
            name: 'us-west',
            port: 8002
        },
        {
            slotId: '02',
            name: 'us-east',
            port: 8012
        },
        {
            slotId: '03',
            name: 'us-central',
            port: 8022
        }
    ],
    nextbidder: [
        {
            slotId: '01',
            name: 'supplies',
            port: 8003
        },
        {
            slotId: '02',
            name: 'stationary',
            port: 8013
        },
        {
            slotId: '03',
            name: 'construction',
            port: 8023
        },
        {
            slotId: '04',
            name: 'electronics',
            port: 8033
        },
        {
            slotId: '05',
            name: 'misc',
            port: 8043
        }
    ],
    portals: [
        {
            slotId: '01',
            name: 'main',
            port: 8004
        },
        {
            slotId: '02',
            name: 'enterprise',
            port: 8014
        }
    ],
    nexttech: [
        {
            slotId: '01',
            name: 'dispatch',
            port: 8005
        },
        {
            slotId: '02',
            name: 'sops',
            port: 8015
        },
        {
            slotId: '03',
            name: 'inventory',
            port: 8025
        }
    ],
    nexttask: [
        {
            slotId: '01',
            name: 'quests',
            port: 8006
        },
        {
            slotId: '02',
            name: 'leaderboards',
            port: 8016
        }
    ]
};
// Fetch simple project health (non-engine projects)
async function fetchProjectHealth(id, name, patcherPort, prodPort) {
    // Generate placeholder slots for this project
    const slotDefs = PRODUCT_SLOTS[id] || [];
    const placeholderSlots = slotDefs.map((slot)=>({
            slotId: slot.slotId,
            tradeline: slot.name,
            mainPort: slot.port,
            workers: [
                {
                    port: slot.port,
                    name: 'Main',
                    status: 'offline'
                }
            ],
            health: 'offline'
        }));
    const project = {
        id,
        name,
        patcherPort,
        prodPort,
        health: 'unknown',
        slots: placeholderSlots,
        totalSlots: placeholderSlots.length,
        healthySlots: 0,
        degradedSlots: 0,
        offlineSlots: placeholderSlots.length,
        lastCheck: new Date().toISOString()
    };
    try {
        const response = await fetch(`${PATCHER_URL.replace('7100', String(patcherPort))}/status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(3000)
        });
        if (response.ok) {
            const data = await response.json();
            project.health = data.health || data.status === 'ok' ? 'healthy' : 'degraded';
            // If patcher returns real slot data, use it instead of placeholders
            if (data.slots && Array.isArray(data.slots)) {
                project.slots = data.slots;
                project.totalSlots = data.slots.length;
                project.healthySlots = data.slots.filter((s)=>s.health === 'healthy').length;
                project.degradedSlots = data.slots.filter((s)=>s.health === 'degraded').length;
                project.offlineSlots = data.slots.filter((s)=>s.health === 'critical' || s.health === 'offline').length;
                project.health = calculateProjectHealth(data.slots);
            }
        } else {
            project.health = 'degraded';
        }
    } catch (error) {
        console.error(`Failed to fetch ${name} health:`, error);
        project.health = 'offline';
    }
    return project;
}
async function GET(request) {
    try {
        // Fetch all project health in parallel
        const [engine, source, bidder, portal, tech, task] = await Promise.all([
            fetchEngineHealth(),
            fetchProjectHealth('sources', 'NextSource', 7102, '8002'),
            fetchProjectHealth('nextbidder', 'NextBidder', 7103, '8003'),
            fetchProjectHealth('portals', 'NextBid Portal', 7104, '8004'),
            fetchProjectHealth('nexttech', 'NextTech', 7105, '8005'),
            fetchProjectHealth('nexttask', 'NextTask', 7106, '8006')
        ]);
        const projects = [
            engine,
            source,
            bidder,
            portal,
            tech,
            task
        ];
        // Calculate summary
        const summary = {
            total: projects.length,
            healthy: projects.filter((p)=>p.health === 'healthy').length,
            degraded: projects.filter((p)=>p.health === 'degraded').length,
            critical: projects.filter((p)=>p.health === 'critical').length,
            offline: projects.filter((p)=>p.health === 'offline').length,
            lastCheck: new Date().toISOString()
        };
        return __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            projects,
            summary
        });
    } catch (error) {
        console.error('Server health check failed:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Health check failed'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__6e6b6e2d._.js.map