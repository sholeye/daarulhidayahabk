import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { Button } from '@/components/ui/button';

export const ContactCTASection: React.FC = () => {
  return (
    <section id="contact-cta" className="py-20 md:py-28 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground relative overflow-hidden">
      {/* Decorative Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30L30 0z' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px',
        }} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Begin Your Child's Islamic Education Journey
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Join Daarul Hidayah and give your child the foundation of authentic Islamic knowledge 
            combined with modern education.
          </p>

          {/* Contact Info */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-10">
            <a href="tel:08085944916" className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <FiPhone className="w-4 h-4" />
              <span>08085944916</span>
            </a>
            <a href="mailto:daarulhidayahabk@gmail.com" className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <FiMail className="w-4 h-4" />
              <span>daarulhidayahabk@gmail.com</span>
            </a>
            <span className="flex items-center gap-2 text-primary-foreground/80">
              <FiMapPin className="w-4 h-4" />
              <span>Ita Ika, Abeokuta</span>
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/contact">
              <Button variant="accent" size="xl" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                Contact Us
                <FiArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="heroOutline" size="xl">
                Access Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
