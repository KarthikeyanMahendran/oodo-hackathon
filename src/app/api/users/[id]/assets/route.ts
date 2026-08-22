import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { memoryAssetsStore } from '@/lib/store/itAssetsStore';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const { data: dbAssets, error } = await supabaseAdmin
      .from('it_assets')
      .select('*')
      .eq('assigned_to', userId);

    if (!error && dbAssets && dbAssets.length > 0) {
      return NextResponse.json({ success: true, assets: dbAssets });
    }

    const userAssets = memoryAssetsStore.filter((a) => a.assigned_to === userId);
    return NextResponse.json({ success: true, assets: userAssets });
  } catch (err: unknown) {
    console.error('GET /api/users/[id]/assets error:', err);
    return NextResponse.json({ success: true, assets: [] });
  }
}
