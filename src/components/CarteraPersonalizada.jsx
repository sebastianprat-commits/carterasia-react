import React from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

const obtenerCartera = (perfil) => {
  const carteras = {
    conservador: [
      'iShares Euro Government Bond 1-3yr (IBGL)',
      'Vanguard Global Aggregate Bond (VAGF)',
      'Amundi Cash EUR (AECE)',
    ],
    moderado: [
      'iShares MSCI World (IWRD)',
      'Vanguard Global Moderate Allocation (VMAA)',
      'Xtrackers ESG EUR Corp Bond (XDCB)',
    ],
    dinámico: [
      'ARK Innovation ETF (ARKK)',
      'iShares NASDAQ 100 (CNDX)',
      'Vanguard Emerging Markets (VFEM)',
    ],
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
    color: rgb(0, 0, 0.6),
  })

  page.drawText(`Fecha: ${fecha}`, { x: 50, y: 620, size: 12, font })
  page.drawText(`Perfil inversor detectado: ${perfil}`, {
    x: 50,
    y: 590,
    size: 14,
    font,
    color: rgb(0.2, 0.2, 0.2),
  })

  page.drawText('Cartera sugerida:', { x: 50, y: 560, size: 13, font })
  cartera.forEach((activo, i) => {
    page.drawText(`- ${activo}`, {
      x: 70,
      y: 540 - i * 20,
      size: 12,
      font,
    })
  })

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

const CarteraPersonalizada = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const perfil = location.state?.perfil
  const email = location.state?.email
  const nombre = location.state?.nombre
  const [emailSent, setEmailSent] = React.useState(false)

  if (!perfil) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 shadow rounded-xl text-center">
        <h2 className="text-xl font-bold mb-4">No se ha podido determinar tu perfil</h2>
        <p className="mb-4">Por favor, rellena el cuestionario para recibir tu cartera sugerida.</p>
        <Link to="/simulador" className="text-blue-600 hover:underline">
          Volver al simulador
        </Link>
      </div>
    )
  }

  const cartera = obtenerCartera(perfil)

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
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 shadow rounded-xl">
      <h2 className="text-xl font-bold mb-4">
        Tu perfil inversor es:{' '}
        <span className="capitalize text-blue-600 dark:text-blue-400">{perfil}</span>
      </h2>

      <h3 className="text-lg font-semibold mb-2">Cartera sugerida:</h3>
      <ul className="list-disc ml-6 text-gray-800 dark:text-gray-200">
        {cartera.map((activo, i) => (
          <li key={i}>{activo}</li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-3">
        {emailSent ? (
          <p className="text-green-600 dark:text-green-400">
            Email enviado correctamente. Redirigiendo…
          </p>
        ) : (
          <>
            <button
              onClick={handleDownloadPDF}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Descargar informe PDF
            </button>

            {/* Si más adelante quieres volver a enviar por email desde aquí, dejamos el botón preparado.
            <button
              onClick={handleEmailSend}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Enviar por email
            </button> */}
          </>
        )}

        <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline text-center">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

export default CarteraPersonalizada
