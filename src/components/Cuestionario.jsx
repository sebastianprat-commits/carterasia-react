import React, { useState, useRef } from 'react'
import { db } from '../firebaseConfig'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import emailjs from '@emailjs/browser'

const calcularPerfil = (respuestas) => {
  let score = 0

  const edad = parseInt(respuestas.edad)
  if (edad < 40) score += 2
  else if (edad < 60) score += 1

  const map = { nada: 0, poca: 1, mucha: 2 }
  score += map[respuestas.experiencia?.toLowerCase()] || 0
  score += map[respuestas.formacion?.toLowerCase()] || 0

  const horizonte = respuestas.horizonte?.toLowerCase()
  if (horizonte.includes("corto")) score += 0
  else if (horizonte.includes("medio")) score += 1
  else if (horizonte.includes("largo")) score += 2

  const objetivo = respuestas.objetivo?.toLowerCase()
  if (objetivo.includes("conservar")) score += 0
  else if (objetivo.includes("poco")) score += 1
  else if (objetivo.includes("mucho")) score += 2

  const riesgo = respuestas.riesgo?.toLowerCase()
  if (riesgo.includes("ninguno")) score += 0
  else if (riesgo.includes("poco")) score += 1
  else if (riesgo.includes("mucho")) score += 2

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

function Cuestionario() {
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

  // Usamos useRef para hacer referencia al formulario
  const formRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
  e.preventDefault()  // Prevenir el comportamiento por defecto del formulario

  const perfil = calcularPerfil(formData)  // Aquí calculamos el perfil
  const cartera = obtenerCartera(perfil)  // Obtenemos la cartera basada en el perfil

  try {
    // Guardamos las respuestas del cuestionario en Firebase
    await addDoc(collection(db, 'cuestionarios'), {
      ...formData,
      perfil,
      timestamp: Timestamp.now()
    })

    // Redirigimos a la página de cartera, pasando el perfil, el email y el nombre como estado
    navigate('/cartera', { state: { perfil, email: formData.email, nombre: formData.nombre } })

  } catch (error) {
    console.error("Error al guardar o enviar:", error)
    alert("Hubo un error al guardar o enviar el email.")
  }
}


  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto card">
  <h2 className="text-2xl font-semibold mb-4">Simulador de Perfil Inversor</h2>

  {['nombre','edad','experiencia','formacion','horizonte','objetivo','riesgo','email'].map((campo) => (
    <label key={campo} className="block mb-3">
      <span className="block text-sm text-ink-500 mb-1 capitalize">{campo}</span>
      <input
        type={campo === 'edad' ? 'number' : campo === 'email' ? 'email' : 'text'}
        name={campo}
        value={formData[campo]}
        onChange={handleChange}
        className="w-full border border-gray-200 focus:border-brand-400 focus:ring-brand-400 rounded-lg px-3 py-2 outline-none"
        required
      />
    </label>
  ))}

  <button type="submit" className="btn btn-primary mt-2">Continuar</button>
</form>
  )
}

export default Cuestionario

