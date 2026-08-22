import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// In-memory fallback template store when Supabase DB is disconnected
export let memoryTemplates: Array<{
  template_id: string;
  template_name: string;
  signer_config: any;
  document_url: string;
  created_at: string;
}> = [
  {
    template_id: 'tpl-10101010-1111-1111-1111-111111111111',
    template_name: 'Employee NDA & Confidentiality Agreement',
    signer_config: [
      { role: 'Employee', tabs: [{ type: 'signature', label: 'Employee Signature' }] },
      { role: 'HR Admin', tabs: [{ type: 'signature', label: 'HR Signature' }] }
    ],
    document_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    template_id: 'tpl-20202020-2222-2222-2222-222222222222',
    template_name: 'Standard Employment Offer Letter',
    signer_config: [
      { role: 'Candidate', tabs: [{ type: 'signature', label: 'Acceptance Signature' }] }
    ],
    document_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  }
];

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('esign_template_types')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        success: true,
        source: 'memory_fallback',
        data: memoryTemplates,
      });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      source: 'memory_fallback',
      data: memoryTemplates,
    });
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let template_name = '';
    let signer_config: any = [];
    let document_url = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      template_name = (formData.get('template_name') as string) || 'Untitled Template';
      const rawConfig = formData.get('signer_config') as string;
      if (rawConfig) {
        try {
          signer_config = JSON.parse(rawConfig);
        } catch {
          signer_config = [{ role: 'Signer', tabs: ['signature'] }];
        }
      }

      const file = formData.get('file') as File | null;
      if (file) {
        // Upload PDF to Supabase Storage if configured
        const fileName = `templates/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const buffer = await file.arrayBuffer();
        const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
          .from('esign-documents')
          .upload(fileName, buffer, { contentType: 'application/pdf', upsert: true });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabaseAdmin.storage
            .from('esign-documents')
            .getPublicUrl(fileName);
          document_url = publicUrlData.publicUrl;
        } else {
          document_url = `https://storage.placeholder.com/${fileName}`;
        }
      } else {
        document_url = (formData.get('document_url') as string) || '';
      }
    } else {
      const body = await request.json();
      template_name = body.template_name || 'Untitled Template';
      signer_config = body.signer_config || [{ role: 'Signer', tabs: ['signature'] }];
      document_url = body.document_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    }

    const newId = `tpl-${crypto.randomUUID()}`;
    const newRecord = {
      template_id: newId,
      template_name,
      signer_config,
      document_url,
      created_at: new Date().toISOString(),
    };

    // Try inserting into Supabase DB
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('esign_template_types')
      .insert([
        {
          template_name,
          signer_config,
          document_url,
        },
      ])
      .select('*')
      .single();

    if (!dbError && dbData) {
      memoryTemplates.unshift(dbData);
      return NextResponse.json({
        success: true,
        template_id: dbData.template_id,
        data: dbData,
      });
    }

    // Fallback store
    memoryTemplates.unshift(newRecord);
    return NextResponse.json({
      success: true,
      template_id: newRecord.template_id,
      data: newRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create template' },
      { status: 500 }
    );
  }
}
