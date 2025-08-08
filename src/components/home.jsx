import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col justify-between">
      {/* HERO */}
      <section className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center gap-8">
          <img
            src="https://i.postimg.cc/JzHD5B7r/Logo-Carteras-AI.png"
            alt="CarterasIA Logo"
            className="w-40 h-auto"
          />
          <div>
            <h1 className="text-4xl font-bold text-gray-800">
              Tu cartera de inversión personalizada en minutos
            </h1>
            <p className="mt-4 text-gray-600 text-lg">
              Descubre tu perfil inversor y recibe una cartera optimizada,
              adaptada a tus objetivos y nivel de riesgo.
            </p>
            <Link
              to="/simulador"
              className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition"
            >
              Comienza ahora
            </Link>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-800">
            ¿Por qué elegir CarterasIA?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="font-semibold text-lg mb-2">Rápido</h3>
              <p className="text-gray-600">
                En menos de 5 minutos, tendrás tu cartera personalizada.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="font-semibold text-lg mb-2">Personalizado</h3>
              <p className="text-gray-600">
                Adaptado a tu edad, experiencia, objetivos y tolerancia al
                riesgo.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="font-semibold text-lg mb-2">Seguro</h3>
              <p className="text-gray-600">
                Tus datos están protegidos y no compartimos tu información.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PREVIEW CARTERA */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Ejemplo de cartera sugerida
          </h2>
          <div className="inline-block bg-gray-50 p-6 rounded-lg shadow text-left">
            <ul className="list-disc list-inside text-gray-700">
              <li>iShares MSCI World (IWRD)</li>
              <li>Vanguard Global Moderate Allocation (VMAA)</li>
              <li>Xtrackers ESG EUR Corp Bond (XDCB)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-6 text-center">
        <p>&copy; {new Date().getFullYear()} CarterasIA. Todos los derechos reservados.</p>
        <div className="mt-2">
          <Link to="/aviso-legal" className="text-gray-400 hover:text-white mx-2">
            Aviso Legal
          </Link>
          <Link to="/politica-privacidad" className="text-gray-400 hover:text-white mx-2">
            Política de Privacidad
          </Link>
          <Link to="/contacto" className="text-gray-400 hover:text-white mx-2">
            Contacto
          </Link>
        </div>
      </footer>
    </div>
  );
}
