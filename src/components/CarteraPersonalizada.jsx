import React, { useLocation, useNavigate } from 'react-router-dom'
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
  const page = pdfDoc.addPage([600, 700])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const fecha = new Date().toLocaleString()

  page.drawText(`Informe de Cartera Personalizada`, {
    x: 50,
    y: 650,
    size: 18,
    font,
    color: rgb(0, 0, 0.6)
  })

  page.drawText(`Fecha: ${fecha}`, { x: 50, y: 620, size: 12, font })
  page.drawText(`Perfil inversor detectado: ${perfil}`, {
    x: 50,
    y: 590,
    size: 14,
    font,
    color: rgb(0.2, 0.2, 0.2)
  })

  page.drawText(`Cartera sugerida:`, { x: 50, y: 560, size: 13, font })

  cartera.forEach((activo, i) => {
    page.drawText(`- ${activo}`, {
      x: 70,
      y: 540 - i * 20,
      size: 12,
      font
    })
  })

  const pdfBytes = await pdfDoc.save()
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  return blob
}

const enviarEmail = async (perfil, cartera, email) => {
  const pdfBlob = await generarPDF(perfil, cartera)

  const formData = new FormData()
  formData.append('to_email', email)
  formData.append('nombre_usuario', 'Usuario') // Este valor puede provenir del formulario si lo tienes
  formData.append('perfil_usuario', perfil)
  formData.append('cartera_1', cartera[0])
  formData.append('cartera_2', cartera[1])
  formData.append('cartera_3', cartera[2])
  formData.append('pdf_attachment', pdfBlob, `cartera-${perfil}.pdf`) // Adjuntamos el archivo PDF como un Blob

  try {
    await emailjs.sendForm('service_toji81m', 'template_6us1g68', formData, 'y2-PNRI-wvGie9Qdb')
    console.log("Correo enviado correctamente")
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
      await enviarEmail(perfil, cartera, email)
      setEmailSent(true)
      setTimeout(() => {
        navigate('/')  // Redirige al usuario al inicio después de un breve retraso
      }, 2000)
    } catch (error) {
      console.error("Error al enviar el email:", error)
      alert("Hubo un error al enviar el correo.")
    }
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
              onClick={() => generarPDF(perfil, cartera)}
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

