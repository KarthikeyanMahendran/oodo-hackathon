'use client';

import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Megaphone,
  HelpCircle,
  Cake,
  Clock,
} from 'lucide-react';
import { useHRMS } from '@/lib/context/HRMSContext';
import {
  PageHeader,
  Card,
  Button,
  Select,
  Badge,
  Modal,
  EmptyState,
} from '@/components/ui';

interface FeedPost {
  id: string;
  author_id: string;
  author_name: string;
  author_role: 'ADMIN' | 'EMPLOYEE';
  post_type: 'ANNOUNCEMENT' | 'QUESTION' | 'MILESTONE';
  content: string;
  created_at: string;
}

export default function FeedPage() {
  const { currentRole, currentUser } = useHRMS();
  const isAdmin = currentRole === 'ADMIN';

  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ANNOUNCEMENT' | 'QUESTION' | 'MILESTONE'>('ALL');

  // Modal Post Composer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postType, setPostType] = useState<'ANNOUNCEMENT' | 'QUESTION'>('ANNOUNCEMENT');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFeed = async () => {
    try {
      const res = await fetch('/api/feed');
      if (res.ok) {
        const data = await res.json();
        setFeed(data.feed || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);

    try {
      const payload = {
        author_id: currentUser?.id || 'a1111111-1111-1111-1111-111111111111',
        author_name: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Sarah Jenkins',
        author_role: currentRole || 'ADMIN',
        post_type: postType,
        content: content.trim(),
      };

      const res = await fetch('/api/feed/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setContent('');
        fetchFeed();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await fetch(`/api/feed/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFeed((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFeed = feed.filter(
    (item) => activeTab === 'ALL' || item.post_type === activeTab
  );

  return (
    <div className="hr-stack max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Notice Board & Timeline"
        subtitle="Broadcast company announcements, ask HR questions & celebrate employee anniversaries"
        actions={
          <Button icon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>
            Post Update / Question
          </Button>
        }
      />

      {/* Clean Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border-none text-xs font-semibold">
        {(['ALL', 'ANNOUNCEMENT', 'QUESTION', 'MILESTONE'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg border-none outline-none cursor-pointer transition-all ${
              activeTab === tab
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-bold'
                : 'bg-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-medium'
            }`}
          >
            {tab === 'ALL'
              ? 'All Activity'
              : tab === 'ANNOUNCEMENT'
              ? '📢 Announcements'
              : tab === 'QUESTION'
              ? '💬 Q&A Questions'
              : '🎂 Milestones'}
          </button>
        ))}
      </div>

      {/* Feed Posts Timeline */}
      {loading ? (
        <div className="p-8 text-center text-xs text-muted">Loading notice board feed...</div>
      ) : filteredFeed.length === 0 ? (
        <Card>
          <EmptyState
            icon={MessageSquare}
            title="No activity posted yet"
            description="Click 'Post Update / Question' to publish the first company update."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFeed.map((post) => {
            const isMilestone = post.post_type === 'MILESTONE';
            const isQuestion = post.post_type === 'QUESTION';

            return (
              <Card key={post.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="hr-avatar hr-avatar-sm !bg-zinc-100 dark:!bg-zinc-800 !text-zinc-700 dark:!text-zinc-300 mt-0.5">
                      {isMilestone ? (
                        <Cake size={15} className="text-amber-500" />
                      ) : isQuestion ? (
                        <HelpCircle size={15} className="text-indigo-500" />
                      ) : (
                        <Megaphone size={15} className="text-emerald-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">
                          {post.author_name}
                        </span>
                        <Badge tone={post.author_role === 'ADMIN' ? 'warning' : 'muted'}>
                          {post.author_role}
                        </Badge>
                        <Badge
                          tone={
                            isMilestone ? 'success' : isQuestion ? 'info' : 'warning'
                          }
                        >
                          {post.post_type}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted flex items-center gap-1 mt-0.5 font-mono">
                        <Clock size={11} /> {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(post.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>

                  {isAdmin && !isMilestone && (
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 rounded-lg border-none outline-none bg-transparent cursor-pointer text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Delete post"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="mt-3 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal bg-zinc-50/80 dark:bg-zinc-800/40 p-3.5 rounded-xl border-none">
                  {post.content}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Post Creator Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Post to Notice Board"
        subtitle="Share announcements or submit HR questions to the team"
        size="md"
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <Select
            label="Post Type"
            value={postType}
            onChange={(e) => setPostType(e.target.value as any)}
          >
            <option value="ANNOUNCEMENT">📢 Company Announcement (Broadcasting update)</option>
            <option value="QUESTION">💬 HR Question (General query or topic)</option>
          </Select>

          <div>
            <label className="hr-form-label mb-1">
              Content Message <span className="hr-required">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement or question details here..."
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Publish Post
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
