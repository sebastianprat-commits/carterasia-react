
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
  try {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([600, 700])
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const fecha = new Date().toLocaleString()

    page.drawText("Informe de Cartera Personalizada", {
      x: 50,
      y: 650,
      size: 18,
      font,
      color: rgb(0, 0, 0.6)
    })

    page.drawText("Fecha:" ${fecha}, { x: 50, y: 620, size: 12, font })
    page.drawText("Perfil inversor detectado:" ${perfil}, {
      x: 50,
      y: 590,
      size: 14,
      font,
      color: rgb(0.2, 0.2, 0.2)
    })

    page.drawText("Cartera sugerida:", { x: 50, y: 560, size: 13, font })

    cartera.forEach((activo, i) => {
      page.drawText(- ${activo}, {
        x: 70,
        y: 540 - i * 20,
        size: 12,
        font
      })
    })

    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    return blob
  } catch (error) {
    console.error("Error al generar el PDF", error)
    alert("Hubo un problema generando el PDF.")
  }
}

const enviarEmail = async (perfil, cartera, email, nombre) => {
  try {
    const pdfBlob = await generarPDF(perfil, cartera)

    // Convertir el Blob del PDF a base64
    const reader = new FileReader()
    reader.readAsDataURL(pdfBlob)

    reader.onloadend = async () => {
      const base64Pdf = reader.result.split(',')[1] // Eliminar la parte "data:application/pdf;base64,"

      const formData = {
        to_email: email,
        nombre_usuario: nombre,  // Aquí pasamos el nombre del usuario
        perfil_usuario: perfil,
        cartera_1: cartera[0],
        cartera_2: cartera[1],
        cartera_3: cartera[2],
        pdf_attachment: base64Pdf  // Pasar el PDF como base64
      }

      // Usamos sendForm para enviar los datos directamente
      await emailjs.send('service_toji81m', 'template_6us1g68', formData, 'y2-PNRI-wvGie9Qdb')
      console.log("Correo enviado correctamente")
    }
    
  } catch (error) {
    console.error("Error al enviar el email:", error)
    alert("Hubo un error al enviar el correo.")
  }
}



const CarteraPersonalizada = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const perfil = location.state?.perfil
  const email = location.state?.email  // Asegúrate de que el email también se pase en la redirección
  const [emailSent, setEmailSent] = React.useState(false)

  if (!perfil || !email) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-4 bg-white shadow rounded text-center">
        <h2 className="text-xl font-bold mb-4">No se ha podido determinar tu perfil</h2>
        <p className="mb-4">Por favor, rellena el cuestionario para recibir tu cartera sugerida.</p>
        <Link to="/simulador" className="text-blue-600 underline">
          Volver al simulador
        </Link>
      </div>
    )
  }

  const cartera = obtenerCartera(perfil)

  const handleEmailSend = async () => {
  try {
    setEmailSent(false) // Resetear el estado de mensaje enviado al intentar enviar el email
    await enviarEmail(perfil, cartera, email, location.state?.nombre)  // Pasa el nombre del usuario
    setEmailSent(true)
    setTimeout(() => {
      navigate('/')  // Redirige al usuario al inicio después de un breve retraso
    }, 5000) // Aumentar el timeout para que el mensaje de éxito sea visible más tiempo
  } catch (error) {
    console.error("Error al enviar el email:", error)
    alert("Hubo un error al enviar el correo.")
  }
}



  const handleDownloadPDF = async () => {
    const pdfBlob = await generarPDF(perfil, cartera)
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = cartera-${perfil}.pdf
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Tu perfil inversor es: <span className="capitalize text-blue-600">{perfil}</span></h2>

      <h3 className="text-lg font-semibold mb-2">Cartera sugerida:</h3>
      <ul className="list-disc ml-6 text-gray-800">
        {cartera.map((activo, i) => (
          <li key={i}>{activo}</li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-4">
        {emailSent ? (
          <p className="text-green-600">Email enviado correctamente. Redirigiendo...</p>
        ) : (
          <>
            <button
              onClick={handleDownloadPDF}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Descargar informe PDF
            </button>

            <button
              onClick={handleEmailSend}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Enviar por email
            </button>
          </>
        )}

        <Link to="/" className="text-blue-600 underline text-center">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

export default CarteraPersonalizada
