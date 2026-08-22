import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { memoryAssetsStore } from '@/lib/store/itAssetsStore';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assetId } = await params;
    const body = await req.json();
    const { status, assigned_to } = body;

    if (!assetId || !status) {
      return NextResponse.json(
        { error: 'Asset ID and status are required.' },
        { status: 400 }
      );
    }

    const updatedAt = new Date().toISOString();
    const isUnassigned = status === 'RECOVERED' || status === 'AVAILABLE' || status === 'UNDER_REPAIR';

    // Update in-memory store
    const idx = memoryAssetsStore.findIndex((a) => a.id === assetId);
    if (idx !== -1) {
      memoryAssetsStore[idx] = {
        ...memoryAssetsStore[idx],
        status,
        assigned_to: isUnassigned ? null : (assigned_to !== undefined ? assigned_to : memoryAssetsStore[idx].assigned_to),
        assigned_date: isUnassigned ? null : memoryAssetsStore[idx].assigned_date,
      };
    }

    try {
      await supabaseAdmin.from('it_assets').update({
        status,
        assigned_to: isUnassigned ? null : assigned_to,
        updated_at: updatedAt,
      }).eq('id', assetId);
    } catch (dbErr) {
      console.log('Using memory store fallback for asset status update');
    }

    return NextResponse.json({
      success: true,
      message: `Asset ${assetId} updated to status ${status}.`,
      asset: memoryAssetsStore[idx] || { id: assetId, status },
    });
  } catch (err: any) {
    console.error('PATCH /api/assets/[id] error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update asset status.' },
      { status: 500 }
    );
  }
}
