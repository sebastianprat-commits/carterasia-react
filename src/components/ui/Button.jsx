// src/components/ui/Button.jsx
import React from 'react';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * variants: 'primary' | 'secondary' | 'ghost'
 * size: 'sm' | 'md' | 'lg'
 */
export default function Button({ as: Comp = 'button', className, variant = 'primary', size = 'md', ...props }) {
  const base =
    'inline-flex items-center justify-center rounded-lg font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500 disabled:opacity-60 disabled:cursor-not-allowed';
  const sizes = {
    sm: 'text-sm px-3 py-2',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-3',
  };
  const variants = {
    primary:
      'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-soft dark:shadow-none',
    secondary:
      'bg-white text-brand-700 border border-brand-200 hover:bg-brand-50 active:bg-brand-100 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700',
    ghost:
      'bg-transparent text-brand-600 hover:bg-brand-50 active:bg-brand-100 dark:text-brand-300 dark:hover:bg-white/5',
  };

  return (
    <Comp
      className={cx(base, sizes[size], variants[variant], className)}
      {...props}
    />
  );
}