import { useState } from 'react'
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

function Cuestionario() {
  const [formData, setFormData] = useState({
    edad: '',
    experiencia: '',
    formacion: '',
    horizonte: '',
    objetivo: '',
    riesgo: ''
  })

  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const perfil = calcularPerfil(formData)

    try {
      await addDoc(collection(db, 'cuestionarios'), {
        ...formData,
        perfil,
        timestamp: Timestamp.now()
      })

      navigate('/cartera', { state: { perfil } }) // 👈 redirección correcta

    } catch (error) {
      console.error("Error al guardar en Firestore:", error)
      alert("Error al guardar los datos")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Simulador de Perfil Inversor</h2>

      <label className="block mb-2">
        Edad:
        <input
          type="number"
          name="edad"
          value={formData.edad}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
      </label>

      <label className="block mb-2">
        Experiencia:
        <input
          type="text"
          name="experiencia"
          value={formData.experiencia}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
      </label>

      <label className="block mb-2">
        Formación:
        <input
          type="text"
          name="formacion"
          value={formData.formacion}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
      </label>

      <label className="block mb-2">
        Horizonte temporal:
        <input
          type="text"
          name="horizonte"
          value={formData.horizonte}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
      </label>

      <label className="block mb-2">
        Objetivo:
        <input
          type="text"
          name="objetivo"
          value={formData.objetivo}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
      </label>

      <label className="block mb-4">
        Riesgo asumido:
        <input
          type="text"
          name="riesgo"
          value={formData.riesgo}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
      </label>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Enviar
      </button>
    </form>
  )
}

export default Cuestionario
