import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { memoryEnvelopes } from '@/lib/esign/store';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Extract event details from DocuSeal Webhook
    // Event structures: { event_type: "submission.completed", data: { id, documents: [...] } }
    const eventType = payload.event_type || payload.event || 'submission.completed';
    const dataObj = payload.data || payload;

    const submissionId = String(
      dataObj.submission_id || dataObj.id || payload.submission_id || ''
    );

    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: 'Missing submission_id in webhook payload' },
        { status: 400 }
      );
    }

    let downloadUrl = dataObj.download_url || dataObj.signed_document_url || '';
    if (!downloadUrl && Array.isArray(dataObj.documents) && dataObj.documents.length > 0) {
      downloadUrl = dataObj.documents[0].url || dataObj.documents[0].download_url;
    }

    const nowIso = new Date().toISOString();

    // If downloadUrl exists, try downloading PDF and uploading to Supabase Storage
    let finalSignedUrl = downloadUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

    if (downloadUrl && downloadUrl.startsWith('http')) {
      try {
        const fileRes = await fetch(downloadUrl);
        if (fileRes.ok) {
          const buffer = await fileRes.arrayBuffer();
          const fileName = `signed/${Date.now()}_signed_${submissionId}.pdf`;
          const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
            .from('esign-documents')
            .upload(fileName, buffer, { contentType: 'application/pdf', upsert: true });

          if (!uploadErr && uploadData) {
            const { data: pubData } = supabaseAdmin.storage
              .from('esign-documents')
              .getPublicUrl(fileName);
            finalSignedUrl = pubData.publicUrl;
          }
        }
      } catch (dlErr) {
        console.warn('Could not mirror PDF to Supabase storage, retaining external URL:', dlErr);
      }
    }

    // Update DB record
    const { data: updatedDb, error: dbErr } = await supabaseAdmin
      .from('esign_envelopes')
      .update({
        status: 'Signed',
        signed_document_url: finalSignedUrl,
        signed_on: nowIso,
      })
      .eq('docuseal_submission_id', submissionId)
      .select('*');

    // Update in-memory fallback store as well
    const memoryIdx = memoryEnvelopes.findIndex(
      (e) => e.docuseal_submission_id === submissionId || e.id === submissionId
    );
    if (memoryIdx !== -1) {
      memoryEnvelopes[memoryIdx].status = 'Signed';
      memoryEnvelopes[memoryIdx].signed_document_url = finalSignedUrl;
      memoryEnvelopes[memoryIdx].signed_on = nowIso;
      if (memoryEnvelopes[memoryIdx].submitters) {
        memoryEnvelopes[memoryIdx].submitters = memoryEnvelopes[memoryIdx].submitters!.map((s) => ({
          ...s,
          status: 'completed',
          signed_at: nowIso,
        }));
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully. Envelope updated to Signed.',
      docuseal_submission_id: submissionId,
      signed_document_url: finalSignedUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
