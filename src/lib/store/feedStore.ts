export interface FeedPost {
  id: string;
  author_id: string;
  author_name: string;
  author_role: 'ADMIN' | 'EMPLOYEE';
  post_type: 'ANNOUNCEMENT' | 'QUESTION' | 'MILESTONE';
  content: string;
  created_at: string;
}

export const INITIAL_FEED_POSTS: FeedPost[] = [
  {
    id: 'post-101',
    author_id: 'a1111111-1111-1111-1111-111111111111',
    author_name: 'Sarah Jenkins',
    author_role: 'ADMIN',
    post_type: 'ANNOUNCEMENT',
    content: '🎉 Welcome everyone to Q3 All-Hands Meeting next Tuesday at 10 AM EST! Annual e-signature policy updates are now live.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'post-102',
    author_id: 'e3333333-3333-3333-3333-333333333333',
    author_name: 'Alex Rivera',
    author_role: 'EMPLOYEE',
    post_type: 'QUESTION',
    content: 'Quick HR question: What is the deadline for submitting medical expense reimbursements for this quarter?',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

export let memoryFeedStore: FeedPost[] = [...INITIAL_FEED_POSTS];
