import { useState } from 'react'
import { db } from '../firebaseConfig'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()

function Cuestionario() {
  const [formData, setFormData] = useState({
    edad: '',
    experiencia: '',
    formacion: '',
    horizonte: '',
    objetivo: '',
    riesgo: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

 const handleSubmit = async (e) => {
  e.preventDefault()
  console.log("Datos a guardar:", formData)  // 👈 ESTA LÍNEA NUEVA
   navigate('/cartera', { state: formData })


  try {
  console.log("Datos que se van a guardar en Firestore:", {
    ...formData,
    timestamp: Timestamp.now()
  })

  await addDoc(collection(db, 'cuestionarios'), {
    ...formData,
    timestamp: Timestamp.now()
  })
    alert('Gracias por tus respuestas. Generaremos tu cartera personalizada pronto.')
    setFormData({
      edad: '',
      experiencia: '',
      formacion: '',
      horizonte: '',
      objetivo: '',
      riesgo: ''
    })
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
        <input type="number" name="edad" value={formData.edad} onChange={handleChange} className="w-full border p-2 rounded" />
      </label>

      <label className="block mb-2">
        Experiencia:
        <input type="text" name="experiencia" value={formData.experiencia} onChange={handleChange} className="w-full border p-2 rounded" />
      </label>

      <label className="block mb-2">
        Formación:
        <input type="text" name="formacion" value={formData.formacion} onChange={handleChange} className="w-full border p-2 rounded" />
      </label>

      <label className="block mb-2">
        Horizonte temporal:
        <input type="text" name="horizonte" value={formData.horizonte} onChange={handleChange} className="w-full border p-2 rounded" />
      </label>

      <label className="block mb-2">
        Objetivo:
        <input type="text" name="objetivo" value={formData.objetivo} onChange={handleChange} className="w-full border p-2 rounded" />
      </label>

      <label className="block mb-4">
        Riesgo asumido:
        <input type="text" name="riesgo" value={formData.riesgo} onChange={handleChange} className="w-full border p-2 rounded" />
      </label>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Enviar
      </button>
    </form>
  )

export default Cuestionario

