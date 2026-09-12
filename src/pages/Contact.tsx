import React, { useState } from 'react';
import { Navbar } from '@/features/common/Navbar';
import { Footer } from '@/features/common/Footer';
import { FiMail, FiPhone, FiMapPin, FiSend } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const Contact: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subject: '', message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success(t.messageSent);
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      <main className="pt-20">
        <section className="py-14 md:py-16 bg-muted/30 islamic-pattern">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t.contactTitle} <span className="text-gradient-primary">{t.contactUs}</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground">{t.contactSubtitle}</p>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t.getInTouch}</h2>
                  <p className="text-muted-foreground mb-6 text-sm md:text-base">{t.getInTouchDesc}</p>

                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FiMapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{t.addressLabel}</h3>
                        <p className="text-muted-foreground text-sm">{t.addressValue}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FiPhone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{t.phoneLabel}</h3>
                        <a href="tel:08085944916" className="text-muted-foreground hover:text-primary transition-colors text-sm">08085944916</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FiMail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{t.emailLabel}</h3>
                        <a href="mailto:daarulhidayahabk@gmail.com" className="text-muted-foreground hover:text-primary transition-colors text-sm">daarulhidayahabk@gmail.com</a>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-5 rounded-xl bg-muted/50">
                    <h3 className="font-semibold text-foreground mb-2">{t.schoolHours}</h3>
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <p>{t.schoolHoursWeekdays}</p>
                      <p>{t.schoolHoursFriday}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-soft">
                  <h2 className="text-xl font-bold text-foreground mb-5">{t.sendMessage}</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">{t.nameLabel}</label>
                        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={t.nameLabel} required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">{t.phoneLabel}</label>
                        <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder={t.phonePlaceholder} required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">{t.emailLabel}</label>
                      <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder={t.emailPlaceholder} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">{t.subjectLabel}</label>
                      <Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder={t.subjectPlaceholder} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">{t.messageLabel}</label>
                      <Textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder={t.messagePlaceholder} rows={5} required />
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? t.sending : t.sendMessage}
                      <FiSend className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
