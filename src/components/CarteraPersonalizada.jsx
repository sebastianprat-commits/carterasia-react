import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import emailjs from '@emailjs/browser'

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

const generarPDF = async (perfil, cartera) => {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([600, 720])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const fecha = new Date().toLocaleString('es-ES')

  page.drawText('Informe de Cartera Personalizada', { x: 50, y: 680, size: 18, font, color: rgb(0.17,0.42,0.69) })
  page.drawText(`Fecha: ${fecha}`, { x: 50, y: 655, size: 12, font, color: rgb(0.2,0.2,0.2) })
  page.drawText(`Perfil inversor detectado: ${perfil}`, { x: 50, y: 630, size: 14, font })

  page.drawText('Cartera sugerida:', { x: 50, y: 600, size: 13, font })
  cartera.forEach((activo, i) => {
    page.drawText(`- ${activo}`, { x: 70, y: 580 - i * 20, size: 12, font })
  })

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

const enviarEmail = async (perfil, cartera, email, nombre) => {
  const pdfBlob = await generarPDF(perfil, cartera)
  const reader = new FileReader()

  return new Promise((resolve, reject) => {
    reader.onloadend = async () => {
      try {
        const base64Pdf = reader.result.split(',')[1]
        await emailjs.send(
          'service_toji81m',
          'template_6us1g68',
          {
            to_email: email,
            nombre_usuario: nombre || '',
            perfil_usuario: perfil,
            cartera_1: cartera[0] || '',
            cartera_2: cartera[1] || '',
            cartera_3: cartera[2] || '',
            pdf_attachment: base64Pdf,
          },
          'y2-PNRI-wvGie9Qdb'
        )
        resolve()
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(pdfBlob)
  })
}

const CarteraPersonalizada = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const perfil = location.state?.perfil
  const email = location.state?.email
  const nombre = location.state?.nombre
  const [emailSent, setEmailSent] = useState(false)
  const cartera = perfil ? obtenerCartera(perfil) : []

  if (!perfil || !email) {
    return (
      <div className="max-w-xl mx-auto mt-10 card text-center">
        <h2 className="text-xl font-bold mb-4">No se ha podido determinar tu perfil</h2>
        <p className="mb-4">Por favor, rellena el cuestionario para recibir tu cartera sugerida.</p>
        <Link to="/simulador" className="btn btn-primary">Volver al simulador</Link>
      </div>
    )
  }

  const handleEmailSend = async () => {
    try {
      setEmailSent(false)
      await enviarEmail(perfil, cartera, email, nombre)
      setEmailSent(true)
      setTimeout(() => navigate('/'), 4000)
    } catch (error) {
      console.error('Error al enviar el email:', error)
      alert('Hubo un error al enviar el correo.')
    }
  }

  const handleDownloadPDF = async () => {
    const pdfBlob = await generarPDF(perfil, cartera)
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cartera-${perfil}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 card">
      <div className="flex items-center gap-3 mb-6">
        <span className="badge">Resultado</span>
        <h2 className="text-2xl font-semibold">Tu perfil inversor</h2>
      </div>

      <div className="mb-4">
        <p className="text-ink-500">Hemos analizado tus respuestas y tu perfil es:</p>
        <p className="text-2xl font-bold text-brand-600 capitalize">{perfil}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Cartera sugerida</h3>
        <ul className="list-disc ml-6 text-ink-700 space-y-1">
          {cartera.map((activo, i) => <li key={i}>{activo}</li>)}
        </ul>
      </div>

      {emailSent && (
        <div className="mb-4 rounded-lg bg-green-50 text-green-800 px-4 py-3">
          Email enviado correctamente. Te redirigimos al inicio…
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={handleDownloadPDF} className="btn btn-ghost border border-brand-200">
          Descargar PDF
        </button>
        <button onClick={handleEmailSend} className="btn btn-primary">
          Enviarme por email
        </button>
        <Link to="/" className="btn btn-ghost">Volver al inicio</Link>
      </div>
    </div>
  )
}

export default CarteraPersonalizada


