import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 opacity-95" />
        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24 text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Optimiza tu inversión con inteligencia artificial
          </h1>
          <p className="mt-4 text-white/90 text-lg max-w-2xl">
            CarterasAI analiza tu perfil inversor y te recomienda una cartera personalizada con fondos, ETFs y acciones diversificadas. 
            Empieza a invertir de forma más inteligente y eficiente.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/simulador" className="bg-white text-blue-700 font-semibold px-5 py-3 rounded-lg shadow hover:bg-blue-50">
              Probar el simulador
            </Link>
            <Link to="/formacion" className="bg-white/10 backdrop-blur border border-white/20 text-white px-5 py-3 rounded-lg hover:bg-white/15">
              Ver formación
            </Link>
          </div>
        </div>
        {/* onda decorativa */}
        <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path fill="#fff" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,58.7C672,64,768,96,864,101.3C960,107,1056,85,1152,80C1248,75,1344,85,1392,90.7L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"/>
        </svg>
      </section>

      {/* BENEFICIOS */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-800">
            ¿Por qué elegir CarterasAI?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { t:'Rápido', d:'En menos de 5 minutos obtienes tu cartera.' },
              { t:'Personalizado', d:'A tu edad, experiencia, objetivos y riesgo.' },
              { t:'Transparente', d:'Recomendaciones claras y diversificadas.' },
            ].map((b, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
                <h3 className="font-semibold text-lg mb-2">{b.t}</h3>
                <p className="text-gray-600">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}