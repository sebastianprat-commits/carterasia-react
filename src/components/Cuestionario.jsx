import React, { useState } from 'react'
import { db } from '../firebaseConfig'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// Función para calcular el perfil de inversión
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

// Función para obtener la cartera según el perfil
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
  // Definir los datos del formulario
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

  // Navegación para redirigir a la página de la cartera
  const navigate = useNavigate()

  // Manejar los cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    const perfil = calcularPerfil(formData)
    const cartera = obtenerCartera(perfil)

    try {
      // Guardamos la respuesta del cuestionario en Firebase
      await addDoc(collection(db, 'cuestionarios'), {
        ...formData,
        perfil,
        timestamp: Timestamp.now()
      })

      // Redirigimos a la página de cartera, pasando el perfil y el email como estado
      navigate('/cartera', { state: { perfil, email: formData.email } })

    } catch (error) {
      console.error("Error al guardar o enviar:", error)
      alert("Hubo un error al guardar o enviar el email.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Simulador de Perfil Inversor</h2>

      {/* Mapeamos los campos para crear los inputs del formulario */}
      {['nombre', 'edad', 'experiencia', 'formacion', 'horizonte', 'objetivo', 'riesgo', 'email'].map((campo) => (
        <label key={campo} className="block mb-2 capitalize">
          {campo}:
          <input
            type={campo === 'edad' ? 'number' : campo === 'email' ? 'email' : 'text'}
            name={campo}
            value={formData[campo]}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </label>
      ))}

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Enviar
      </button>
    </form>
  )
}

export default Cuestionario
