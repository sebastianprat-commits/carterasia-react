// src/components/StickyCTA.jsx
import { Link } from 'react-router-dom';

export default function StickyCTA() {
  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-40">
      <div className="mx-4 mb-4 rounded-full shadow-lg overflow-hidden">
        <Link
          to="/simulador"
          className="block text-center py-3 font-semibold
                     bg-blue-600 text-white hover:bg-blue-700
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        >
          Probar simulador ahora
        </Link>
      </div>
    </div>
  );
}