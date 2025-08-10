// src/components/CarteraPersonalizada.jsx
import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import emailjs from '@emailjs/browser'

// ======== Cartera según perfil (placeholder) ========
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

// ======== Utilidad: formateo simple ========
const pct = (n) => '${Number(n).toFixed(0)}%'

// ======== Generador de PDF (texto simple, sin símbolos raros) ========
async function generarPDF({ perfil, cartera, nombre }) {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Página 1 — Portada / resumen
  const page1 = pdfDoc.addPage([600, 780])
  const draw = (page, text, x, y, size = 12, color = rgb(0, 0, 0)) => {
    page.drawText(text, { x, y, size, font, color })
  }

  draw(page1, 'Informe de Cartera — CarterasAI', 40, 740, 18, rgb(0, 0, 0.6))
  const fecha = new Date().toLocaleString()
  draw(page1, Fecha: ${fecha}, 40, 715, 11, rgb(0.25, 0.25, 0.25))
  if (nombre) draw(page1, Usuario: ${nombre}, 40, 700, 11, rgb(0.25, 0.25, 0.25))

  draw(page1, Perfil inversor detectado: ${perfil}, 40, 660, 14)
  draw(page1, 'Cartera sugerida (propuesta inicial):', 40, 630, 13)

  let y = 610
  cartera.forEach((activo, i) => {
    draw(page1, • ${activo}, 55, y, 12)
    y -= 18
  })

  // Página 2 — Explicación del perfil
  const page2 = pdfDoc.addPage([600, 780])
  draw(page2, 'Explicación del perfil', 40, 740, 16, rgb(0, 0, 0.6))
  const parrafoPerfil =
    'Este perfil se determina a partir de tus respuestas sobre edad, experiencia, formación, horizonte temporal, objetivo y tolerancia al riesgo. ' +
    'La propuesta busca equilibrar diversificación, costes y riesgo esperado. Recuerda que no es asesoramiento personalizado y puede actualizarse en el tiempo.'
  writeParagraph(page2, parrafoPerfil, 40, 710, 520, 12, font)

  // Página 3 — Notas y disclaimers
  const page3 = pdfDoc.addPage([600, 780])
  draw(page3, 'Notas y consideraciones', 40, 740, 16, rgb(0, 0, 0.6))
  const parrafoNotas =
    'Las rentabilidades pasadas no garantizan rentabilidades futuras. Los ETFs y fondos pueden subir o bajar. ' +
    'Esta herramienta tiene fines educativos. Antes de invertir, valora consultar a un asesor financiero registrado. ' +
    'Con el tiempo ampliaremos métricas (volatilidad, drawdown) y gráficos comparativos con benchmarks.'
  writeParagraph(page3, parrafoNotas, 40, 710, 520, 12, font)

  const bytes = await pdfDoc.save()
  return new Blob([bytes], { type: 'application/pdf' })
}

// Utilidad para escribir párrafos con salto de línea básico
function writeParagraph(page, text, x, yStart, width, size, font) {
  const words = text.split(' ')
  let line = ''
  let y = yStart
  words.forEach((w) => {
    const test = line ? line + ' ' + w : w
    const testWidth = font.widthOfTextAtSize(test, size)
    if (testWidth > width) {
      page.drawText(line, { x, y, size, font, color: rgb(0.15, 0.15, 0.15) })
      line = w
      y -= size + 6
    } else {
      line = test
    }
  })
  if (line) page.drawText(line, { x, y, size, font, color: rgb(0.15, 0.15, 0.15) })
}

// ======== Email ========
async function enviarEmail({ perfil, cartera, email, nombre }) {
  // Genera PDF y convíertelo a base64
  const pdfBlob = await generarPDF({ perfil, cartera, nombre })
  const base64Pdf = await blobToBase64(pdfBlob)

  const params = {
    to_email: email,
    nombre_usuario: nombre || '',
    perfil_usuario: perfil,
    cartera_1: cartera[0] || '',
    cartera_2: cartera[1] || '',
    cartera_3: cartera[2] || '',
    pdf_attachment: base64Pdf, // sin prefijo data:
  }

  // OJO: usa tus IDs reales (ya nos diste estos)
  await emailjs.send('service_toji81m', 'template_6us1g68', params, 'y2-PNRI-wvGie9Qdb')
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result || ''
      const base64 = result.toString().split(',')[1] || ''
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// ======== Componente ========
export default function CarteraPersonalizada() {
  const location = useLocation()
  const navigate = useNavigate()

  const perfil = location.state?.perfil
  const email = location.state?.email
  const nombre = location.state?.nombre

  const [emailSent, setEmailSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)

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

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true)
      const pdfBlob = await generarPDF({ perfil, cartera, nombre })
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = cartera-${perfil}.pdf
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert('No se pudo generar el PDF.')
    } finally {
      setDownloading(false)
    }
  }

  const handleEmailSend = async () => {
    if (!email) {
      alert('No tenemos tu email. Vuelve al simulador e introdúcelo.')
      return
    }
    try {
      setSending(true)
      setEmailSent(false)
      await enviarEmail({ perfil, cartera, email, nombre })
      setEmailSent(true)
      setTimeout(() => navigate('/'), 4500)
    } catch (e) {
      console.error(e)
      alert('No se pudo enviar el email.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">
        Tu perfil inversor es: <span className="capitalize text-blue-600">{perfil}</span>
      </h2>

      <h3 className="text-lg font-semibold mb-2">Cartera sugerida:</h3>
      <ul className="list-disc ml-6 text-gray-800">
        {cartera.map((activo, i) => (
          <li key={i}>{activo}</li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
        >
          {downloading ? 'Generando PDF…' : 'Descargar informe PDF'}
        </button>

        <button
          onClick={handleEmailSend}
          disabled={sending}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {sending ? 'Enviando…' : 'Enviar por email'}
        </button>

        {emailSent && (
          <p className="text-green-600 text-sm">Email enviado correctamente. Redirigiendo…</p>
        )}

        <Link to="/" className="text-blue-600 underline text-center mt-2">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
