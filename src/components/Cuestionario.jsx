// src/components/Cuestionario.jsx
import React, { useState } from 'react'
import { db } from '../firebaseConfig'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

// -----------------------------
// Utilidades de puntuación
// -----------------------------
const toInt = (v, def = 0) => {
  const n = parseInt(v, 10)
  return Number.isNaN(n) ? def : n
}

// Mapeos respuestas -> puntos
const SCORE = {
  experiencia: { '0': 0, '1-3': 1, '3-5': 2, '5+': 3 },
  conocimiento: { basico: 0, intermedio: 1, avanzado: 2 },
  horizonte: { lt1: 0, y1_3: 1, y3_5: 2, y5_10: 3, gt10: 4 },
  objetivo: { preservar: 0, renta: 1, crecimiento: 2, agresivo: 3 },
  tolerancia: { p5: 0, p10: 1, p20: 2, p30: 3 },
  reaccion: { vender: 0, mantener: 1, aportar: 2 },
}

function computeScore(fd) {
  let score = 0

  // Edad (más joven => mayor tolerancia)
  const edad = toInt(fd.edad)
  if (edad <= 35) score += 2
  else if (edad <= 50) score += 1

  // Horizonte
  score += SCORE.horizonte[fd.horizonte] ?? 0

  // Experiencia y conocimiento
  score += SCORE.experiencia[fd.experiencia] ?? 0
  score += SCORE.conocimiento[fd.conocimiento] ?? 0

  // Objetivo, tolerancia a pérdidas y reacción ante caídas
  score += SCORE.objetivo[fd.objetivo] ?? 0
  score += SCORE.tolerancia[fd.tolerancia] ?? 0
  score += SCORE.reaccion[fd.reaccion] ?? 0

  // Capacidad de ahorro (porcentaje sobre ingresos)
  const ingresos = toInt(fd.ingresos)
  const ahorro = toInt(fd.ahorroMensual)
  if (ingresos > 0) {
    const ratio = ahorro / ingresos
    if (ratio >= 0.2) score += 1
    else if (ratio >= 0.1) score += 0.5
  }

  // Deuda (si tiene y es onerosa, resta un poco)
  if (fd.deuda === 'si') score -= 0.5

  return score
}

function scoreToPerfil(score) {
  // 0–6 conservador | 7–11 moderado | 12+ dinamico
  if (score <= 6) return 'conservador'
  if (score <= 11) return 'moderado'
  return 'dinamico'
}

function perfilToVol(perfil, score) {
  if (perfil === 'conservador') return '0-5%'
  if (perfil === 'moderado') return '5-10%'
  return score <= 15 ? '10-15%' : '15-20%'
}

