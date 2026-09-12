/**
 * Announcements Management Page - CRUD with shared state
 */

import React, { useState } from 'react';
import { 
  FiBell, FiPlus, FiEdit2, FiTrash2, FiX, FiCalendar,
  FiAlertCircle, FiInfo, FiBookOpen
} from 'react-icons/fi';
import { Announcement } from '@/types';
import { useSharedData } from '@/contexts/SharedDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDate } from '@/utils/helpers';

const categoryIcons: Record<string, React.ElementType> = {
  academic: FiBookOpen,
  event: FiCalendar,
  urgent: FiAlertCircle,
  general: FiInfo,
};

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement?: Announcement;
  onSubmit: (data: Partial<Announcement>) => void;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ 
  isOpen, onClose, announcement, onSubmit 
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Announcement['category']>('general');

  // Re-populate when editing
  React.useEffect(() => {
    if (announcement) {
      setTitle(announcement.title);
      setContent(announcement.content);
      setCategory(announcement.category);
    } else {
      setTitle('');
      setContent('');
      setCategory('general');
    }
  }, [announcement]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, content, category, isActive: true });
    setTitle('');
    setContent('');
    setCategory('general');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-strong w-full max-w-lg">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {announcement ? 'Edit Announcement' : 'New Announcement'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as Announcement['category'])}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground">
              <option value="general">General</option>
              <option value="academic">Academic</option>
              <option value="event">Event</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Content *</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)}
              className="w-full h-32 px-3 py-2 rounded-lg border border-input bg-background text-foreground resize-none"
              placeholder="Write your announcement..." required />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{announcement ? 'Update' : 'Publish'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AnnouncementsPage: React.FC = () => {
  const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement, toggleAnnouncementActive } = useSharedData();
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | undefined>();

  const handleSubmit = async (data: Partial<Announcement>) => {
    try {
      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, data);
        toast.success('Announcement updated!');
      } else {
        await addAnnouncement(data);
        toast.success('Announcement published!');
      }
      setEditingAnnouncement(undefined);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save announcement');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      deleteAnnouncement(id);
      toast.success('Announcement deleted!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground mt-1">Manage school announcements</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="btn-glow">
          <FiPlus className="w-4 h-4 mr-2" />New Announcement
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-2xl font-bold text-foreground">{announcements.length}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-2xl font-bold text-primary">{announcements.filter(a => a.isActive).length}</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-2xl font-bold text-destructive">{announcements.filter(a => a.category === 'urgent').length}</p>
          <p className="text-sm text-muted-foreground">Urgent</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-2xl font-bold text-secondary">{announcements.filter(a => a.category === 'event').length}</p>
          <p className="text-sm text-muted-foreground">Events</p>
        </div>
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => {
          const Icon = categoryIcons[announcement.category] || FiInfo;
          return (
            <div key={announcement.id} className={`bg-card rounded-2xl border border-border p-6 shadow-soft transition-opacity ${!announcement.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    announcement.category === 'urgent' ? 'bg-destructive/10' :
                    announcement.category === 'event' ? 'bg-secondary/10' :
                    announcement.category === 'academic' ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      announcement.category === 'urgent' ? 'text-destructive' :
                      announcement.category === 'event' ? 'text-secondary' :
                      announcement.category === 'academic' ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                      <Badge variant={announcement.category === 'urgent' ? 'unpaid' : 'outline'}>{announcement.category}</Badge>
                      {!announcement.isActive && <Badge variant="outline" className="opacity-60">Inactive</Badge>}
                    </div>
                    <p className="text-muted-foreground text-sm line-clamp-2">{announcement.content}</p>
                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                      <FiCalendar className="w-3 h-3" />{formatDate(announcement.createdAt)} by {announcement.createdBy}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleAnnouncementActive(announcement.id)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    title={announcement.isActive ? 'Deactivate' : 'Activate'}>
                    {announcement.isActive ? <FiBell className="w-4 h-4" /> : <FiBell className="w-4 h-4 opacity-50" />}
                  </button>
                  <button onClick={() => { setEditingAnnouncement(announcement); setShowModal(true); }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(announcement.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {announcements.length === 0 && (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <FiBell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No announcements yet</p>
            <Button onClick={() => setShowModal(true)} className="mt-4">Create First Announcement</Button>
          </div>
        )}
      </div>

      <AnnouncementModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingAnnouncement(undefined); }}
        announcement={editingAnnouncement}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
