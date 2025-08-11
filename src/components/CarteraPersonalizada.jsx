// src/components/CarteraPersonalizada.jsx
import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import emailjs from '@emailjs/browser'
import { storage } from '../firebaseConfig'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// --- 10 activos por perfil, con pesos y metadatos simplificados ---
const obtenerCartera = (perfil) => {
  const mk = (ticker, name, weight, region, sector, type='ETF') =>
    ({ ticker, name, weight, region, sector, type })

  const conservador = [
    mk('IBGL', 'iShares Euro Govt Bond 1-3yr', 15, 'Europa', 'Bonos Gob 1-3y', 'ETF'),
    mk('VAGF', 'Vanguard Global Aggregate Bond', 15, 'Global', 'Bonos Global', 'ETF'),
    mk('XG7S', 'Xtrackers II Eurozone Govt Bond', 10, 'Eurozona', 'Bonos Gob', 'ETF'),
    mk('IEAA', 'iShares Core € Corp Bond', 10, 'Europa', 'Bonos Corp', 'ETF'),
    mk('AECE', 'Amundi Cash EUR', 10, 'Europa', 'Monetario', 'Fondo'),
    mk('VUAA', 'Vanguard S&P 500 Accum.', 10, 'EE.UU.', 'RV USA', 'ETF'),
    mk('IWDA', 'iShares Core MSCI World', 10, 'Global', 'RV Global', 'ETF'),
    mk('EMAG', 'iShares J.P. Morgan EM Bond', 5, 'Emergentes', 'Bonos EM', 'ETF'),
    mk('EUNA', 'iShares € Inflation Linked', 7, 'Europa', 'Bonos IL', 'ETF'),
    mk('GLD',  'SPDR Gold Trust', 8, 'Global', 'Oro', 'ETF')
  ]

  const moderado = [
    mk('IWDA', 'iShares Core MSCI World', 18, 'Global', 'RV Global'),
    mk('VUAA', 'Vanguard S&P 500 Accum.', 15, 'EE.UU.', 'RV USA'),
    mk('EIMI', 'iShares Core MSCI EM IMI', 10, 'Emergentes', 'RV EM'),
    mk('EUNA', 'iShares € Inflation Linked', 8, 'Europa', 'Bonos IL'),
    mk('VAGF', 'Vanguard Global Aggregate Bond', 12, 'Global', 'Bonos Global'),
    mk('IEAA', 'iShares Core € Corp Bond', 10, 'Europa', 'Bonos Corp'),
    mk('WSML', 'iShares MSCI World Small Cap', 8, 'Global', 'Small Cap'),
    mk('XSCU', 'Xtrackers MSCI Europe Small Cap', 6, 'Europa', 'Small Cap'),
    mk('GLD',  'SPDR Gold Trust', 7, 'Global', 'Oro'),
    mk('IQQH', 'iShares Global Clean Energy', 6, 'Global', 'Temático')
  ]

  const dinamico = [
    mk('IWDA', 'iShares Core MSCI World', 20, 'Global', 'RV Global'),
    mk('VUAA', 'Vanguard S&P 500 Accum.', 18, 'EE.UU.', 'RV USA'),
    mk('EIMI', 'iShares Core MSCI EM IMI', 15, 'Emergentes', 'RV EM'),
    mk('WSML', 'iShares MSCI World Small Cap', 10, 'Global', 'Small Cap'),
    mk('QQQ',  'Invesco NASDAQ-100', 10, 'EE.UU.', 'Tech Growth'),
    mk('IQQH', 'iShares Global Clean Energy', 7, 'Global', 'Temático'),
    mk('GLD',  'SPDR Gold Trust', 5, 'Global', 'Oro'),
    mk('VAGF', 'Vanguard Global Aggregate Bond', 5, 'Global', 'Bonos Global'),
    mk('HEDJ', 'WisdomTree Europe Hedged Equity', 5, 'Europa', 'RV Europa'),
    mk('EUNA', 'iShares € Inflation Linked', 5, 'Europa', 'Bonos IL')
  ]

  if (perfil === 'conservador') return conservador
  if (perfil === 'moderado') return moderado
  return dinamico
}

// formato %
const pct = (n) => `${Number(n).toFixed(0)}%`

