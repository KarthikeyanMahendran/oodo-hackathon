import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { memoryEnvelopes } from '@/lib/esign/store';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('esign_envelopes')
      .select(`
        *,
        esign_template_types (
          template_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        success: true,
        source: 'memory_fallback',
        data: memoryEnvelopes,
      });
    }

    // Format template_name from joined relation
    const formattedData = data.map((env: any) => ({
      ...env,
      template_name: env.esign_template_types?.template_name || 'Custom Document',
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      source: 'memory_fallback',
      data: memoryEnvelopes,
    });
  }
}
