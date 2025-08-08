
import useDarkMode from '../hooks/useDarkMode';

export default function DarkModeToggle() {
  const { enabled, setEnabled } = useDarkMode();

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