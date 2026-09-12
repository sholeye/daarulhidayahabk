/**
 * Blog Page - Public blog with admin posting and authenticated user likes
 */

import React, { useState } from 'react';
import { Navbar } from '@/features/common/Navbar';
import { Footer } from '@/features/common/Footer';
import { FiHeart, FiCalendar, FiTag, FiUser } from 'react-icons/fi';
import { BlogPost } from '@/types';
import { useAuth } from '@/features/auth/AuthContext';
import { useSharedData } from '@/contexts/SharedDataContext';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/helpers';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const Blog: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { t, isRTL } = useLanguage();
  const { blogPosts, toggleBlogLike } = useSharedData();
  const publishedPosts = blogPosts.filter(p => p.isPublished);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const handleLike = (postId: string) => {
    if (!isAuthenticated || !user) {
      toast.error(t.pleaseLoginToLike);
      return;
    }
    toggleBlogLike(postId, user.id);
  };

  const hasLiked = (post: BlogPost) => user ? post.likes.includes(user.id) : false;

  // Keep selectedPost in sync with shared data
  const currentSelectedPost = selectedPost ? publishedPosts.find(p => p.id === selectedPost.id) || null : null;

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      <main className="pt-20 md:pt-24">
        {/* Hero */}
        <section className="py-12 md:py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{t.blog}</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">{t.blogSubtitle}</p>
          </div>
        </section>

        {/* Blog Grid */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            {currentSelectedPost ? (
              <div className="max-w-3xl mx-auto">
                <button onClick={() => setSelectedPost(null)} className="text-primary hover:underline mb-6 text-sm font-medium">
                  {t.backToAllPosts}
                </button>
                <article className="bg-card rounded-2xl border border-border p-6 md:p-8">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentSelectedPost.tags.map(tag => (
                      <Badge key={tag} variant="outline"><FiTag className="w-3 h-3 mr-1" />{tag}</Badge>
                    ))}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{currentSelectedPost.title}</h1>
                  <div className="flex items-center gap-4 mb-8 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><FiUser className="w-4 h-4" />{currentSelectedPost.author}</span>
                    <span className="flex items-center gap-1"><FiCalendar className="w-4 h-4" />{formatDate(currentSelectedPost.createdAt)}</span>
                  </div>
                  <div className="prose prose-lg max-w-none text-foreground">
                    {currentSelectedPost.content.split('\n\n').map((p, i) => (
                      <p key={i} className="mb-4 text-foreground/90 leading-relaxed">{p}</p>
                    ))}
                  </div>
                  <div className="mt-8 pt-6 border-t border-border flex items-center gap-4">
                    <button onClick={() => handleLike(currentSelectedPost.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${hasLiked(currentSelectedPost) ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                      <FiHeart className={`w-5 h-5 ${hasLiked(currentSelectedPost) ? 'fill-current' : ''}`} />
                      <span>{currentSelectedPost.likes.length} {t.likes}</span>
                    </button>
                  </div>
                </article>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedPosts.map(post => (
                  <article key={post.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs"><FiTag className="w-3 h-3 mr-1" />{tag}</Badge>
                        ))}
                      </div>
                      <h2 className="text-lg font-bold text-foreground mb-2 line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => setSelectedPost(post)}>
                        {post.title}
                      </h2>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{post.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FiCalendar className="w-3 h-3" />
                          {formatDate(post.createdAt)}
                        </div>
                        <button onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-1.5 text-sm transition-colors ${hasLiked(post) ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}>
                          <FiHeart className={`w-4 h-4 ${hasLiked(post) ? 'fill-current' : ''}`} />
                          <span>{post.likes.length}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {publishedPosts.length === 0 && (
              <div className="text-center py-12"><p className="text-muted-foreground">{t.noBlogPosts}</p></div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
