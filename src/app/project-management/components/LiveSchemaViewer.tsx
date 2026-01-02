'use client';

import { useState, useEffect } from 'react';
import { Database, Table, RefreshCw, ChevronDown, ChevronRight, Columns } from 'lucide-react';

interface SchemaData {
  columns: string[];
  types: Record<string, string>;
}

interface LiveSchemaViewerProps {
  projectId: string;
  tablePrefix?: string;
  isParent?: boolean;
}

// Format SQL types to be more readable
function formatType(type: string | undefined): string {
  if (!type) return '';
  return type
    .replace('character varying', 'varchar')
    .replace('timestamp with time zone', 'timestamptz')
    .replace('timestamp without time zone', 'timestamp')
    .replace('double precision', 'double')
    .replace('boolean', 'bool')
    .replace('integer', 'int')
    .replace('uuid', 'uuid');
}

export function LiveSchemaViewer({ projectId, tablePrefix, isParent }: LiveSchemaViewerProps) {
  const [schema, setSchema] = useState<Record<string, SchemaData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch schema on mount
  useEffect(() => {
    fetchSchema();
  }, [projectId]);

  const fetchSchema = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/project-management/api/refresh-schema?projectId=${projectId}`);
      const data = await res.json();
      if (data.success) {
        setSchema(data.schema || {});
        setLastRefresh(new Date());
      } else {
        setError(data.error || 'Failed to load schema');
      }
    } catch (err) {
      setError('Failed to connect');
    } finally {
      setIsLoading(false);
    }
  };

  const rescanSchema = async () => {
    if (!tablePrefix) {
      setError('No table prefix configured for this project');
      return;
    }

    setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/project-management/api/refresh-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, tablePrefix })
      });
      const data = await res.json();
      if (data.success) {
        await fetchSchema();
      } else {
        setError(data.error || 'Refresh failed');
      }
    } catch (err) {
      setError('Refresh failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  };

  const tables = Object.entries(schema).sort((a, b) => a[0].localeCompare(b[0]));
  const tableCount = tables.length;

  // Only show for parent projects with table_prefix
  if (!isParent || !tablePrefix) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 rounded-lg border border-purple-900/30 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-purple-400 font-medium flex items-center gap-2">
          <Database className="w-4 h-4" />
          Live Database Schema
          <span className="text-gray-500 text-xs font-normal">({tablePrefix}_)</span>
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {tableCount} tables
          </span>
          <button
            onClick={fetchSchema}
            disabled={isLoading}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            title="Refresh from cache"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={rescanSchema}
            disabled={isRefreshing}
            className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded flex items-center gap-1"
            title="Rescan database for schema changes"
          >
            <Database className={`w-3 h-3 ${isRefreshing ? 'animate-pulse' : ''}`} />
            {isRefreshing ? 'Scanning...' : 'Rescan DB'}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-xs mb-2 p-2 bg-red-900/20 rounded">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      ) : tableCount === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No schema loaded</p>
          <p className="text-xs mt-1">Click "Rescan DB" to load tables</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-96 overflow-auto">
          {tables.map(([tableName, tableSchema]) => (
            <div key={tableName} className="border border-gray-700 rounded overflow-hidden">
              <button
                onClick={() => toggleTable(tableName)}
                className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-750 flex items-center gap-2 text-left"
              >
                {expandedTables.has(tableName) ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
                <Table className="w-4 h-4 text-purple-400" />
                <span className="text-white font-mono text-sm flex-1">
                  {tableName.replace(`${tablePrefix}_`, '')}
                </span>
                <span className="text-gray-500 text-xs flex items-center gap-1">
                  <Columns className="w-3 h-3" />
                  {tableSchema.columns.length}
                </span>
              </button>

              {expandedTables.has(tableName) && (
                <div className="bg-gray-900 border-t border-gray-700 p-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-800">
                        <th className="text-left py-1 px-2">Column</th>
                        <th className="text-left py-1 px-2">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableSchema.columns.map((col, i) => (
                        <tr key={col} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-850'}>
                          <td className="py-1 px-2">
                            <span className="text-gray-200 font-mono">{col}</span>
                          </td>
                          <td className="py-1 px-2">
                            <span className="text-purple-400 font-mono text-[11px]">
                              {formatType(tableSchema.types[col])}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {lastRefresh && (
        <div className="text-center text-[10px] text-gray-600 mt-2">
          Last refresh: {lastRefresh.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
