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
"[externals]/pg [external] (pg, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("pg");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/Studio/kodiack-dashboard-5500/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

/**
 * Local PostgreSQL Database Client
 * Provides Supabase-compatible interface for local PostgreSQL (kodiack_ai)
 *
 * This replaces @supabase/supabase-js for all dev_* and dev_ai_* tables
 */ __turbopack_context__.s([
    "createLocalClient",
    ()=>createLocalClient,
    "db",
    ()=>db,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/pg [external] (pg, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
// Create connection pool
const pool = new __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__["Pool"]({
    host: process.env.PG_HOST || '161.35.229.220',
    port: parseInt(process.env.PG_PORT || '9432'),
    database: process.env.PG_DATABASE || 'kodiack_ai',
    user: process.env.PG_USER || 'kodiack_admin',
    password: process.env.PG_PASSWORD || 'K0d1ack_Stud10_2024',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});
/**
 * QueryBuilder - Supabase-compatible query builder
 */ class QueryBuilder {
    tableName;
    selectColumns = '*';
    filters = [];
    orFilters = [];
    orderByClause = '';
    limitCount = null;
    offsetCount = null;
    insertData = null;
    updateData = null;
    isDelete = false;
    returnData = false;
    isSingle = false;
    isCount = false;
    constructor(tableName){
        this.tableName = tableName;
    }
    select(columns = '*') {
        if (columns.includes('(')) {
            this.selectColumns = columns.split(',').map((c)=>c.trim()).filter((c)=>!c.includes('(')).join(', ') || '*';
        } else {
            this.selectColumns = columns;
        }
        this.returnData = true;
        return this;
    }
    eq(column, value) {
        this.filters.push({
            column,
            operator: '=',
            value
        });
        return this;
    }
    neq(column, value) {
        this.filters.push({
            column,
            operator: '!=',
            value
        });
        return this;
    }
    gt(column, value) {
        this.filters.push({
            column,
            operator: '>',
            value
        });
        return this;
    }
    gte(column, value) {
        this.filters.push({
            column,
            operator: '>=',
            value
        });
        return this;
    }
    lt(column, value) {
        this.filters.push({
            column,
            operator: '<',
            value
        });
        return this;
    }
    lte(column, value) {
        this.filters.push({
            column,
            operator: '<=',
            value
        });
        return this;
    }
    like(column, pattern) {
        this.filters.push({
            column,
            operator: 'LIKE',
            value: pattern
        });
        return this;
    }
    ilike(column, pattern) {
        this.filters.push({
            column,
            operator: 'ILIKE',
            value: pattern
        });
        return this;
    }
    is(column, value) {
        if (value === null) {
            this.filters.push({
                column,
                operator: 'IS',
                value: 'NULL'
            });
        } else {
            this.filters.push({
                column,
                operator: 'IS',
                value
            });
        }
        return this;
    }
    not(column, operator, value) {
        if (operator === 'is' && value === null) {
            this.filters.push({
                column,
                operator: 'IS NOT',
                value: 'NULL'
            });
        } else {
            this.filters.push({
                column,
                operator: `NOT ${operator.toUpperCase()}`,
                value
            });
        }
        return this;
    }
    in(column, values) {
        this.filters.push({
            column,
            operator: 'IN',
            value: values
        });
        return this;
    }
    contains(column, value) {
        this.filters.push({
            column,
            operator: '@>',
            value
        });
        return this;
    }
    or(conditions) {
        this.orFilters.push(conditions);
        return this;
    }
    order(column, options = {}) {
        const direction = options.ascending === false ? 'DESC' : 'ASC';
        this.orderByClause = `ORDER BY ${column} ${direction}`;
        return this;
    }
    limit(count) {
        this.limitCount = count;
        return this;
    }
    offset(count) {
        this.offsetCount = count;
        return this;
    }
    single() {
        this.isSingle = true;
        this.limitCount = 1;
        return this;
    }
    insert(data) {
        this.insertData = data;
        return this;
    }
    update(data) {
        this.updateData = data;
        return this;
    }
    delete() {
        this.isDelete = true;
        return this;
    }
    buildWhereClause() {
        const conditions = [];
        const values = [];
        let paramIndex = 1;
        for (const filter of this.filters){
            if (filter.operator === 'IS') {
                conditions.push(`${filter.column} IS ${filter.value}`);
            } else if (filter.operator === 'IN') {
                const arr = filter.value;
                const placeholders = arr.map(()=>`$${paramIndex++}`).join(', ');
                conditions.push(`${filter.column} IN (${placeholders})`);
                values.push(...arr);
            } else if (filter.operator === '@>') {
                conditions.push(`${filter.column} @> $${paramIndex++}`);
                values.push(JSON.stringify(filter.value));
            } else {
                conditions.push(`${filter.column} ${filter.operator} $${paramIndex++}`);
                values.push(filter.value);
            }
        }
        for (const orCondition of this.orFilters){
            conditions.push(`(${orCondition})`);
        }
        const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        return {
            clause,
            values
        };
    }
    async execute() {
        let client = null;
        try {
            client = await pool.connect();
            // INSERT
            if (this.insertData) {
                const dataArray = Array.isArray(this.insertData) ? this.insertData : [
                    this.insertData
                ];
                const columns = Object.keys(dataArray[0]);
                const results = [];
                for (const row of dataArray){
                    const values = columns.map((col)=>row[col]);
                    const placeholders = columns.map((_, i)=>`$${i + 1}`).join(', ');
                    const returning = this.returnData ? 'RETURNING *' : '';
                    const query = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders}) ${returning}`;
                    const result = await client.query(query, values);
                    if (this.returnData && result.rows.length > 0) {
                        results.push(result.rows[0]);
                    }
                }
                return {
                    data: this.isSingle ? results[0] || null : results,
                    error: null
                };
            }
            // UPDATE
            if (this.updateData) {
                const columns = Object.keys(this.updateData);
                const { clause: whereClause, values: whereValues } = this.buildWhereClause();
                const setClause = columns.map((col, i)=>`${col} = $${i + 1}`).join(', ');
                const updateValues = columns.map((col)=>this.updateData[col]);
                let adjustedWhere = whereClause;
                whereValues.forEach((_, i)=>{
                    const oldIndex = i + 1;
                    const newIndex = columns.length + i + 1;
                    adjustedWhere = adjustedWhere.replace(`$${oldIndex}`, `$${newIndex}`);
                });
                const returning = this.returnData ? 'RETURNING *' : '';
                const query = `UPDATE ${this.tableName} SET ${setClause} ${adjustedWhere} ${returning}`;
                const result = await client.query(query, [
                    ...updateValues,
                    ...whereValues
                ]);
                return {
                    data: this.isSingle ? result.rows[0] || null : result.rows,
                    error: null
                };
            }
            // DELETE
            if (this.isDelete) {
                const { clause: whereClause, values } = this.buildWhereClause();
                const returning = this.returnData ? 'RETURNING *' : '';
                const query = `DELETE FROM ${this.tableName} ${whereClause} ${returning}`;
                const result = await client.query(query, values);
                return {
                    data: result.rows,
                    error: null
                };
            }
            // SELECT
            const { clause: whereClause, values } = this.buildWhereClause();
            let query = `SELECT ${this.selectColumns} FROM ${this.tableName} ${whereClause}`;
            if (this.orderByClause) {
                query += ` ${this.orderByClause}`;
            }
            if (this.limitCount !== null) {
                query += ` LIMIT ${this.limitCount}`;
            }
            if (this.offsetCount !== null) {
                query += ` OFFSET ${this.offsetCount}`;
            }
            const result = await client.query(query, values);
            if (this.isSingle) {
                return {
                    data: result.rows[0] || null,
                    error: null
                };
            }
            return {
                data: result.rows,
                error: null,
                count: result.rowCount || 0
            };
        } catch (error) {
            console.error('[DB Error]', error);
            return {
                data: null,
                error: error
            };
        } finally{
            if (client) {
                client.release();
            }
        }
    }
    then(onfulfilled, onrejected) {
        return this.execute().then(onfulfilled, onrejected);
    }
}
const db = {
    from (tableName) {
        return new QueryBuilder(tableName);
    },
    async query (sql, params = []) {
        let client = null;
        try {
            client = await pool.connect();
            const result = await client.query(sql, params);
            return {
                data: result.rows,
                error: null,
                count: result.rowCount || 0
            };
        } catch (error) {
            return {
                data: null,
                error: error
            };
        } finally{
            if (client) {
                client.release();
            }
        }
    },
    getPool () {
        return pool;
    }
};
function createLocalClient() {
    return db;
}
const __TURBOPACK__default__export__ = db;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/Studio/kodiack-dashboard-5500/src/app/project-management/api/clients/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Studio/kodiack-dashboard-5500/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Studio/kodiack-dashboard-5500/src/lib/db.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
async function GET() {
    try {
        const { data: clients, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].from('dev_clients').select('id, name, slug').eq('active', true).order('name', {
            ascending: true
        });
        if (error) {
            console.error('Error fetching clients:', error);
            return __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Failed to fetch clients'
            }, {
                status: 500
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            clients: clients || []
        });
    } catch (error) {
        console.error('Error in clients GET:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Studio$2f$kodiack$2d$dashboard$2d$5500$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__3e95e6cc._.js.map