import React, { useState, useEffect } from 'react';
import { FiCalendar, FiMapPin, FiClock } from 'react-icons/fi';
import { Badge } from '@/components/ui/badge';
import { useSharedData } from '@/contexts/SharedDataContext';

export const EventsSection: React.FC = () => {
  const { announcements } = useSharedData();

  // Use announcements as events - "event" category ones are events
  const eventAnnouncements = announcements.filter(a => a.isActive && a.category === 'event');
  const generalAnnouncements = announcements.filter(a => a.isActive && a.category !== 'event').slice(0, 4);

  if (eventAnnouncements.length === 0 && generalAnnouncements.length === 0) {
    return null;
  }

  return (
    <section id="events" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            School <span className="text-gradient-primary">Events & News</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Stay updated with our latest announcements and events.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Events */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <FiCalendar className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-foreground">Events</h3>
            </div>
            <div className="space-y-4">
              {eventAnnouncements.length > 0 ? eventAnnouncements.map((event) => (
                <div key={event.id} className="p-5 rounded-xl bg-primary/5 border-l-4 border-primary">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-foreground">{event.title}</h4>
                    <Badge variant="success">Event</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{event.content}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FiCalendar className="w-3 h-3" />
                      <span>{new Date(event.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-muted-foreground text-sm italic">No events at the moment.</p>
              )}
            </div>
          </div>

          {/* News / Announcements */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <FiClock className="w-5 h-5 text-secondary" />
              <h3 className="text-xl font-bold text-foreground">Latest News</h3>
            </div>
            <div className="space-y-4">
              {generalAnnouncements.length > 0 ? generalAnnouncements.map((ann) => (
                <div key={ann.id} className="p-5 rounded-xl bg-secondary/5 border-l-4 border-secondary">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-foreground">{ann.title}</h4>
                    <Badge variant="warning">{ann.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{ann.content}</p>
                  <div className="text-xs text-muted-foreground">
                    {new Date(ann.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              )) : (
                <p className="text-muted-foreground text-sm italic">No news at the moment.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
