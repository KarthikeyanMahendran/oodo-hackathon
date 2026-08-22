import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { memoryFeedStore } from '@/lib/store/feedStore';

export async function GET() {
  try {
    // 1. Fetch manual posts
    const { data: dbPosts } = await supabaseAdmin
      .from('company_feed')
      .select('*, profiles:author_id(first_name, last_name, role)')
      .order('created_at', { ascending: false });

    let posts = memoryFeedStore;
    if (dbPosts && dbPosts.length > 0) {
      posts = dbPosts.map((p) => ({
        id: p.id,
        author_id: p.author_id,
        author_name: p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}` : 'Team Member',
        author_role: p.profiles?.role || 'EMPLOYEE',
        post_type: p.post_type,
        content: p.content,
        created_at: p.created_at,
      }));
    }

    // 2. Fetch profiles for dynamic Milestones (birthdays & anniversaries)
    const { data: profiles } = await supabaseAdmin.from('profiles').select('*');

    const milestones: { id: string; author_id?: string; author_name: string; author_role: string; post_type: string; content: string; created_at: string }[] = [];
    const now = new Date();

    if (profiles && profiles.length > 0) {
      profiles.forEach((emp) => {
        const empName = `${emp.first_name} ${emp.last_name}`;

        // Work Anniversary calculation
        if (emp.created_at) {
          const joinDate = new Date(emp.created_at);
          const yearsWithCompany = now.getFullYear() - joinDate.getFullYear();
          if (yearsWithCompany >= 1) {
            milestones.push({
              id: `anniv-${emp.id}`,
              author_name: 'Company Bot 🎂',
              author_role: 'ADMIN',
              post_type: 'MILESTONE',
              content: `🎈 Happy ${yearsWithCompany}-Year Work Anniversary to ${empName}! Thank you for your incredible contributions to the team.`,
              created_at: new Date(now.getFullYear(), joinDate.getMonth(), joinDate.getDate()).toISOString(),
            });
          }
        }
      });
    } else {
      // Fallback sample milestones
      milestones.push({
        id: 'anniv-sample-1',
        author_name: 'Company Bot 🎂',
        author_role: 'ADMIN',
        post_type: 'MILESTONE',
        content: '🎈 Happy 2-Year Work Anniversary to Marcus Chen! Thank you for leading software development.',
        created_at: new Date().toISOString(),
      });
    }

    // Combined timeline sorted by date
    const combinedFeed = [...milestones, ...posts].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ success: true, feed: combinedFeed });
  } catch (err: unknown) {
    console.error('GET /api/feed error:', err);
    return NextResponse.json({ success: true, feed: memoryFeedStore });
  }
}
