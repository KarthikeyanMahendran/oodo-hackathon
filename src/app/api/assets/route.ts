import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { memoryAssetsStore } from '@/lib/store/itAssetsStore';

export async function GET() {
  try {
    const { data: assets, error } = await supabaseAdmin
      .from('it_assets')
      .select('*, profiles:assigned_to(first_name, last_name, login_id)')
      .order('created_at', { ascending: false });

    if (!error && assets && assets.length > 0) {
      return NextResponse.json({ success: true, assets });
    }

    return NextResponse.json({ success: true, assets: memoryAssetsStore });
  } catch (err: any) {
    console.error('GET /api/assets error:', err);
    return NextResponse.json({ success: true, assets: memoryAssetsStore });
  }
}