// -----------------------------
// Componente
// -----------------------------
export default function Cuestionario() {
  const [step, setStep] = useState(1)
  const totalSteps = 6
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    // 1) Demografía
    nombre: '',
    email: '',
    pais: 'ES',
    edad: '',
    situacion: '',   // empleado, autonomo, funcionario, jubilado, desempleado, estudiante
    estadoCivil: '', // soltero, pareja, casado, hijos

    // 2) Capacidad financiera
    ingresos: '',       // numero aprox/mes
    ahorroMensual: '',  // numero aprox/mes
    patrimonio: '',     // tramos
    moneda: 'EUR',
    deuda: 'no',        // si/no

    // 3) Objetivos
    objetivo: '',       // preservar, renta, crecimiento, agresivo
    horizonte: '',      // lt1, y1_3, y3_5, y5_10, gt10
    liquidez: 'media',  // baja/media/alta
    rebalanceo: 'anual',// trimestral/anual/semestral

    // 4) Experiencia & conocimiento
    experiencia: '',    // 0, 1-3, 3-5, 5+
    conocimiento: '',   // basico, intermedio, avanzado
    asesor: 'no',       // ha usado asesor? si/no
    familiaridad: [],   // [etfs, fondos, acciones, bonos]

    // 5) Riesgo
    tolerancia: '',     // p5, p10, p20, p30
    reaccion: '',       // vender, mantener, aportar
    esg: 'indiferente', // si/no/indiferente
    geografia: 'global',// global/europa/usa/emergentes
    sectoresEvitar: [], // tech, energia, salud, etc.

    // 6) Comentarios
    comentarios: '',
  })

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      setFormData((prev) => {
        const set = new Set(prev[name])
        if (checked) set.add(value)
        else set.delete(value)
        return { ...prev, [name]: Array.from(set) }
      })
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const validateStep = (s) => {
    switch (s) {
      case 1:
        return formData.nombre && formData.email && formData.edad && formData.situacion && formData.estadoCivil
      case 2:
        return formData.ingresos && formData.ahorroMensual && formData.patrimonio && formData.moneda && formData.deuda
      case 3:
        return formData.objetivo && formData.horizonte && formData.liquidez && formData.rebalanceo
      case 4:
        return formData.experiencia && formData.conocimiento && formData.asesor
      case 5:
        return formData.tolerancia && formData.reaccion && formData.esg && formData.geografia
      case 6:
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

      // guarda y navega
      localStorage.setItem('perfilUsuario', perfil)
      navigate('/cartera', {
        state: { perfil, email: formData.email, nombre: formData.nombre, volObjetivo },
      })
    } catch (err) {
      console.error('Error al guardar el cuestionario:', err)
      alert('No se pudo guardar el cuestionario. Inténtalo de nuevo.')
    }
  }

  const progress = Math.round((step / totalSteps) * 100)

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-soft">
      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
        Simulador de Perfil Inversor
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        Cuanto más preciso seas, mejor ajustaremos tu cartera. Tiempo estimado: 4–6 minutos.
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1) Demografía */}
        {step === 1 && (
          <Step title="1) Datos básicos">
            <Field label="Nombre y apellidos" required>
              <input name="nombre" value={formData.nombre} onChange={onChange} required
                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800" />
            </Field>
            <Field label="Email" required>
              <input type="email" name="email" value={formData.email} onChange={onChange} required
                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800" />
            </Field>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="País de residencia" required>
                <select name="pais" value={formData.pais} onChange={onChange} required
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800">
                  <option value="ES">España</option>
                  <option value="PT">Portugal</option>
                  <option value="FR">Francia</option>
                  <option value="DE">Alemania</option>
                  <option value="Other">Otro</option>
                </select>
              </Field>
              <Field label="Edad" required>
                <input type="number" name="edad" min="18" max="100" value={formData.edad} onChange={onChange} required
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800" />
              </Field>
              <Field label="Situación laboral" required>
                <select name="situacion" value={formData.situacion} onChange={onChange} required
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800">
                  <option value="">Selecciona…</option>
                  <option value="empleado">Empleado/a</option>
                  <option value="autonomo">Autónomo/a</option>
                  <option value="funcionario">Funcionario/a</option>
                  <option value="jubilado">Jubilado/a</option>
                  <option value="desempleado">Desempleado/a</option>
                  <option value="estudiante">Estudiante</option>
                </select>
              </Field>
            </div>
            <Field label="Estado civil / hijos" required>
              <select name="estadoCivil" value={formData.estadoCivil} onChange={onChange} required
                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800">
                <option value="">Selecciona…</option>
                <option value="soltero">Soltero/a</option>
                <option value="pareja">Pareja</option>
                <option value="casado_sinhijos">Casado/a sin hijos</option>
                <option value="casado_conhijos">Casado/a con hijos</option>
              </select>
            </Field>
          </Step>
        )}

        {/* 2) Capacidad financiera */}
        {step === 2 && (
          <Step title="2) Capacidad financiera">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Ingresos netos mensuales (€)" required>
                <input type="number" name="ingresos" min="0" step="50"
                  value={formData.ingresos} onChange={onChange} required
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800" />
              </Field>
              <Field label="Ahorro/inversión mensual objetivo (€)" required>
                <input type="number" name="ahorroMensual" min="0" step="50"
                  value={formData.ahorroMensual} onChange={onChange} required
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800" />
              </Field>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Patrimonio líquido invertible" required>
                <select name="patrimonio" value={formData.patrimonio} onChange={onChange} required
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800">
                  <option value="">Selecciona…</option>
                  <option value="<5k">&lt; 5.000 €</option>
                  <option value="5k-25k">5.000 – 25.000 €</option>
                  <option value="25k-100k">25.000 – 100.000 €</option>
                  <option value="100k-300k">100.000 – 300.000 €</option>
                  <option value=">300k">&gt; 300.000 €</option>
                </select>
              </Field>
              <Field label="Moneda base preferente" required>
                <select name="moneda" value={formData.moneda} onChange={onChange} required
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800">
                  <option value="EUR">EUR (Euro)</option>
                  <option value="GLOBAL">Global (diversas monedas)</option>
                </select>
              </Field>
              <Field label="¿Tienes deudas relevantes?" required>
                <div className="flex gap-6 pt-2">
                  {['si','no'].map(v => (
                    <label key={v} className="flex items-center gap-2">
                      <input type="radio" name="deuda" value={v}
                        checked={formData.deuda === v} onChange={onChange} required />
                      <span className="capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          </Step>
        )}

        {/* 3) Objetivos */}
        {step === 3 && (
          <Step title="3) Objetivos y preferencias">
            <Field label="Objetivo principal" required>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  {v:'preservar', l:'Preservar capital'},
                  {v:'renta', l:'Generar rentas'},
                  {v:'crecimiento', l:'Crecimiento a largo plazo'},
                  {v:'agresivo', l:'Crecimiento agresivo'}
                ].map(o=>(
                  <label key={o.v} className="flex items-center gap-2 p-2 border rounded">
                    <input type="radio" name="objetivo" value={o.v}
                      checked={formData.objetivo === o.v} onChange={onChange} required />
                    <span>{o.l}</span>
                  </label>
                ))}
              </div>
            </Field>

            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Horizonte temporal" required>
                <select name="horizonte" value={formData.horizonte} onChange={onChange} required
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800">
                  <option value="">Selecciona…</option>
                  <option value="lt1">Menos de 1 año</option>
                  <option value="y1_3">1–3 años</option>
                  <option value="y3_5">3–5 años</option>
                  <option value="y5_10">5–10 años</option>
                  <option value="gt10">Más de 10 años</option>
                </select>
              </Field>
              <Field label="Necesidad de liquidez" required>
                <select name="liquidez" value={formData.liquidez} onChange={onChange} required
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800">
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </Field>
              <Field label="Frecuencia de rebalanceo" required>
                <select name="rebalanceo" value={formData.rebalanceo} onChange={onChange} required
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800">
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </Field>
            </div>
          </Step>
        )}

        {/* 4) Experiencia */}
        {step === 4 && (
          <Step title="4) Experiencia y conocimientos">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Experiencia (años)" required>
                <select name="experiencia" value={formData.experiencia} onChange={onChange} required
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800">
                  <option value="">Selecciona…</option>
                  <option value="0">0</option>
                  <option value="1-3">1-3</option>
                  <option value="3-5">3-5</option>
                  <option value="5+">5+</option>
                </select>
              </Field>
              <Field label="Conocimiento financiero" required>
                <select name="conocimiento" value={formData.conocimiento} onChange={onChange} required
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800">
                  <option value="">Selecciona…</option>
                  <option value="basico">Básico</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </Field>
              <Field label="¿Has usado asesor financiero?" required>
                <select name="asesor" value={formData.asesor} onChange={onChange} required
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800">
                  <option value="no">No</option>
                  <option value="si">Sí</option>
                </select>
              </Field>
            </div>

            <Field label="¿Con qué productos te sientes cómodo? (elige varios)">
              <div className="grid sm:grid-cols-4 gap-2">
                {['etfs','fondos','acciones','bonos'].map(v=>(
                  <label key={v} className="flex items-center gap-2 p-2 border rounded">
                    <input type="checkbox" name="familiaridad" value={v}
                      checked={formData.familiaridad.includes(v)} onChange={onChange} />
                    <span className="capitalize">{v}</span>
                  </label>
                ))}
              </div>
            </Field>
          </Step>
        )}

        {/* 5) Riesgo y preferencias */}
        {step === 5 && (
          <Step title="5) Perfil de riesgo y preferencias">
            <Field label="Caída máxima aceptable en 1 año" required>
              <div className="grid sm:grid-cols-4 gap-2">
                {[
                  {v:'p5', l:'5%'},
                  {v:'p10', l:'10%'},
                  {v:'p20', l:'20%'},
                  {v:'p30', l:'30% o más'},
                ].map(o=>(
                  <label key={o.v} className="flex items-center gap-2 p-2 border rounded">
                    <input type="radio" name="tolerancia" value={o.v}
                      checked={formData.tolerancia === o.v} onChange={onChange} required />
                    <span>{o.l}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Si tu cartera cae un 20%, ¿qué harías?" required>
              <div className="grid sm:grid-cols-3 gap-2">
                {[
                  {v:'vender', l:'Vender para no perder más'},
                  {v:'mantener', l:'Mantener sin cambios'},
                  {v:'aportar', l:'Aportar más aprovechando precios'},
                ].map(o=>(
                  <label key={o.v} className="flex items-center gap-2 p-2 border rounded">
                    <input type="radio" name="reaccion" value={o.v}
                      checked={formData.reaccion === o.v} onChange={onChange} required />
                    <span>{o.l}</span>
                  </label>
                ))}
              </div>
            </Field>

            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Preferencia ESG" required>
                <select name="esg" value={formData.esg} onChange={onChange} required
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800">
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                  <option value="indiferente">Indiferente</option>
                </select>
              </Field>
              <Field label="Preferencia geográfica" required>
                <select name="geografia" value={formData.geografia} onChange={onChange} required
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800">
                  <option value="global">Global</option>
                  <option value="europa">Europa</option>
                  <option value="usa">EE. UU.</option>
                  <option value="emergentes">Emergentes</option>
                </select>
              </Field>
              <Field label="Sectores a evitar (opcional)">
                <div className="grid sm:grid-cols-3 gap-2">
                  {['tecnologia','energia','salud','finanzas','consumo'].map(s=>(
                    <label key={s} className="flex items-center gap-2 p-2 border rounded">
                      <input type="checkbox" name="sectoresEvitar" value={s}
                        checked={formData.sectoresEvitar.includes(s)} onChange={onChange} />
                      <span className="capitalize">{s}</span>
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          </Step>
        )}

        {/* 6) Comentarios */}
        {step === 6 && (
          <Step title="6) Comentarios adicionales (opcional)">
            <Field label="Notas o preferencias">
              <textarea name="comentarios" value={formData.comentarios} onChange={onChange}
                rows={4} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800"
                placeholder="Por ejemplo: metas concretas, preferencia por dividendos, restricciones…"
              />
            </Field>
          </Step>
        )}

        {/* Controles */}
        <div className="mt-2 flex items-center justify-between">
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
              className="px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              className="px-5 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
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
// Subcomponentes
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