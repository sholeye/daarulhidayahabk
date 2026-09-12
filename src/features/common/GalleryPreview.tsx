/**
 * GalleryPreview - Stunning gallery preview with animations
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiImage } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

// Demo gallery images (placeholder gradients)
const galleryImages = [
  { id: 1, category: 'learning', gradient: 'from-primary/30 to-primary/10' },
  { id: 2, category: 'activities', gradient: 'from-secondary/30 to-secondary/10' },
  { id: 3, category: 'islamic', gradient: 'from-accent/30 to-accent/10' },
  { id: 4, category: 'school', gradient: 'from-primary/20 to-secondary/20' },
  { id: 5, category: 'learning', gradient: 'from-secondary/20 to-primary/20' },
  { id: 6, category: 'activities', gradient: 'from-primary/25 to-accent/15' },
];

export const GalleryPreview: React.FC = () => {
  const { t, isRTL } = useLanguage();

  return (
    <section id="gallery" dir={isRTL ? 'rtl' : 'ltr'} className="py-24 md:py-32 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t.galleryTitle.split(' ')[0]} <span className="text-gradient-primary">{t.galleryTitle.split(' ').slice(1).join(' ')}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {t.gallerySubtitle}
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto mb-10">
          {galleryImages.map((image, index) => (
            <div
              key={image.id}
              className={`gallery-item aspect-square bg-gradient-to-br ${image.gradient} border border-border flex items-center justify-center animate-scale-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <FiImage className="w-12 h-12 text-foreground/20" />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center animate-slide-up delay-500">
          <Link to="/gallery">
            <Button variant="outline" size="lg" className="group">
              {t.viewGallery}
              <FiArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};