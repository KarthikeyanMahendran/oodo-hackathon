import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { memoryEnvelopes } from '@/lib/esign/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let signedUrl = '';
    let docName = 'signed_document.pdf';
    let status = '';

    // First check Supabase DB
    const { data: dbEnv } = await supabaseAdmin
      .from('esign_envelopes')
      .select('*')
      .or(`id.eq.${id},docuseal_submission_id.eq.${id}`)
      .single();

    if (dbEnv) {
      signedUrl = dbEnv.signed_document_url || '';
      docName = `${dbEnv.document_name || 'Signed_Document'}.pdf`;
      status = dbEnv.status;
    } else {
      // Fallback to memory store
      const memEnv = memoryEnvelopes.find(
        (e) => e.id === id || e.docuseal_submission_id === id
      );
      if (memEnv) {
        signedUrl = memEnv.signed_document_url || '';
        docName = `${memEnv.document_name || 'Signed_Document'}.pdf`;
        status = memEnv.status;
      }
    }

    if (!signedUrl || status.toLowerCase() !== 'signed') {
      return NextResponse.json(
        {
          success: false,
          error: 'Signed document is not available yet. Current status: ' + (status || 'Pending'),
        },
        { status: 400 }
      );
    }

    // Try proxying the PDF file directly to force attachment download
    try {
      const fetchRes = await fetch(signedUrl);
      if (fetchRes.ok) {
        const fileBuffer = await fetchRes.arrayBuffer();
        const sanitizedFilename = docName.replace(/[^a-zA-Z0-9_.-]/g, '_');

        return new Response(fileBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
            'Cache-Control': 'no-cache',
          },
        });
      }
    } catch (fetchErr) {
      console.warn('Direct file stream proxy failed, redirecting to URL:', fetchErr);
    }

    // Fallback: Redirect directly to the signed document URL
    return NextResponse.redirect(signedUrl);
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err instanceof Error ? err.message : 'Download failed') },
      { status: 500 }
    );
  }
}
