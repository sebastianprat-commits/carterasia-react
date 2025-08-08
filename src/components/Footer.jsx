
import { Link } from 'react-router-dom';
import { SITE_NAME } from '../constants/brand';

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {SITE_NAME}. Todos los derechos reservados.</p>
          <nav className="flex items-center gap-4">
            <Link to="/aviso-legal" className="hover:text-gray-900 dark:hover:text-gray-200 underline-offset-4 hover:underline">
              Aviso legal
            </Link>
            <Link to="/politica-privacidad" className="hover:text-gray-900 dark:hover:text-gray-200 underline-offset-4 hover:underline">
              Privacidad
            </Link>
            <a
              href="mailto:hola@carterasai.com"
              className="hover:text-gray-900 dark:hover:text-gray-200 underline-offset-4 hover:underline"
            >
              Contacto
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}