import React from 'react'
import { Link } from 'react-router-dom'
import { SITE_NAME, LOGO_PATH } from '../constants/brand'

export default function Home() {
  return (
    <div className="text-gray-900">
      {/* HERO */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-14 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              Carteras personalizadas con IA
            </h1>
            <p className="mt-4 text-blue-100 text-lg">
              {SITE_NAME} analiza tu perfil inversor y te propone una cartera diversificada con fondos y ETFs acorde a tu objetivo y tolerancia al riesgo.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                to="/simulador"
                className="inline-block bg-white text-blue-700 font-semibold px-5 py-3 rounded-lg hover:bg-blue-50"
              >
                Probar simulador
              </Link>
              <Link
                to="/formacion"
                className="inline-block bg-blue-500/30 border border-white/30 text-white px-5 py-3 rounded-lg hover:bg-blue-500/40"
              >
                Formación
              </Link>
            </div>
            <p className="mt-3 text-sm text-blue-200">
              Gratis. Sin tarjeta. Resultados al instante.
            </p>
          </div>
          <div className="justify-self-center">
            <img src={LOGO_PATH} alt={`${SITE_NAME} Logo`} className="h-28 w-auto drop-shadow-lg" />
          </div>
        </div>
      </section>

      {/* ¿POR QUÉ ELEGIR? */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-800">
            ¿Por qué elegir {SITE_NAME}?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card
              title="Diversificación inteligente"
              text="Carteras con ETFs y fondos globales para reducir riesgos específicos y suavizar la volatilidad."
            />
            <Card
              title="Ajuste a tu perfil"
              text="Te preguntamos lo justo para afinar tu perfil (conservador, moderado o dinámico) y el horizonte temporal."
            />
            <Card
              title="Transparencia y control"
              text="Te mostramos la composición sugerida, los objetivos de riesgo y un PDF descargable con tu propuesta."
            />
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-800">¿Cómo funciona?</h2>
          <ol className="grid md:grid-cols-3 gap-6 list-decimal list-inside">
            <Step n="1" title="Completa el simulador" text="Edad, experiencia, objetivos y tolerancia al riesgo." />
            <Step n="2" title="Recibe tu cartera" text="Asignaciones sugeridas con ETFs/fondos y explicación." />
            <Step n="3" title="Descarga o recibe por email" text="Obtén un informe PDF y, si quieres, agenda asesoría." />
          </ol>
          <div className="text-center mt-8">
            <Link
              to="/simulador"
              className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Empezar ahora
            </Link>
          </div>
        </div>
      </section>
// dentro del componente Home, añade tras la sección "¿Cómo funciona?"
<section className="py-12 bg-gray-50 dark:bg-gray-900">
  <div className="max-w-6xl mx-auto px-6">
    <h2 className="text-2xl font-bold text-center mb-10 text-gray-800 dark:text-gray-100">
      Lo que dicen nuestros usuarios
    </h2>
    <div className="grid md:grid-cols-3 gap-6">
      <Testimonial
        name="Ana M."
        role="Ahorro a largo plazo"
        text="Me ayudó a entender mi perfil y a invertir con más tranquilidad. El PDF es súper claro."
      />
      <Testimonial
        name="Javier R."
        role="Inversor moderado"
        text="La cartera propuesta encaja con mis objetivos. Muy fácil y rápido."
      />
      <Testimonial
        name="Lucía G."
        role="Primeras inversiones"
        text="Buena guía inicial y educación básica. Ideal para empezar."
      />
    </div>
  </div>
</section>

// añade el componente Testimonial al final del mismo archivo:
function Testimonial({ name, role, text }) {
  return (
    <figure className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
      <blockquote className="text-gray-700 dark:text-gray-200">“{text}”</blockquote>
      <figcaption className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <span className="font-semibold text-gray-800 dark:text-gray-100">{name}</span> — {role}
      </figcaption>
    </figure>
  );
}

      {/* NOTA LEGAL CORTA */}
      <section className="py-8 bg-amber-50 border-y border-amber-200">
        <div className="max-w-6xl mx-auto px-6 text-amber-900 text-sm">
          <p>
            {SITE_NAME} es una herramienta educativa. No constituye recomendación de inversión personalizada ni tiene en cuenta circunstancias específicas fuera del cuestionario.
            Antes de invertir, considera consultar a un asesor financiero registrado.
          </p>
        </div>
      </section>

      {/* FAQ RÁPIDO */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-800">Preguntas frecuentes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Faq q="¿Tiene coste?" a="El simulador y el informe PDF son gratuitos. En el futuro podremos añadir planes premium opcionales." />
            <Faq q="¿De dónde salen los datos?" a="Utilizamos fuentes públicas y APIs de mercado para formar y mantener el universo de activos." />
            <Faq q="¿Puedo cambiar mis respuestas?" a="Sí, puedes repetir el cuestionario y generar un nuevo informe cuantas veces quieras." />
            <Faq q="¿Guardáis mis datos?" a="Guardamos tu cuestionario en Firestore y cumplimos con GDPR. Puedes solicitar la eliminación desde Contacto." />
          </div>
        </div>
      </section>
    </div>
  )
}

function Card({ title, text }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-600">{text}</p>
    </div>
  )
}

function Step({ n, title, text }) {
  return (
    <li className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold">{n}</span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-gray-600">{text}</p>
    </li>
  )
}

function Faq({ q, a }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="font-semibold mb-2">{q}</h3>
      <p className="text-gray-600">{a}</p>
    </div>
  )
}
