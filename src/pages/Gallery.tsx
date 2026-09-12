/**
 * Gallery Page - Full gallery with grid layout
 */

import React from 'react';
import { Navbar } from '@/features/common/Navbar';
import { Footer } from '@/features/common/Footer';
import { FiImage } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';

const galleryImages = [
  { id: 1, category: 'learning', gradient: 'from-primary/30 to-primary/10' },
  { id: 2, category: 'activities', gradient: 'from-secondary/30 to-secondary/10' },
  { id: 3, category: 'islamic', gradient: 'from-accent/30 to-accent/10' },
  { id: 4, category: 'school', gradient: 'from-primary/20 to-secondary/20' },
  { id: 5, category: 'learning', gradient: 'from-secondary/20 to-primary/20' },
  { id: 6, category: 'activities', gradient: 'from-primary/25 to-accent/15' },
  { id: 7, category: 'islamic', gradient: 'from-accent/20 to-primary/20' },
  { id: 8, category: 'school', gradient: 'from-secondary/25 to-accent/15' },
  { id: 9, category: 'learning', gradient: 'from-primary/35 to-secondary/15' },
];

const Gallery: React.FC = () => {
  const { t, isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12 animate-slide-up">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t.galleryTitle}
            </h1>
            <p className="text-lg text-muted-foreground">{t.gallerySubtitle}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {galleryImages.map((image, index) => (
              <div
                key={image.id}
                className={`gallery-item aspect-square bg-gradient-to-br ${image.gradient} border border-border flex items-center justify-center animate-scale-in`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <FiImage className="w-12 h-12 text-foreground/20" />
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Gallery;