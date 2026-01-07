import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/parent/promote
 * Promotes staging items to parent artifacts (Journal or Published Doc)
 * Parent-only: 403 if not a parent project
 */

interface ProjectRow {
  is_parent: boolean | null;
  parent_id: string | null;
}

async function assertParentProjectById(projectId: string): Promise<boolean> {
  const { data } = await db
    .from('dev_projects')
    .select('is_parent, parent_id')
    .eq('id', projectId)
    .single();
  
  const project = data as ProjectRow | null;
  if (!project) return false;
  if (project.is_parent !== undefined && project.is_parent !== null) {
    return project.is_parent === true;
  }
  return project.parent_id == null;
}

// Minimum evidence thresholds
const MIN_EVIDENCE = {
  journal: 1,
  doc: 5,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parent_project_id, staging_ids, target, entry_date, doc_key } = body;

    // Validation
    if (!parent_project_id) {
      return NextResponse.json({ error: 'parent_project_id is required' }, { status: 400 });
    }
    if (!staging_ids || !Array.isArray(staging_ids) || staging_ids.length === 0) {
      return NextResponse.json({ error: 'staging_ids array is required' }, { status: 400 });
    }
    if (!target || !['journal', 'doc'].includes(target)) {
      return NextResponse.json({ error: 'target must be "journal" or "doc"' }, { status: 400 });
    }
    if (target === 'journal' && !entry_date) {
      return NextResponse.json({ error: 'entry_date is required for journal' }, { status: 400 });
    }
    if (target === 'doc' && !doc_key) {
      return NextResponse.json({ error: 'doc_key is required for doc' }, { status: 400 });
    }

    // Parent-only guard
    if (!(await assertParentProjectById(parent_project_id))) {
      return NextResponse.json({ error: 'parent-project only' }, { status: 403 });
    }

    // Get child project IDs to validate staging items belong to children
    const { data: childProjects } = await db
      .from('dev_projects')
      .select('id')
      .eq('parent_id', parent_project_id)
      .eq('is_active', true);

    const childIds = ((childProjects || []) as { id: string }[]).map(p => p.id);

    // Load staging rows
    const placeholders = staging_ids.map((_, i) => `$${i + 1}`).join(', ');
    const stagingSql = `
      SELECT id, project_id, bucket, title, content, priority
      FROM dev_ai_smart_extractions
      WHERE id IN (${placeholders})
    `;
    const stagingResult = await db.query(stagingSql, staging_ids);
    const stagingRows = (stagingResult.data || []) as any[];

    // Validate each staging row belongs to a child of this parent
    const validRows = stagingRows.filter(row => childIds.includes(row.project_id));
    if (validRows.length === 0) {
      return NextResponse.json({ error: 'No valid staging items found for this parent' }, { status: 400 });
    }

    const evidence_ids = validRows.map(r => r.id);
    const child_project_ids = [...new Set(validRows.map(r => r.project_id))];

    // Build content from staging items
    let content = '';
    const isInsufficientEvidence = target === 'doc' && validRows.length < MIN_EVIDENCE.doc;

    if (isInsufficientEvidence) {
      content = `## Insufficient Evidence\n\nThis document requires more evidence to produce a comprehensive summary.\n\n### What's Known So Far\n\n`;
      validRows.forEach(row => {
        content += `- **${row.bucket}**: ${row.title || row.content?.substring(0, 100) || 'Untitled'}\n`;
      });
      content += `\n*${validRows.length} items collected. Minimum ${MIN_EVIDENCE.doc} required for full document.*`;
    } else {
      // Group by bucket for journals
      const byBucket: Record<string, any[]> = {};
      validRows.forEach(row => {
        if (!byBucket[row.bucket]) byBucket[row.bucket] = [];
        byBucket[row.bucket].push(row);
      });

      if (target === 'journal') {
        content = `# Daily Journal - ${entry_date}\n\n`;
        Object.keys(byBucket).forEach(bucket => {
          content += `## ${bucket}\n\n`;
          byBucket[bucket].forEach(row => {
            content += `- ${row.title || row.content?.substring(0, 200) || 'Untitled'}\n`;
          });
          content += '\n';
        });
      } else {
        content = `# ${doc_key}\n\n`;
        Object.keys(byBucket).forEach(bucket => {
          content += `## ${bucket}\n\n`;
          byBucket[bucket].forEach(row => {
            content += `### ${row.title || 'Item'}\n\n${row.content || ''}\n\n`;
          });
        });
      }
    }

    // Find or create parent artifact
    const bucket = target === 'journal' ? 'Journal' : 'Published Doc';
    const metadataKey = target === 'journal' ? 'entry_date' : 'doc_key';
    const metadataValue = target === 'journal' ? entry_date : doc_key;

    // Check for existing artifact
    const existingSql = `
      SELECT id, metadata
      FROM dev_ai_smart_extractions
      WHERE project_id = $1
        AND bucket = $2
        AND metadata->>'${metadataKey}' = $3
      LIMIT 1
    `;
    const existingResult = await db.query(existingSql, [parent_project_id, bucket, metadataValue]);
    const existingArtifact = (existingResult.data as any[])?.[0];

    const now = new Date().toISOString();
    let artifactId: string;

    if (existingArtifact) {
      // Update existing artifact
      const oldEvidenceIds = existingArtifact.metadata?.evidence_ids || [];
      const newEvidenceIds = [...new Set([...oldEvidenceIds, ...evidence_ids])];
      const oldChildIds = existingArtifact.metadata?.child_project_ids || [];
      const newChildIds = [...new Set([...oldChildIds, ...child_project_ids])];

      const updateSql = `
        UPDATE dev_ai_smart_extractions
        SET content = $1,
            title = $2,
            metadata = metadata || $3::jsonb,
            updated_at = NOW()
        WHERE id = $4
        RETURNING id
      `;
      const updateMetadata = JSON.stringify({
        evidence_ids: newEvidenceIds,
        child_project_ids: newChildIds,
        last_promoted_at: now,
        generated_by: 'clair',
        insufficient_evidence: isInsufficientEvidence,
      });
      
      await db.query(updateSql, [content, target === 'journal' ? `Journal ${entry_date}` : doc_key, updateMetadata, existingArtifact.id]);
      artifactId = existingArtifact.id;
    } else {
      // Insert new artifact
      const insertSql = `
        INSERT INTO dev_ai_smart_extractions (project_id, bucket, status, title, content, metadata)
        VALUES ($1, $2, 'current', $3, $4, $5::jsonb)
        RETURNING id
      `;
      const insertMetadata = JSON.stringify({
        [metadataKey]: metadataValue,
        evidence_ids: evidence_ids,
        child_project_ids: child_project_ids,
        last_promoted_at: now,
        generated_by: 'clair',
        insufficient_evidence: isInsufficientEvidence,
      });

      const insertResult = await db.query<{ id: string }>(insertSql, [
        parent_project_id,
        bucket,
        target === 'journal' ? `Journal ${entry_date}` : doc_key,
        content,
        insertMetadata,
      ]);
      artifactId = (insertResult.data as { id: string }[])?.[0]?.id;
    }

    // Mark staging items as promoted
    const markSql = `
      UPDATE dev_ai_smart_extractions
      SET metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
          updated_at = NOW()
      WHERE id = ANY($2::uuid[])
    `;
    const promoteMetadata = JSON.stringify({
      promoted_to_parent_id: parent_project_id,
      promoted_at: now,
      promoted_by: 'clair',
      ready_for_publish: false,
    });
    await db.query(markSql, [promoteMetadata, evidence_ids]);

    return NextResponse.json({
      success: true,
      artifact_id: artifactId,
      promoted_count: evidence_ids.length,
      target,
      insufficient_evidence: isInsufficientEvidence,
    });
  } catch (error) {
    console.error('Error in parent promote POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
