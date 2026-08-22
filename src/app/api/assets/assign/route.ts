import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { memoryAssetsStore } from '@/lib/store/itAssetsStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { asset_id, user_id } = body;

    if (!asset_id || !user_id) {
      return NextResponse.json(
        { error: 'asset_id and user_id are required.' },
        { status: 400 }
      );
    }

    const assignedDate = new Date().toISOString();

    // Update in-memory store
    const assetIdx = memoryAssetsStore.findIndex((a) => a.id === asset_id);
    if (assetIdx !== -1) {
      memoryAssetsStore[assetIdx] = {
        ...memoryAssetsStore[assetIdx],
        status: 'ASSIGNED',
        assigned_to: user_id,
        assigned_date: assignedDate,
      };
    }

    try {
      await supabaseAdmin.from('it_assets').update({
        status: 'ASSIGNED',
        assigned_to: user_id,
        assigned_date: assignedDate,
        updated_at: assignedDate,
      }).eq('id', asset_id);
    } catch (dbErr) {
      console.log('Using fallback memory store for asset assign');
    }

    return NextResponse.json({
      success: true,
      message: `Asset ${asset_id} successfully assigned to user ${user_id}.`,
      asset: memoryAssetsStore[assetIdx] || { asset_id, user_id, status: 'ASSIGNED' },
    });
  } catch (err: any) {
    console.error('POST /api/assets/assign error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to assign asset.' },
      { status: 500 }
    );
  }
}
