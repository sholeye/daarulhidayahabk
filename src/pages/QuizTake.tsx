/**
 * QuizTake page - composition only (no business logic)
 */

import React from 'react';
import { Navbar } from '@/features/common/Navbar';
import { Footer } from '@/features/common/Footer';
import { QuizTake } from '@/features/quiz/QuizTake';

const QuizTakePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <QuizTake />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default QuizTakePage;
