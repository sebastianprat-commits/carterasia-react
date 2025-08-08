import React from 'react'
import { Link } from 'react-router-dom'
import { SITE_NAME } from '../constants/brand'

export default function Formacion() {
  return (
    <div className="text-gray-900 dark:text-gray-100">
      {/* HERO */}
      <section className="bg-gradient-to-b from-brand-600 to-brand-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
            Formación financiera: bases para invertir con criterio
          </h1>
          <p className="mt-4 text-blue-100 text-lg max-w-3xl">
            En {SITE_NAME} creemos que entender los principios básicos —diversificación, horizonte temporal y tolerancia al riesgo— 
            es tan importante como elegir los activos. Aquí tienes una guía clara para empezar con buen pie.
          </p>
        </div>
      </section>

      {/* DIVERSIFICACIÓN */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">La importancia de la diversificación</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Diversificar es repartir la inversión entre distintos tipos de activos, sectores y regiones. 
              No elimina el riesgo, pero reduce las oscilaciones y ayuda a mejorar la estabilidad de los resultados.
            </p>
            <ul className="mt-4 space-y-2 text-gray-700 dark:text-gray-300 list-disc ml-5">
              <li>Menor exposición a riesgos específicos (empresa/sector/país).</li>
              <li>Volatilidad global más baja que la de un único activo concentrado.</li>
              <li>Recuperaciones más rápidas tras caídas profundas del mercado.</li>
            </ul>

            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <Comparativa
                title="Cartera no diversificada"
                items={[
                  'Picos altos y caídas bruscas',
                  'Mayor estrés psicológico',
                  'Riesgo concentrado'
                ]}
                tone="danger"
              />
              <Comparativa
                title="Cartera diversificada"
                items={[
                  'Volatilidad más suave',
                  'Riesgo repartido',
                  'Resultados más consistentes'
                ]}
                tone="safe"
              />
            </div>

            <div className="mt-6">
              <Link
                to="/simulador"
                className="inline-block bg-brand-600 text-white font-semibold px-5 py-3 rounded-lg hover:bg-brand-700"
              >
                Probar simulador
              </Link>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden shadow-soft bg-white dark:bg-gray-800">
            {/* Reemplaza la ruta si usas otra imagen */}
            <img
              src="/img/diversificacion.png"
              alt="Impacto de la diversificación en la evolución del capital"
              className="w-full h-auto"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 px-4 py-3">
              Ilustración educativa: la cartera diversificada muestra una trayectoria más estable que una cartera concentrada.
            </p>
          </div>
        </div>
      </section>

      {/* LARGO PLAZO */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">El poder del largo plazo</h2>
          <p className="text-gray-700 dark:text-gray-300">
            A 10–30 años, el interés compuesto y la disciplina pesan más que acertar el “timing”. 
            Aportaciones periódicas (DCA) reducen el riesgo de entrar justo antes de una caída y ayudan a mantener la estrategia.
          </p>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <MiniCard title="Interés compuesto" text="Reinvertir beneficios acelera el crecimiento con el paso del tiempo." />
            <MiniCard title="DCA (aportaciones periódicas)" text="Suaviza el precio de entrada y reduce el impacto de la volatilidad." />
            <MiniCard title="Disciplina" text="Seguir el plan importa más que predecir el mercado." />
          </div>
        </div>
      </section>

      {/* MÉTODOS DE INVERSIÓN */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Métodos habituales</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Method
              title="Buy & Hold"
              pros={['Sencillo y fiscalmente eficiente', 'Beneficia el interés compuesto']}
              cons={['Requiere tolerar caídas']}
            />
            <Method
              title="Dollar-Cost Averaging (DCA)"
              pros={['Menos riesgo de entrar en mal momento', 'Ayuda a la disciplina']}
              cons={['No maximiza si el mercado solo sube']}
            />
            <Method
              title="Value/Growth/Blend"
              pros={['Diversas filosofías para distintos ciclos']}
              cons={['Puede sobre/infra-rendir periodos largos']}
            />
            <Method
              title="Mixto con bonos"
              pros={['Volatilidad más baja', 'Mejor control del riesgo']}
              cons={['Menor rentabilidad esperada que 100% RV']}
            />
          </div>
        </div>
      </section>

      {/* PERFIL DE RIESGO (teaser de tu cuestionario) */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Tu perfil de riesgo</h2>
          <p className="text-gray-700 dark:text-gray-300">
            La combinación de edad, horizonte, experiencia, tolerancia a pérdidas y preferencias personales 
            orienta la asignación entre renta variable, renta fija y liquidez. Nuestro cuestionario estima ese perfil 
            y propone una cartera diversificada acorde a tu objetivo de volatilidad.
          </p>
          <div className="mt-6">
            <Link
              to="/simulador"
              className="inline-block bg-brand-600 text-white font-semibold px-5 py-3 rounded-lg hover:bg-brand-700"
            >
              Estimar mi perfil
            </Link>
          </div>
        </div>
      </section>

      {/* NOTA LEGAL */}
      <section className="py-8 bg-amber-50 dark:bg-amber-900/30 border-y border-amber-200 dark:border-amber-800">
        <div className="max-w-6xl mx-auto px-6 text-amber-900 dark:text-amber-200 text-sm">
          <p>
            {SITE_NAME} es una herramienta educativa. No constituye recomendación de inversión personalizada ni tiene en cuenta circunstancias específicas fuera del cuestionario.
            Antes de invertir, considera consultar a un asesor financiero registrado.
          </p>
        </div>
      </section>
    </div>
  )
}

function Comparativa({ title, items, tone = 'safe' }) {
  const toneClasses = tone === 'danger'
    ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
    : 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
  return (
    <div className={`rounded-xl border p-5 ${toneClasses}`}>
      <h3 className="font-semibold mb-2">{title}</h3>
      <ul className="list-disc ml-5 text-sm space-y-1">
        {items.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </div>
  )
}

function MiniCard({ title, text }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{text}</p>
    </div>
  )
}

function Method({ title, pros = [], cons = [] }) {