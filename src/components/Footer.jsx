
import { Link } from 'react-router-dom'
import { SITE_NAME } from '../constants/brand'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div>
            <p className="text-lg font-semibold">{SITE_NAME}</p>
            <p className="text-gray-400 mt-1">Herramientas de inversión personalizadas.</p>
          </div>
          <nav className="flex gap-4">
            <Link to="/aviso-legal" className="text-gray-400 hover:text-white">Aviso Legal</Link>
            <Link to="/politica-privacidad" className="text-gray-400 hover:text-white">Privacidad</Link>
            <Link to="/contacto" className="text-gray-400 hover:text-white">Contacto</Link>
          </nav>
        </div>
        <p className="text-center text-gray-500 mt-6">
          © {new Date().getFullYear()} {SITE_NAME}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}