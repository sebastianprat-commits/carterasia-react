import { useState } from 'react'
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
    edad: '',
    experiencia: '',
    formacion: '',
    horizonte: '',
    objetivo: '',
    riesgo: '',
    email: ''
  })

  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const perfil = calcularPerfil(formData)
    const cartera = obtenerCartera(perfil)

    try {
      // Guardar en Firebase
      await addDoc(collection(db, 'cuestionarios'), {
        ...formData,
        perfil,
        timestamp: Timestamp.now()
      })

      // Enviar email con EmailJS
      await emailjs.send('service_y1v48yw', 'y2-PNRI-wvGie9Qdb', {
        to_email: formData.email,
        user_perfil: perfil,
        cartera_sugerida: cartera.join(', ')
      }, 'y2-PNRI-wvGie9Qdb')

      localStorage.setItem('perfilUsuario', perfil)
      navigate('/cartera', { state: { perfil } })

    } catch (error) {
      console.error("Error al enviar datos o correo:", error)
      alert("Error al enviar los datos. Revisa el email y vuelve a intentar.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Simulador de Perfil Inversor</h2>

      <label className="block mb-2">
        Edad:
        <input type="number" name="edad" value={formData.edad} onChange={handleChange} className="w-full border p-2 rounded" required />
      </label>

      <label className="block mb-2">
        Experiencia:
        <input type="text" name="experiencia" value={formData.experiencia} onChange={handleChange} className="w-full border p-2 rounded" required />
      </label>

      <label className="block mb-2">
        Formación:
        <input type="text" name="formacion" value={formData.formacion} onChange={handleChange} className="w-full border p-2 rounded" required />
      </label>

      <label className="block mb-2">
        Horizonte temporal:
        <input type="text" name="horizonte" value={formData.horizonte} onChange={handleChange} className="w-full border p-2 rounded" required />
      </label>

      <label className="block mb-2">
        Objetivo:
        <input type="text" name="objetivo" value={formData.objetivo} onChange={handleChange} className="w-full border p-2 rounded" required />
      </label>

      <label className="block mb-2">
        Riesgo asumido:
        <input type="text" name="riesgo" value={formData.riesgo} onChange={handleChange} className="w-full border p-2 rounded" required />
      </label>

      <label className="block mb-4">
        Tu email:
        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border p-2 rounded" required />
      </label>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Enviar
      </button>
    </form>
  )
}

export default Cuestionario
