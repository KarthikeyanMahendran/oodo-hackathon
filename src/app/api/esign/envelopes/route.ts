import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { memoryEnvelopes } from '@/lib/esign/store';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('esign_envelopes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        success: true,
        source: 'memory_fallback',
        envelopes: memoryEnvelopes,
      });
    }

    return NextResponse.json({
      success: true,
      envelopes: data,
    });
  } catch (err: unknown) {
    return NextResponse.json({
      success: true,
      source: 'memory_fallback',
      envelopes: memoryEnvelopes,
    });
  }
}
