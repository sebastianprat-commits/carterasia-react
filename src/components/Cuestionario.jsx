import { useState } from 'react'
import { db } from '../firebaseConfig'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

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

  const generarPDF = async (perfil, cartera) => {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([600, 400])
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    page.drawText(`Perfil Inversor: ${perfil}`, {
      x: 50,
      y: 350,
      size: 18,
      font,
      color: rgb(0, 0, 0)
    })

    page.drawText('Cartera sugerida:', {
      x: 50,
      y: 320,
      size: 14,
      font,
      color: rgb(0.1, 0.1, 0.1)
    })

    cartera.forEach((activo, i) => {
      page.drawText(`- ${activo}`, {
        x: 70,
        y: 300 - i * 20,
        size: 12,
        font,
        color: rgb(0, 0, 0)
      })
    })

    const pdfBytes = await pdfDoc.save()
    const base64Pdf = btoa(String.fromCharCode(...pdfBytes))
    return base64Pdf
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const perfil = calcularPerfil(formData)
    const cartera = obtenerCartera(perfil)

    try {
      // Guarda en Firestore
      await addDoc(collection(db, 'cuestionarios'), {
        ...formData,
        perfil,
        timestamp: Timestamp.now()
      })

      // Genera PDF en base64
      const pdfBase64 = await generarPDF(perfil, cartera)

      // Envía el email con EmailJS
      await emailjs.send('service_y1v48yw', 'template_6us1g68', {
        to_email: formData.email,
        perfil_usuario: perfil,
        cartera_sugerida: cartera.join(', '),
        pdf_attachment: pdfBase64
      }, 'y2-PNRI-wvGie9Qdb')

      // Redirige al componente de cartera personalizada
      localStorage.setItem('perfilUsuario', perfil)
      navigate('/cartera', { state: { perfil } })

    } catch (error) {
      console.error("Error:", error)
      alert("Hubo un problema al guardar o enviar el email.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Simulador de Perfil Inversor</h2>

      {['edad', 'experiencia', 'formacion', 'horizonte', 'objetivo', 'riesgo', 'email'].map((campo) => (
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

