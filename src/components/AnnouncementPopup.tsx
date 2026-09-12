/**
 * Announcement Popup - Shows active announcements on first landing page visit
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiChevronRight, FiChevronLeft, FiAlertCircle, FiBookOpen, FiCalendar } from 'react-icons/fi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSharedData } from '@/contexts/SharedDataContext';

const categoryIcons = { general: FiBell, academic: FiBookOpen, event: FiCalendar, urgent: FiAlertCircle };
const categoryColors = {
  general: 'bg-primary/10 text-primary',
  academic: 'bg-secondary/10 text-secondary',
  event: 'bg-accent/10 text-accent-foreground',
  urgent: 'bg-destructive/10 text-destructive',
};

export const AnnouncementPopup: React.FC = () => {
  const { announcements } = useSharedData();
  const activeAnnouncements = announcements.filter(a => a.isActive);
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeAnnouncements.length === 0) return;
    const key = 'dh_announcements_seen';
    const lastSeen = sessionStorage.getItem(key);
    const latestId = activeAnnouncements[0]?.id;
    if (lastSeen !== latestId) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [activeAnnouncements]);

  const handleClose = () => {
    setIsOpen(false);
    if (activeAnnouncements.length > 0) {
      sessionStorage.setItem('dh_announcements_seen', activeAnnouncements[0].id);
    }
  };

  const current = activeAnnouncements[currentIndex];
  if (!current) return null;
  const Icon = categoryIcons[current.category] || FiBell;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Popup */}
          <motion.div
            className="relative bg-card rounded-2xl border border-border shadow-strong w-full max-w-lg overflow-hidden"
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <FiBell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">School Announcements</h2>
                  <p className="text-xs text-muted-foreground">
                    {activeAnnouncements.length} active announcement{activeAnnouncements.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                className="p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${categoryColors[current.category]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-bold text-lg text-foreground">{current.title}</h3>
                      <Badge
                        variant={current.category === 'urgent' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {current.category}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{current.content}</p>
                    <p className="text-xs text-muted-foreground/60 mt-3">
                      {new Date(current.createdAt).toLocaleDateString('en-NG', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div className="px-6 pb-5 flex items-center justify-between">
              <div className="flex gap-1.5">
                {activeAnnouncements.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === currentIndex ? 'bg-primary w-6' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {currentIndex > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentIndex(i => i - 1)}
                  >
                    <FiChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                )}
                {currentIndex < activeAnnouncements.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setCurrentIndex(i => i + 1)}
                  >
                    Next <FiChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleClose}>
                    Got it!
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
