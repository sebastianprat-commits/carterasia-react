
import React, { useState, useRef } from 'react'
import { db } from '../firebaseConfig'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

const calcularPerfil = (respuestas) => {
  let score = 0

  const edad = parseInt(respuestas.edad)
  if (edad < 40) score += 2
  else if (edad < 60) score += 1

  const map = { nada: 0, poca: 1, mucha: 2 }
  score += map[respuestas.experiencia?.toLowerCase()] || 0
  score += map[respuestas.formacion?.toLowerCase()] || 0

  const horizonte = respuestas.horizonte?.toLowerCase() || ''
  if (horizonte.includes('corto')) score += 0
  else if (horizonte.includes('medio')) score += 1
  else if (horizonte.includes('largo')) score += 2

  const objetivo = respuestas.objetivo?.toLowerCase() || ''
  if (objetivo.includes('conservar')) score += 0
  else if (objetivo.includes('poco')) score += 1
  else if (objetivo.includes('mucho')) score += 2

  const riesgo = respuestas.riesgo?.toLowerCase() || ''
  if (riesgo.includes('ninguno')) score += 0
  else if (riesgo.includes('poco')) score += 1
  else if (riesgo.includes('mucho')) score += 2

  if (score <= 4) return 'conservador'
  if (score <= 8) return 'moderado'
  return 'dinámico'
}

function Cuestionario() {
  const [formData, setFormData] = useState({
    nombre: '',
    edad: '',
    experiencia: '',
    formacion: '',
    horizonte: '',
    objetivo: '',
    riesgo: '',
    email: '',
  })

  const navigate = useNavigate()
  const formRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const perfil = calcularPerfil(formData)

    try {
      await addDoc(collection(db, 'cuestionarios'), {
        ...formData,
        perfil,
        timestamp: Timestamp.now(),
      })

      navigate('/cartera', {
        state: { perfil, email: formData.email, nombre: formData.nombre },
      })
    } catch (error) {
      console.error('Error al guardar:', error)
      alert('Hubo un error al guardar tus datos.')
    }
  }

  const labelCls = 'block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200'
  const inputCls =
    'mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 ' +
    'px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none ' +
    'focus:ring-2 focus:ring-blue-500'

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-900 shadow rounded-xl"
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        Simulador de Perfil Inversor
      </h2>

      {['nombre', 'edad', 'experiencia', 'formacion', 'horizonte', 'objetivo', 'riesgo', 'email'].map(
        (campo) => (
          <label key={campo} className={labelCls}>
            {campo.charAt(0).toUpperCase() + campo.slice(1)}:
            <input
              type={campo === 'edad' ? 'number' : campo === 'email' ? 'email' : 'text'}
              name={campo}
              value={formData[campo]}
              onChange={handleChange}
              className={inputCls}
              required
            />
          </label>
        ),
      )}

      <button
        type="submit"
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-lg"
      >
        Enviar
      </button>
    </form>
  )
}

export default Cuestionario