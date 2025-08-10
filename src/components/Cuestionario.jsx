
// src/components/Cuestionario.jsx
import React, { useState } from 'react'
import { db } from '../firebaseConfig'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

// -----------------------------
// Utilidades de puntuación
// -----------------------------
function toInt(v, def = 0) {
  const n = parseInt(v, 10)
  return Number.isNaN(n) ? def : n
}

// Mapeos de respuestas -> puntos
const SCORE = {
  experiencia: { ninguna: 0, baja: 1, media: 2, alta: 3 },
  conocimiento: { basico: 0, intermedio: 1, avanzado: 2 },
  horizonte: { lt1: 0, y1_3: 1, y3_5: 2, y5_10: 3, gt10: 4 },
  objetivo: { conservar: 0, batir_inflacion: 1, crecimiento: 2, agresivo: 3 },
  tolerancia: { p5: 0, p10: 1, p20: 2, p30: 3 },
  reaccion: { vender: 0, mantener: 1, aportar: 2 },
}

function computeScore(fd) {
  let score = 0

  // Edad (más joven => mayor tolerancia)
  const edad = toInt(fd.edad)
  if (edad <= 35) score += 2
  else if (edad <= 50) score += 1
  // >50 suma 0

  // Horizonte
  score += SCORE.horizonte[fd.horizonte] ?? 0

  // Experiencia y conocimiento
  score += SCORE.experiencia[fd.experiencia] ?? 0
  score += SCORE.conocimiento[fd.conocimiento] ?? 0

  // Objetivo, tolerancia a pérdidas y reacción ante caídas
  score += SCORE.objetivo[fd.objetivo] ?? 0
  score += SCORE.tolerancia[fd.tolerancia] ?? 0
  score += SCORE.reaccion[fd.reaccion] ?? 0

  // Pequeño ajuste por capacidad de ahorro (relación ahorro/ingresos)
  const ingresos = toInt(fd.ingresos)
  const ahorro = toInt(fd.ahorroMensual)
  if (ingresos > 0) {
    const ratio = ahorro / ingresos
    if (ratio >= 0.2) score += 1
    else if (ratio >= 0.1) score += 0.5
  }

  return score
}

function scoreToPerfil(score) {
  // 0–6 conservador | 7–11 moderado | 12+ dinámico
  if (score <= 6) return 'conservador'
  if (score <= 11) return 'moderado'
  return 'dinámico'
}

function perfilToVol(perfil, score) {
  if (perfil === 'conservador') return '0–5%'
  if (perfil === 'moderado') return '5–10%'
  // dinámico: dividimos en dos bandas según intensidad
  return score <= 15 ? '10–15%' : '≈20%'
}

