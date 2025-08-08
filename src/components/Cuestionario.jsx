import React, { useState, useRef, useMemo } from 'react'
import { db } from '../firebaseConfig'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

const calcularPerfil = (respuestas) => {
  let score = 0
  const edad = parseInt(respuestas.edad)
  if (!isNaN(edad)) {
    if (edad < 40) score += 2
    else if (edad < 60) score += 1
  }

  const map = { nada: 0, poca: 1, mucha: 2 }
  score += map[respuestas.experiencia?.toLowerCase()] || 0
  score += map[respuestas.formacion?.toLowerCase()] || 0

  const horizonte = respuestas.horizonte?.toLowerCase?.() || ''
  if (horizonte.includes('corto')) score += 0
  else if (horizonte.includes('medio')) score += 1
  else if (horizonte.includes('largo')) score += 2

  const objetivo = respuestas.objetivo?.toLowerCase?.() || ''
  if (objetivo.includes('conservar')) score += 0
  else if (objetivo.includes('poco')) score += 1
  else if (objetivo.includes('mucho')) score += 2

  const riesgo = respuestas.riesgo?.toLowerCase?.() || ''
  if (riesgo.includes('ninguno')) score += 0
  else if (riesgo.includes('poco')) score += 1
  else if (riesgo.includes('mucho')) score += 2

  if (score <= 4) return 'conservador'
  if (score <= 8) return 'moderado'
  return 'dinámico'
}

const obtenerCartera = (perfil) => {
  const carteras = {
    conservador: [
      'iShares Euro Government Bond 1-3yr (IBGL)',
      'Vanguard Global Aggregate Bond (VAGF)',
      'Amundi Cash EUR (AECE)'
    ],
    moderado: [
      'iShares MSCI World (IWRD)',
      'Vanguard Global Moderate Allocation (VMAA)',
      'Xtrackers ESG EUR Corp Bond (XDCB)'
    ],
    dinámico: [
      'ARK Innovation ETF (ARKK)',
      'iShares NASDAQ 100 (CNDX)',
      'Vanguard Emerging Markets (VFEM)'
    ]
  }
  return carteras[perfil] || []
}

export default function Cuestionario() {
  const [formData, setFormData] = useState({
    nombre: '',
    edad: '',
    experiencia: '',
    formacion: '',
    horizonte: '',
    objetivo: '',
    riesgo: '',
    email: ''
  })

  const navigate = useNavigate()
  const formRef = useRef(null)

  const campos = ['nombre', 'edad', 'experiencia', 'formacion', 'horizonte', 'objetivo', 'riesgo', 'email']

  // Progreso en %
  const progress = useMemo(() => {
    const filled = campos.reduce((acc, c) => acc + (formData[c] ? 1 : 0), 0)
    return Math.round((filled / campos.length) * 100)
  }, [formData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const perfil = calcularPerfil(formData)
    const cartera = obtenerCartera(perfil)

    try {
      await addDoc(collection(db, 'cuestionarios'), {
        ...formData,
        perfil,
        timestamp: Timestamp.now()
      })

      navigate('/cartera', { state: { perfil, email: formData.email, nombre: formData.nombre } })
    } catch (error) {
      console.error('Error al guardar:', error)
      alert('Hubo un error al guardar los datos.')
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Simulador de Perfil Inversor</h2>

      {/* Barra de progreso */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span>Progreso</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Campos */}
      <div className="grid gap-4">
        {campos.map((campo) => (
          <label key={campo} className="block">
            <span className="block mb-1 capitalize">{campo}:</span>
            <input
              type={campo === 'edad' ? 'number' : campo === 'email' ? 'email' : 'text'}
              name={campo}
              value={formData[campo]}
              onChange={handleChange}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </label>
        ))}
      </div>

      <button
        type="submit"
        className="mt-6 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Enviar
      </button>
    </form>
  )
}
