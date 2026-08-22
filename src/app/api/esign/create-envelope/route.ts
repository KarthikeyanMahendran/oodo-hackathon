import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { memoryEnvelopes } from '@/lib/esign/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      document_name,
      document_url,
      signer_name,
      signer_email,
      signer_role = 'Participant',
      placed_fields = [],
    } = body;

    if (!document_name || !signer_name || !signer_email) {
      return NextResponse.json(
        { success: false, error: 'document_name, signer_name, and signer_email are required' },
        { status: 400 }
      );
    }

    const docusealSubmissionId = `docuseal_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Call DocuSeal API if configured
    const docusealApiKey = process.env.DOCUSEAL_API_KEY;
    const docusealBaseUrl = process.env.DOCUSEAL_URL || 'https://api.docuseal.com';
    let finalSubmissionId = docusealSubmissionId;

    if (docusealApiKey) {
      try {
        const payload = {
          submitters: [
            {
              name: signer_name,
              email: signer_email,
              role: signer_role,
            },
          ],
          documents: [
            {
              name: document_name,
              url: document_url,
            },
          ],
        };

        const docusealRes = await fetch(`${docusealBaseUrl}/submissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': docusealApiKey,
            Authorization: `Bearer ${docusealApiKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (docusealRes.ok) {
          const docusealData = await docusealRes.json();
          if (Array.isArray(docusealData) && docusealData.length > 0) {
            finalSubmissionId = String(docusealData[0].submission_id || docusealData[0].id);
          } else if (docusealData && (docusealData.id || docusealData.submission_id)) {
            finalSubmissionId = String(docusealData.id || docusealData.submission_id);
          }
        }
      } catch (docusealErr) {
        console.warn('DocuSeal API call failed, using generated submission ID:', docusealErr);
      }
    }

    const envelopeId = `env-${crypto.randomUUID()}`;
    const newEnvelopeRecord = {
      id: envelopeId,
      document_name,
      document_url: document_url || '',
      signer_name,
      signer_email,
      signer_role,
      docuseal_submission_id: finalSubmissionId,
      status: 'Pending' as const,
      placed_fields,
      signed_document_url: null,
      signed_on: null,
      created_at: new Date().toISOString(),
    };

    // Insert into Supabase DB
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('esign_envelopes')
      .insert([
        {
          document_name,
          document_url: document_url || '',
          signer_name,
          signer_email,
          signer_role,
          docuseal_submission_id: finalSubmissionId,
          status: 'Pending',
          placed_fields,
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
      docuseal_submission_id: finalSubmissionId,
      envelope: newEnvelopeRecord,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err instanceof Error ? err.message : 'Failed to create envelope') },
      { status: 500 }
    );
  }
}
