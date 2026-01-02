import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
}

/**
 * POST /api/refresh-schema
 * Refresh database schema for a project based on its table_prefix
 */
export async function POST(request: NextRequest) {
  try {
    const { projectId, tablePrefix } = await request.json();

    if (!projectId || !tablePrefix) {
      return NextResponse.json({
        success: false,
        error: 'projectId and tablePrefix are required'
      }, { status: 400 });
    }

    console.log('Refreshing schema for prefix:', tablePrefix + '_');

    // Query information_schema directly for tables matching this prefix
    const { data: columns, error: queryError } = await db.query<ColumnInfo>(`
      SELECT
        c.table_name,
        c.column_name,
        c.data_type
      FROM information_schema.columns c
      JOIN information_schema.tables t ON c.table_name = t.table_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND c.table_name LIKE $1
      ORDER BY c.table_name, c.ordinal_position
    `, [`${tablePrefix}_%`]);

    if (queryError) {
      console.error('Schema query failed:', queryError);
      return NextResponse.json({
        success: false,
        error: 'Failed to query schema'
      }, { status: 500 });
    }

    // Build schema structure: { tableName: { columns: [], types: {} } }
    const schema: Record<string, { columns: string[]; types: Record<string, string> }> = {};
    const schemaData = (columns || []) as ColumnInfo[];

    for (const col of schemaData) {
      const tableName = col.table_name;
      if (!schema[tableName]) {
        schema[tableName] = { columns: [], types: {} };
      }
      schema[tableName].columns.push(col.column_name);
      schema[tableName].types[col.column_name] = col.data_type;
    }

    const tableCount = Object.keys(schema).length;
    console.log('Found', tableCount, 'tables for', tablePrefix + '_');

    // Update the project's database_schema
    const { error: updateError } = await db
      .from('dev_projects')
      .update({ database_schema: schema })
      .eq('id', projectId);

    if (updateError) {
      console.error('Failed to update project schema:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to save schema'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Schema refreshed for ${tablePrefix}_`,
      tableCount,
      tables: Object.keys(schema)
    });

  } catch (error) {
    console.error('Schema refresh error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/refresh-schema?projectId=xxx
 * Get current schema for a project
 */
export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({
      success: false,
      error: 'projectId is required'
    }, { status: 400 });
  }

  const { data: project, error } = await db
    .from('dev_projects')
    .select('id, name, table_prefix, database_schema')
    .eq('id', projectId)
    .single();

  if (error || !project) {
    return NextResponse.json({
      success: false,
      error: 'Project not found'
    }, { status: 404 });
  }

  const proj = project as { id: string; name: string; table_prefix: string; database_schema: Record<string, unknown> };
  const schema = proj.database_schema || {};
  const tableCount = Object.keys(schema).length;

  return NextResponse.json({
    success: true,
    projectId: proj.id,
    projectName: proj.name,
    tablePrefix: proj.table_prefix,
    tableCount,
    schema
  });
}
