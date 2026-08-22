import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { memoryFeedStore } from '@/lib/store/feedStore';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required.' }, { status: 400 });
    }

    // Delete from memory store
    const idx = memoryFeedStore.findIndex((p) => p.id === postId);
    if (idx !== -1) {
      memoryFeedStore.splice(idx, 1);
    }

    try {
      await supabaseAdmin.from('company_feed').delete().eq('id', postId);
    } catch (dbErr) {
      console.log('Using memory feed store fallback for delete');
    }

    return NextResponse.json({
      success: true,
      message: `Post ${postId} deleted successfully.`,
    });
  } catch (err: any) {
    console.error('DELETE /api/feed/[id] error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete post.' },
      { status: 500 }
    );
  }
}
