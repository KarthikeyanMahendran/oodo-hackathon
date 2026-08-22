import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { memoryEnvelopes } from '@/lib/esign/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First try Supabase DB
    const { data: envData, error: dbError } = await supabaseAdmin
      .from('esign_envelopes')
      .select(`
        *,
        esign_template_types (
          template_name,
          signer_config
        )
      `)
      .or(`id.eq.${id},docuseal_submission_id.eq.${id}`)
      .single();

    if (!dbError && envData) {
      let signers = [];
      const docusealApiKey = process.env.DOCUSEAL_API_KEY;
      const docusealBaseUrl = process.env.DOCUSEAL_URL || 'https://api.docuseal.com';

      // Query DocuSeal API if key is present to fetch live submission details
      if (docusealApiKey && envData.docuseal_submission_id) {
        try {
          const docusealRes = await fetch(
            `${docusealBaseUrl}/submissions/${envData.docuseal_submission_id}`,
            {
              headers: {
                'X-Auth-Token': docusealApiKey,
                'Authorization': `Bearer ${docusealApiKey}`,
              },
            }
          );
          if (docusealRes.ok) {
            const liveDocusealData = await docusealRes.json();
            if (liveDocusealData.submitters) {
              signers = liveDocusealData.submitters.map((sub: any) => ({
                name: sub.name,
                email: sub.email,
                role: sub.role,
                status: sub.status || (sub.opened_at ? 'opened' : 'pending'),
                signed_at: sub.completed_at || null,
              }));
            }
          }
        } catch (dsErr) {
          console.warn('Could not fetch live DocuSeal status:', dsErr);
        }
      }

      return NextResponse.json({
        success: true,
        envelope: {
          ...envData,
          template_name: envData.esign_template_types?.template_name || 'Custom Document',
        },
        signers: signers.length > 0 ? signers : [
          { name: 'Primary Signer', status: envData.status === 'Signed' ? 'completed' : 'pending' }
        ],
      });
    }

    // Fallback to in-memory store
    const foundMemory = memoryEnvelopes.find(
      (e) => e.id === id || e.docuseal_submission_id === id
    );

    if (foundMemory) {
      return NextResponse.json({
        success: true,
        source: 'memory_fallback',
        envelope: foundMemory,
        signers: foundMemory.submitters || [
          { name: 'Primary Signer', status: foundMemory.status === 'Signed' ? 'completed' : 'pending' }
        ],
      });
    }

    return NextResponse.json(
      { success: false, error: 'Envelope not found' },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve envelope status' },
      { status: 500 }
    );
  }
}
