import React from 'react';
import { FiBell, FiAlertCircle, FiBookOpen, FiCalendar } from 'react-icons/fi';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSharedData } from '@/contexts/SharedDataContext';

const categoryIcons = { general: FiBell, academic: FiBookOpen, event: FiCalendar, urgent: FiAlertCircle };
const categoryColors = { general: 'bg-muted', academic: 'bg-primary/10 text-primary', event: 'bg-secondary/10 text-secondary', urgent: 'bg-destructive/10 text-destructive' };

export const AnnouncementsSection: React.FC = () => {
  const { t } = useLanguage();
  const { announcements } = useSharedData();
  const allAnnouncements = announcements.filter(a => a.isActive);

  if (allAnnouncements.length === 0) return null;

  return (
    <section id="announcements" className="py-16 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t.announcementsTitle.split(' ')[0]} <span className="text-gradient-primary">{t.announcementsTitle.split(' ').slice(1).join(' ') || t.announcementsTitle}</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">{t.announcementsSubtitle}</p>
        </div>

        {/* All Announcements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {allAnnouncements.map((announcement) => {
            const Icon = categoryIcons[announcement.category];
            return (
              <div key={announcement.id} className="p-5 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${categoryColors[announcement.category]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h4 className="font-semibold text-foreground text-sm">{announcement.title}</h4>
                      <Badge variant={announcement.category === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                        {announcement.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{announcement.content}</p>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
