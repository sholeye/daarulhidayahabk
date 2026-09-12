/**
 * Admin Blog Management - Fixed layout with full post view
 */

import React, { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCalendar, FiHeart, FiEye, FiEyeOff, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { BlogPost } from '@/types';
import { useSharedData } from '@/contexts/SharedDataContext';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { formatDate } from '@/utils/helpers';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineLoader } from '@/components/ui/page-loader';

interface BlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  post?: BlogPost;
  onSubmit: (data: Partial<BlogPost>) => void;
}

const BlogModal: React.FC<BlogModalProps> = ({ isOpen, onClose, post, onSubmit }) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [tags, setTags] = useState(post?.tags.join(', ') || '');

  React.useEffect(() => {
    setTitle(post?.title || '');
    setContent(post?.content || '');
    setExcerpt(post?.excerpt || '');
    setTags(post?.tags.join(', ') || '');
  }, [post]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title, content,
      excerpt: excerpt || content.slice(0, 150) + '...',
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      author: 'Abu Kathir AbdulHameed',
      authorRole: 'admin',
      isPublished: true,
    });
    setTitle(''); setContent(''); setExcerpt(''); setTags('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-strong w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">{post ? t.editBlogPost : t.newBlogPost}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors"><FiX className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{t.titleRequired}</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={t.blogTitle} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{t.blogExcerpt}</label>
            <Input value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder={t.excerptOptional} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{t.tagsCommaSeparated}</label>
            <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="Education, Islam, IT" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{t.contentRequired}</label>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              className="w-full h-48 px-3 py-2 rounded-lg border border-input bg-background text-foreground resize-none"
              placeholder={t.writeBlogPost} required />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">{t.cancel}</Button>
            <Button type="submit" className="flex-1">{post ? t.updatePost : t.publishPost}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AdminBlogPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { blogPosts, addBlogPost, updateBlogPost, deleteBlogPost, isLoading } = useSharedData();
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | undefined>();
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSubmit = async (data: Partial<BlogPost>) => {
    try {
      if (editingPost) {
        await updateBlogPost(editingPost.id, { ...data, updatedAt: new Date().toISOString().split('T')[0] });
        toast.success(t.blogPostUpdated);
      } else {
        await addBlogPost(data, user?.id || '');
        toast.success(t.blogPostPublished);
      }
      setEditingPost(undefined);
    } catch (err) {
      toast.error('Failed to save blog post');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteBlogPost(deleteConfirm);
      toast.success(t.blogPostDeleted);
    } catch { toast.error('Failed to delete'); }
    setDeleteConfirm(null);
  };

  const togglePublish = async (id: string) => {
    const post = blogPosts.find(p => p.id === id);
    try {
      await updateBlogPost(id, { isPublished: !post?.isPublished });
      toast.success(post?.isPublished ? t.postUnpublished : t.postPublished);
    } catch { toast.error('Failed to update'); }
  };

  if (isLoading) return <InlineLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t.blog}</h1>
          <p className="text-muted-foreground mt-1">{t.createAndManage}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="btn-glow">
          <FiPlus className="w-4 h-4 mr-2" />{t.newPost}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-2xl font-bold text-foreground">{blogPosts.length}</p>
          <p className="text-sm text-muted-foreground">{t.totalPosts}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-2xl font-bold text-primary">{blogPosts.filter(p => p.isPublished).length}</p>
          <p className="text-sm text-muted-foreground">{t.published}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-2xl font-bold text-secondary">{blogPosts.reduce((s, p) => s + p.likes.length, 0)}</p>
          <p className="text-sm text-muted-foreground">{t.totalLikes}</p>
        </div>
      </div>

      <div className="space-y-4">
        {blogPosts.map(post => {
          const isExpanded = expandedPostId === post.id;
          return (
            <div key={post.id} className={`bg-card rounded-2xl border border-border shadow-soft transition-all ${!post.isPublished ? 'opacity-60' : ''}`}>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-lg text-foreground">{post.title}</h3>
                      {!post.isPublished && <Badge variant="outline" className="opacity-60">{t.draft}</Badge>}
                    </div>
                    {!isExpanded ? (
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt || post.content.slice(0, 200)}</p>
                    ) : (
                      <div className="text-sm text-foreground/90 mt-3 space-y-3">
                        {post.content.split('\n\n').map((p, i) => (
                          <p key={i} className="leading-relaxed">{p}</p>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><FiCalendar className="w-3 h-3" />{formatDate(post.createdAt)}</span>
                      <span className="flex items-center gap-1"><FiHeart className="w-3 h-3" />{post.likes.length} {t.likes}</span>
                      <div className="flex gap-1 flex-wrap">{post.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => togglePublish(post.id)} className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground" title={post.isPublished ? 'Unpublish' : 'Publish'}>
                      {post.isPublished ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { setEditingPost(post); setShowModal(true); }} className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground" title="Edit">
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm(post.id)} className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive" title="Delete">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {blogPosts.length === 0 && (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <p className="text-muted-foreground">{t.noBlogPostsYet}</p>
            <Button onClick={() => setShowModal(true)} className="mt-4">{t.createFirstPost}</Button>
          </div>
        )}
      </div>

      <BlogModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingPost(undefined); }}
        post={editingPost}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}
        title="Delete Blog Post"
        description="Are you sure you want to delete this blog post? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
};
