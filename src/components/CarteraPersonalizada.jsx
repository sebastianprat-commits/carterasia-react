import { useLocation, Link } from 'react-router-dom'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

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
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `cartera-${perfil}.pdf`
  link.click()

  URL.revokeObjectURL(url)
}

const CarteraPersonalizada = () => {
  const location = useLocation()
  const perfil = location.state?.perfil

  if (!perfil) {
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
        <button
          onClick={() => generarPDF(perfil, cartera)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Descargar informe PDF
        </button>

        <Link to="/" className="text-blue-600 underline text-center">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

export default CarteraPersonalizada
