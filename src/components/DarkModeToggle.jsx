
// src/components/DarkModeToggle.jsx
import { useEffect, useState } from 'react';

function useDarkModeInline() {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [enabled]);

  return { enabled, setEnabled };
}

export default function DarkModeToggle() {
  const { enabled, setEnabled } = useDarkModeInline();
  const toggle = () => setEnabled(v => !v);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={enabled ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={enabled ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <span className="text-sm font-medium">
        {enabled ? 'Modo oscuro' : 'Modo claro'}
      </span>
      <span aria-hidden="true">{enabled ? '🌙' : '☀️'}</span>
    </button>
  );
}