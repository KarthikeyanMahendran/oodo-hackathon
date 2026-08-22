import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { memoryFeedStore, FeedPost } from '@/lib/store/feedStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { author_id, author_name, author_role, post_type, content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Post content is required.' }, { status: 400 });
    }

    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      author_id: author_id || 'a1111111-1111-1111-1111-111111111111',
      author_name: author_name || 'Sarah Jenkins',
      author_role: author_role || 'ADMIN',
      post_type: post_type === 'QUESTION' ? 'QUESTION' : 'ANNOUNCEMENT',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    memoryFeedStore.unshift(newPost);

    try {
      await supabaseAdmin.from('company_feed').insert({
        id: newPost.id,
        author_id: newPost.author_id,
        post_type: newPost.post_type,
        content: newPost.content,
      });
    } catch (dbErr) {
      console.log('Using memory feed store fallback');
    }

    return NextResponse.json({ success: true, post: newPost }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/feed/post error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to submit post.' },
      { status: 500 }
    );
  }
}
