/**
 * Page Loader - Beautiful loading animation
 */
import React from 'react';
import { motion } from 'framer-motion';

export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Outer ring */}
        <motion.div
          className="w-20 h-20 rounded-full border-4 border-muted"
          style={{ borderTopColor: 'hsl(var(--primary))' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        {/* Inner dot */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary" />
        </motion.div>
      </motion.div>
      <motion.p
        className="mt-6 text-muted-foreground font-medium"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {message}
      </motion.p>
      {/* Decorative dots */}
      <div className="flex gap-1.5 mt-3">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary/40"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
};

export const InlineLoader: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => {
  const s = size === 'sm' ? 'w-8 h-8' : 'w-12 h-12';
  return (
    <div className="flex items-center justify-center py-12">
      <motion.div
        className={`${s} rounded-full border-3 border-muted`}
        style={{ borderTopColor: 'hsl(var(--primary))' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
};
