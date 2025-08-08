// src/components/DarkModeToggle.jsx
import useDarkMode from '../hooks/useDarkMode';

export default function DarkModeToggle() {
  const { enabled, setEnabled } = useDarkMode();

  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                 bg-white/10 hover:bg-white/20 text-white transition
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      aria-pressed={enabled}
      title="Cambiar tema"
    >
      <span className="hidden sm:inline">{enabled ? 'Modo oscuro' : 'Modo claro'}</span>
      <span aria-hidden>{enabled ? '🌙' : '☀️'}</span>
    </button>
  );
}