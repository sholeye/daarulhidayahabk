/**
 * Footer - Site footer with i18n support
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';

export const Footer: React.FC = () => {
  const { t, isRTL } = useLanguage();

  return (
    <footer dir={isRTL ? 'rtl' : 'ltr'} className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* School Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">D</span>
              </div>
              <div>
                <h3 className="font-bold text-xl">{t.schoolName}</h3>
                <p className="text-primary-foreground/70 text-sm">{t.schoolSubtitle}</p>
              </div>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed mb-4 italic">
              {t.englishMotto}
            </p>
            <p className="text-primary-foreground/70 text-sm">
              {t.footerDescription}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">{t.quickLinks}</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  {t.about}
                </Link>
              </li>
              <li>
                <Link to="/curriculum" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  {t.curriculum}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  {t.contact}
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  {t.studentPortal}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">{t.contactUs}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <FiMapPin className="w-4 h-4 mt-1 text-secondary" />
                <span className="text-primary-foreground/70 text-sm">
                  Ita Ika, Abeokuta,<br />Ogun State, Nigeria
                </span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="w-4 h-4 text-secondary" />
                <a href="tel:08085944916" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  08085944916
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="w-4 h-4 text-secondary" />
                <a href="mailto:daarulhidayahabk@gmail.com" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  daarulhidayahabk@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/10 mt-8 pt-8 text-center">
          <p className="text-primary-foreground/60 text-sm">
            © {new Date().getFullYear()} {t.schoolName} {t.schoolSubtitle}. {t.allRightsReserved}
          </p>
          <p className="text-primary-foreground/40 text-xs mt-2">
            {t.director}: Abu Kathir AbdulHameed Olohunsola, MCPN
          </p>
        </div>
      </div>
    </footer>
  );
};
