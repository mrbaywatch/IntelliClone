import { NextRequest } from 'next/server';
import { z } from 'zod';

import { getLogger } from '@kit/shared/logger';
import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { Database } from '~/lib/database.types';
import { contractAnalyzer } from '~/lib/legal/services/contract-analyzer';
import { parsePdf } from '~/lib/ai/parse-pdf';

const bodySchema = z.object({
  documentId: z.string().uuid(),
  storagePath: z.string(),
});

/**
 * POST /api/documents/analyze
 * 
 * Analyzes a document for legal risks and compliance.
 * Extracts text from PDF and runs through contract analyzer.
 */
export async function POST(request: NextRequest) {
  const logger = await getLogger();

  try {
    const body = bodySchema.parse(await request.json());
    const { documentId, storagePath } = body;

    const client = getSupabaseServerClient<Database>();
    const adminClient = getSupabaseServerAdminClient<Database>();
    const auth = await requireUser(client);

    if (!auth.data) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Verify document ownership
    const { data: doc, error: docError } = await client
      .from('documents')
      .select('id, account_id')
      .eq('id', documentId)
      .eq('account_id', auth.data.id)
      .single();

    if (docError || !doc) {
      return new Response('Document not found', { status: 404 });
    }

    logger.info({ documentId, storagePath }, 'Starting document analysis');

    // Download the PDF from storage
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from('documents')
      .download(storagePath);

    if (downloadError || !fileData) {
      logger.error({ error: downloadError }, 'Failed to download document');
      return new Response('Failed to download document', { status: 500 });
    }

    // Extract text from PDF
    let documentText: string;
    try {
      const buffer = Buffer.from(await fileData.arrayBuffer());
      documentText = await parsePdf(buffer);
    } catch (parseError) {
      logger.error({ error: parseError }, 'Failed to parse PDF');
      return new Response('Failed to parse PDF', { status: 500 });
    }

    // Update document with extracted content
    await adminClient
      .from('documents')
      .update({ content: documentText })
      .eq('id', documentId);

    // Run contract analysis
    let analysis;
    try {
      analysis = await contractAnalyzer.analyzeDocument(
        documentText,
        documentId,
        { userRole: 'neutral' }
      );
    } catch (analysisError) {
      logger.error({ error: analysisError }, 'Contract analysis failed');
      // Still mark as analyzed with basic info
      await adminClient
        .from('documents')
        .update({
          analysis_completed: true,
          document_type: 'unknown',
        })
        .eq('id', documentId);

      return new Response(JSON.stringify({ 
        success: true, 
        partial: true,
        message: 'Document uploaded but full analysis failed' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update document with analysis results
    await adminClient
      .from('documents')
      .update({
        document_type: analysis.documentType,
        language: analysis.language,
        risk_score: analysis.riskAnalysis.riskScore,
        risk_level: analysis.riskAnalysis.overallRiskLevel,
        analysis_completed: true,
        analysis_data: analysis as unknown as Record<string, unknown>,
        parties: analysis.summary.parties as unknown as Record<string, unknown>[],
        effective_date: analysis.summary.effectiveDate || null,
        termination_date: analysis.summary.terminationDate || null,
        summary: analysis.summary.brief,
      })
      .eq('id', documentId);

    // Store detailed analysis
    await adminClient
      .from('document_analyses')
      .upsert({
        document_id: documentId,
        account_id: auth.data.id,
        document_type: analysis.documentType,
        language: analysis.language,
        brief_summary: analysis.summary.brief,
        detailed_summary: analysis.summary.detailed,
        key_points: analysis.summary.keyPoints,
        parties: analysis.summary.parties,
        effective_date: analysis.summary.effectiveDate || null,
        termination_date: analysis.summary.terminationDate || null,
        contract_value: analysis.summary.value || null,
        overall_risk_level: analysis.riskAnalysis.overallRiskLevel,
        risk_score: analysis.riskAnalysis.riskScore,
        risks: analysis.riskAnalysis.risks,
        missing_clauses: analysis.riskAnalysis.missingClauses,
        recommendations: analysis.riskAnalysis.recommendations,
        gdpr_compliant: analysis.compliance.gdprCompliant,
        gdpr_issues: analysis.compliance.gdprIssues,
        norwegian_law_compliant: analysis.compliance.norwegianLawCompliant,
        norwegian_law_issues: analysis.compliance.norwegianLawIssues,
        relevant_laws: analysis.compliance.relevantLaws,
        word_count: analysis.metadata.wordCount,
        page_count: analysis.metadata.pageCount || null,
        sections: analysis.metadata.sections,
        has_signature_block: analysis.metadata.hasSignatureBlock,
        has_date_block: analysis.metadata.hasDateBlock,
      }, {
        onConflict: 'document_id',
      });

    logger.info(
      { 
        documentId, 
        documentType: analysis.documentType,
        riskLevel: analysis.riskAnalysis.overallRiskLevel,
        riskScore: analysis.riskAnalysis.riskScore,
        risksFound: analysis.riskAnalysis.risks.length,
      },
      'Document analysis completed'
    );

    return new Response(JSON.stringify({
      success: true,
      analysis: {
        documentType: analysis.documentType,
        riskLevel: analysis.riskAnalysis.overallRiskLevel,
        riskScore: analysis.riskAnalysis.riskScore,
        risksCount: analysis.riskAnalysis.risks.length,
        summary: analysis.summary.brief,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const logger = await getLogger();
    logger.error({ error }, 'Error in document analysis API');

    if (error instanceof z.ZodError) {
      return new Response('Invalid request format', { status: 400 });
    }

    return new Response('Internal server error', { status: 500 });
  }
}
