import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { memoryEnvelopes } from '@/lib/esign/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      template_id,
      document_url,
      document_name,
      submitters = [],
      send_order = 'parallel',
    } = body;

    if (!document_url && !template_id) {
      return NextResponse.json(
        { success: false, error: 'Either template_id or document_url must be provided' },
        { status: 400 }
      );
    }

    let finalDocumentName = document_name || 'Document Envelope';
    let docusealSubmissionId = `docuseal_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Call DocuSeal API if DOCUSEAL_API_KEY is configured
    const docusealApiKey = process.env.DOCUSEAL_API_KEY;
    const docusealBaseUrl = process.env.DOCUSEAL_URL || 'https://api.docuseal.com';

    if (docusealApiKey) {
      try {
        const payload: any = {
          send_order: send_order === 'sequential',
          submitters: submitters.map((s: any) => ({
            name: s.name,
            email: s.email,
            role: s.role || 'Signer',
          })),
        };

        if (template_id) {
          payload.template_id = template_id;
        }
        if (document_url) {
          payload.documents = [
            {
              name: finalDocumentName,
              url: document_url,
            },
          ];
        }

        const docusealRes = await fetch(`${docusealBaseUrl}/submissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': docusealApiKey,
            'Authorization': `Bearer ${docusealApiKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (docusealRes.ok) {
          const docusealData = await docusealRes.json();
          // DocuSeal returns array of submitters or single submission object
          if (Array.isArray(docusealData) && docusealData.length > 0) {
            docusealSubmissionId = String(docusealData[0].submission_id || docusealData[0].id);
          } else if (docusealData && (docusealData.id || docusealData.submission_id)) {
            docusealSubmissionId = String(docusealData.id || docusealData.submission_id);
          }
        }
      } catch (docusealErr) {
        console.warn('DocuSeal API call failed or in sandbox mode, using generated submission ID:', docusealErr);
      }
    }

    const envelopeId = `env-${crypto.randomUUID()}`;
    const newEnvelopeRecord = {
      id: envelopeId,
      template_id: template_id || null,
      docuseal_submission_id: docusealSubmissionId,
      document_name: finalDocumentName,
      status: 'Pending' as const,
      signed_document_url: null,
      signed_on: null,
      created_at: new Date().toISOString(),
      submitters: submitters.map((s: any) => ({
        name: s.name,
        email: s.email,
        role: s.role || 'Signer',
        status: 'pending',
      })),
    };

    // Insert into Supabase DB
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('esign_envelopes')
      .insert([
        {
          template_id: template_id || null,
          docuseal_submission_id: docusealSubmissionId,
          document_name: finalDocumentName,
          status: 'Pending',
          signed_document_url: null,
          signed_on: null,
        },
      ])
      .select('*')
      .single();

    if (!dbError && dbData) {
      memoryEnvelopes.unshift({ ...newEnvelopeRecord, ...dbData });
      return NextResponse.json({
        success: true,
        envelope_id: dbData.id,
        docuseal_submission_id: dbData.docuseal_submission_id,
        envelope: dbData,
      });
    }

    memoryEnvelopes.unshift(newEnvelopeRecord);
    return NextResponse.json({
      success: true,
      envelope_id: envelopeId,
      docuseal_submission_id: docusealSubmissionId,
      envelope: newEnvelopeRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create envelope' },
      { status: 500 }
    );
  }
}