// --- PDF extenso (3 páginas) ---
async function generarPDF({ perfil, cartera, nombre }) {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const draw = (page, text, x, y, size=12, color=rgb(0,0,0)) =>
    page.drawText(text, { x, y, size, font, color })

  // Portada
  const p1 = pdfDoc.addPage([600, 780])
  draw(p1, 'Informe de Cartera — CarterasAI', 40, 740, 18, rgb(0,0,0.6))
  const fecha = new Date().toLocaleString()
  draw(p1, `Fecha: ${fecha}`, 40, 715, 11, rgb(0.25,0.25,0.25))
  if (nombre) draw(p1, `Usuario: ${nombre}`, 40, 700, 11, rgb(0.25,0.25,0.25))
  draw(p1, `Perfil inversor: ${perfil}`, 40, 660, 14)

  // Tabla de 10 posiciones
  draw(p1, 'Cartera sugerida (10 posiciones):', 40, 630, 13)
  let y = 610
  draw(p1, 'Ticker   Peso   Nombre                                             Región      Sector', 40, y, 11, rgb(0.1,0.1,0.1))
  y -= 18
  cartera.forEach(a => {
    const line = `${(a.ticker || '').padEnd(7)} ${pct(a.weight).padEnd(6)} ${(a.name || '').padEnd(48)} ${(a.region || '').padEnd(10)} ${(a.sector || '')}`
    draw(p1, line, 40, y, 11)
    y -= 16
  })

  // Metodología / perfil
  const p2 = pdfDoc.addPage([600, 780])
  draw(p2, 'Metodología y perfil', 40, 740, 16, rgb(0,0,0.6))
  writeParagraph(p2,
    'Tu perfil se estima combinando edad, experiencia, formación financiera, horizonte temporal, objetivo y tolerancia al riesgo. ' +
    'A partir de él, se asignan pesos entre renta variable (global/EE.UU./emergentes/small cap), renta fija (global/corporativa/ligada a inflación), oro y temáticos. ' +
    'La suma de pesos es 100%. En futuras iteraciones añadiremos cálculo de volatilidad objetivo y backtests frente a benchmarks.',
    40, 710, 520, 12, font)

  // Notas / avisos
  const p3 = pdfDoc.addPage([600, 780])
  draw(p3, 'Notas y avisos', 40, 740, 16, rgb(0,0,0.6))
  writeParagraph(p3,
    'Rentabilidades pasadas no garantizan rentabilidades futuras. Este informe es educativo y no constituye asesoramiento de inversión personalizado. ' +
    'Verifica clases de activo, divisa, réplica, TER y fiscalidad antes de contratar. Si lo deseas, podemos ofrecer asesoría individualizada.',
    40, 710, 520, 12, font)

  const bytes = await pdfDoc.save()
  return new Blob([bytes], { type: 'application/pdf' })
}

// párrafos con salto de línea básico
function writeParagraph(page, text, x, yStart, width, size, font) {
  const words = text.split(' ')
  let line = ''
  let y = yStart
  words.forEach((w) => {
    const test = line ? line + ' ' + w : w
    const wpx = font.widthOfTextAtSize(test, size)
    if (wpx > width) {
      page.drawText(line, { x, y, size, font, color: rgb(0.15,0.15,0.15) })
      line = w
      y -= size + 6
    } else {
      line = test
    }
  })
  if (line) page.drawText(line, { x, y, size, font, color: rgb(0.15,0.15,0.15) })
}

// --- Sube PDF a Firebase Storage y devuelve URL pública ---
async function subirPDFaStorage(pdfBlob, docId) {
  const fileRef = ref(storage, `reports/${docId}.pdf`)
  await uploadBytes(fileRef, pdfBlob)
  const url = await getDownloadURL(fileRef)
  return url
}

// --- Envía email con enlace (sin adjunto) ---
async function enviarEmailConEnlace({ perfil, cartera, email, nombre, docId }) {
  const pdfBlob = await generarPDF({ perfil, cartera, nombre })
  const url = await subirPDFaStorage(pdfBlob, docId)

  const textoCartera = cartera
    .map(a => `• ${a.ticker} — ${a.name} — ${pct(a.weight)} — ${a.region} — ${a.sector}`)
    .join('\n')

  const params = {
    to_email: email,
    nombre_usuario: nombre || '',
    perfil_usuario: perfil,
    enlace_pdf: url,          // 👈 usa {{enlace_pdf}} en tu plantilla
    cartera_items: textoCartera // 👈 usa {{cartera_items}} (preformateado)
  }

  await emailjs.send('service_toji81m', 'template_6us1g68', params, 'y2-PNRI-wvGie9Qdb')
}

export default function CarteraPersonalizada() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const perfil = state?.perfil
  const email = state?.email
  const nombre = state?.nombre
  const docId = state?.docId

  const [emailSent, setEmailSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)

  if (!perfil) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-4 bg-white shadow rounded text-center">
        <h2 className="text-xl font-bold mb-4">No se ha podido determinar tu perfil</h2>
        <p className="mb-4">Por favor, rellena el cuestionario para recibir tu cartera sugerida.</p>
        <Link to="/simulador" className="text-blue-600 underline">Volver al simulador</Link>
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
      a.download = `cartera-${perfil}.pdf`
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
    if (!email || !docId) {
      alert('Falta email o identificador. Vuelve al simulador.')
      return
    }
    try {
      setSending(true)
      setEmailSent(false)
      await enviarEmailConEnlace({ perfil, cartera, email, nombre, docId })
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
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">
        Tu perfil inversor es: <span className="capitalize text-blue-600">{perfil}</span>
      </h2>

      <h3 className="text-lg font-semibold mb-2">Cartera sugerida (10 posiciones):</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left bg-gray-50">
              <th className="p-2">Ticker</th>
              <th className="p-2">Nombre</th>
              <th className="p-2">Peso</th>
              <th className="p-2">Región</th>
              <th className="p-2">Sector</th>
            </tr>
          </thead>
          <tbody>
            {cartera.map((a, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{a.ticker}</td>
                <td className="p-2">{a.name}</td>
                <td className="p-2">{pct(a.weight)}</td>
                <td className="p-2">{a.region}</td>
                <td className="p-2">{a.sector}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
          {sending ? 'Enviando…' : 'Enviar enlace por email'}
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