// -----------------------------
// Componente principal
// -----------------------------
export default function Cuestionario() {
  const [step, setStep] = useState(1)
  const totalSteps = 5
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    // Paso 1: Identificación
    nombre: '',
    email: '',
    edad: '',
    situacion: '', // empleado, autonomo, funcionario, jubilado, desempleado, estudiante

    // Paso 2: Capacidad financiera
    ingresos: '',       // número (neto mensual aprox)
    ahorroMensual: '',  // número
    patrimonio: '',     // select por tramos
    moneda: 'EUR',      // EUR / Global

    // Paso 3: Objetivos
    horizonte: '',           // lt1, y1_3, y3_5, y5_10, gt10
    objetivo: '',            // conservar, batir_inflacion, crecimiento, agresivo
    preferenciaESG: 'no',    // si / no / indiferente
    fondosTraspasables: 'si',// si / no / indiferente (interés fiscal España)

    // Paso 4: Experiencia y tolerancia al riesgo
    experiencia: '',         // ninguna, baja, media, alta
    conocimiento: '',        // basico, intermedio, avanzado
    tolerancia: '',          // p5, p10, p20, p30
    reaccion: '',            // vender, mantener, aportar

    // Paso 5: Comentarios
    comentarios: '',
  })

  const onChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Validación mínima por paso
  const validateStep = (s) => {
    switch (s) {
      case 1:
        return formData.nombre && formData.email && formData.edad && formData.situacion
      case 2:
        return formData.ingresos && formData.ahorroMensual && formData.patrimonio && formData.moneda
      case 3:
        return formData.horizonte && formData.objetivo && formData.preferenciaESG && formData.fondosTraspasables
      case 4:
        return formData.experiencia && formData.conocimiento && formData.tolerancia && formData.reaccion
      case 5:
        return true
      default:
        return false
    }
  }

  const next = () => {
    if (!validateStep(step)) {
      alert('Por favor, completa todos los campos requeridos en este paso.')
      return
    }
    setStep((s) => Math.min(totalSteps, s + 1))
  }

  const prev = () => setStep((s) => Math.max(1, s - 1))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep(step)) {
      alert('Revisa los campos del paso actual.')
      return
    }

    const score = computeScore(formData)
    const perfil = scoreToPerfil(score)
    const volObjetivo = perfilToVol(perfil, score)

    try {
      await addDoc(collection(db, 'cuestionarios'), {
        ...formData,
        perfil,
        volObjetivo,
        score,
        timestamp: Timestamp.now(),
      })

      // Guarda para otros componentes y navega
      localStorage.setItem('perfilUsuario', perfil)
      navigate('/cartera', {
        state: { perfil, email: formData.email, nombre: formData.nombre, volObjetivo },
      })
    } catch (err) {
      console.error('Error al guardar el cuestionario:', err)
      alert('No se pudo guardar el cuestionario. Inténtalo de nuevo.')
    }
  }

  // Barra de progreso
  const progress = Math.round((step / totalSteps) * 100)

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-soft">
      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
        Simulador de Perfil Inversor
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        Completa los siguientes pasos. Te llevará unos minutos, pero el resultado será más preciso.
      </p>

      {/* Progreso */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
        <div
          className="bg-brand-600 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        />
      </div>

      <form onSubmit={handleSubmit}>
        {/* PASO 1: Identificación */}
        {step === 1 && (
          <Step title="1) Tus datos básicos">
            <Field label="Nombre y apellidos" required>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800"
                required
              />
            </Field>

            <Field label="Email" required>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800"
                required
              />
            </Field>

            <Field label="Edad" required>
              <input
                type="number"
                name="edad"
                min="18"
                max="100"
                value={formData.edad}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800"
                required
              />
            </Field>

            <Field label="Situación laboral" required>
              <select
                name="situacion"
                value={formData.situacion}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800"
                required
              >
                <option value="">Selecciona…</option>
                <option value="empleado">Empleado/a</option>
                <option value="autonomo">Autónomo/a</option>
                <option value="funcionario">Funcionario/a</option>
                <option value="jubilado">Jubilado/a</option>
                <option value="desempleado">Desempleado/a</option>
                <option value="estudiante">Estudiante</option>
              </select>
            </Field>
          </Step>
        )}

        {/* PASO 2: Capacidad financiera */}
        {step === 2 && (
          <Step title="2) Capacidad financiera">
            <Field label="Ingresos netos mensuales aprox. (€)" required>
              <input
                type="number"
                name="ingresos"
                min="0"
                step="100"
                value={formData.ingresos}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800"
                required
              />
            </Field>

            <Field label="Ahorro/inversión mensual objetivo (€)" required>
              <input
                type="number"
                name="ahorroMensual"
                min="0"
                step="50"
                value={formData.ahorroMensual}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800"
                required
              />
            </Field>

            <Field label="Patrimonio líquido invertible" required>
              <select
                name="patrimonio"
                value={formData.patrimonio}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800"
                required
              >
                <option value="">Selecciona…</option>
                <option value="<5k">&lt; 5.000 €</option>
                <option value="5k-25k">5.000 – 25.000 €</option>
                <option value="25k-100k">25.000 – 100.000 €</option>
                <option value="100k-300k">100.000 – 300.000 €</option>
                <option value=">300k">&gt; 300.000 €</option>
              </select>
            </Field>

            <Field label="Moneda base preferente" required>
              <select
                name="moneda"
                value={formData.moneda}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800"
                required
              >
                <option value="EUR">EUR (Euro)</option>
                <option value="GLOBAL">Global (diversas monedas)</option>
              </select>
            </Field>
          </Step>
        )}

        {/* PASO 3: Objetivos */}
        {step === 3 && (
          <Step title="3) Objetivos y horizonte">
            <Field label="Horizonte temporal de la inversión" required>
              <select
                name="horizonte"
                value={formData.horizonte}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800"
                required
              >
                <option value="">Selecciona…</option>
                <option value="lt1">Menos de 1 año</option>
                <option value="y1_3">1–3 años</option>
                <option value="y3_5">3–5 años</option>
                <option value="y5_10">5–10 años</option>
                <option value="gt10">Más de 10 años</option>
              </select>
            </Field>

            <Field label="Objetivo principal" required>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  { v: 'conservar', l: 'Conservar capital' },
                  { v: 'batir_inflacion', l: 'Batir inflación' },
                  { v: 'crecimiento', l: 'Crecimiento' },
                  { v: 'agresivo', l: 'Crecimiento agresivo' },
                ].map((o) => (
                  <label key={o.v} className="flex items-center gap-2 p-2 border rounded">
                    <input
                      type="radio"
                      name="objetivo"
                      value={o.v}
                      checked={formData.objetivo === o.v}
                      onChange={onChange}
                      required
                    />
                    <span>{o.l}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="¿Preferencia por criterios ESG/Sostenibilidad?" required>
              <div className="flex gap-4">
                {['si', 'no', 'indiferente'].map((v) => (
                  <label key={v} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="preferenciaESG"
                      value={v}
                      checked={formData.preferenciaESG === v}
                      onChange={onChange}
                      required
                    />
                    <span className="capitalize">{v}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="¿Prefieres fondos traspasables (ventaja fiscal en España)?" required>
              <div className="flex gap-4">
                {['si', 'no', 'indiferente'].map((v) => (
                  <label key={v} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="fondosTraspasables"
                      value={v}
                      checked={formData.fondosTraspasables === v}
                      onChange={onChange}
                      required
                    />
                    <span className="capitalize">{v}</span>
                  </label>
                ))}
              </div>
            </Field>
          </Step>
        )}

        {/* PASO 4: Experiencia y tolerancia */}
        {step === 4 && (
          <Step title="4) Experiencia y tolerancia al riesgo">
            <Field label="Experiencia inversora" required>
              <div className="grid sm:grid-cols-4 gap-2">
                {[
                  { v: 'ninguna', l: 'Ninguna' },
                  { v: 'baja', l: 'Baja' },
                  { v: 'media', l: 'Media' },
                  { v: 'alta', l: 'Alta' },
                ].map((o) => (
                  <label key={o.v} className="flex items-center gap-2 p-2 border rounded">
                    <input
                      type="radio"
                      name="experiencia"
                      value={o.v}
                      checked={formData.experiencia === o.v}
                      onChange={onChange}
                      required
                    />
                    <span>{o.l}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Conocimiento financiero" required>
              <div className="grid sm:grid-cols-3 gap-2">
                {[
                  { v: 'basico', l: 'Básico' },
                  { v: 'intermedio', l: 'Intermedio' },
                  { v: 'avanzado', l: 'Avanzado' },
                ].map((o) => (
                  <label key={o.v} className="flex items-center gap-2 p-2 border rounded">
                    <input
                      type="radio"
                      name="conocimiento"
                      value={o.v}
                      checked={formData.conocimiento === o.v}
                      onChange={onChange}
                      required
                    />
                    <span>{o.l}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="¿Qué caída máxima aceptarías en un año sin vender?" required>
              <div className="grid sm:grid-cols-4 gap-2">
                {[
                  { v: 'p5', l: '≈5%' },
                  { v: 'p10', l: '≈10%' },
                  { v: 'p20', l: '≈20%' },
                  { v: 'p30', l: '≈30% o más' },
                ].map((o) => (
                  <label key={o.v} className="flex items-center gap-2 p-2 border rounded">
                    <input
                      type="radio"
                      name="tolerancia"
                      value={o.v}
                      checked={formData.tolerancia === o.v}
                      onChange={onChange}
                      required
                    />
                    <span>{o.l}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Ante una caída del 20% en tu cartera, ¿qué harías?" required>
              <div className="grid sm:grid-cols-3 gap-2">
                {[
                  { v: 'vender', l: 'Vender para no perder más' },
                  { v: 'mantener', l: 'Mantener sin cambios' },
                  { v: 'aportar', l: 'Aportar más aprovechando precios' },
                ].map((o) => (
                  <label key={o.v} className="flex items-center gap-2 p-2 border rounded">
                    <input
                      type="radio"
                      name="reaccion"
                      value={o.v}
                      checked={formData.reaccion === o.v}
                      onChange={onChange}
                      required
                    />
                    <span>{o.l}</span>
                  </label>
                ))}
              </div>
            </Field>
          </Step>
        )}

        {/* PASO 5: Comentarios */}
        {step === 5 && (
          <Step title="5) Comentarios (opcional)">
            <Field label="¿Algo que quieras añadir?">
              <textarea
                name="comentarios"
                value={formData.comentarios}
                onChange={onChange}
                rows={4}
                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800"
                placeholder="Por ejemplo: metas concretas, preferencia por dividendos, restricciones…"
              />
            </Field>
          </Step>
        )}

        {/* Controles */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={prev}
            disabled={step === 1}
            className="px-4 py-2 rounded border text-gray-700 dark:text-gray-200 disabled:opacity-50"
          >
            Anterior
          </button>

          {step < totalSteps ? (
            <button
              type="button"
              onClick={next}
              className="px-5 py-2 rounded bg-brand-600 text-white hover:bg-brand-700"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              className="px-5 py-2 rounded bg-brand-600 text-white hover:bg-brand-700"
            >
              Generar mi cartera
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

// -----------------------------
// Subcomponentes de UI
// -----------------------------
function Step({ title, children }) {
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
      {children}
    </section>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      {children}
    </label>
  )
}