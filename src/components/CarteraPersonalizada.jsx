// src/components/CarteraPersonalizada.jsx
import React, { useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { PDFDocument, rgb } from 'pdf-lib'
import emailjs from '@emailjs/browser'

// ======== Config EmailJS (ajusta si cambiaste algo) ========
const EMAIL_SERVICE_ID = 'service_toji81m'
const EMAIL_TEMPLATE_ID = 'template_6us1g68'
const EMAIL_PUBLIC_KEY = 'y2-PNRI-wvGie9Qdb'

// ======== Utilidad: cartera según perfil con 10 instrumentos (demo) ========
const obtenerCarteraDetallada = (perfil) => {
  const base = {
    conservador: [
      { ticker: 'IBGL', nombre: 'iShares Euro Government Bond 1-3yr', tipo: 'Renta fija GOV EUR', peso: 18 },
      { ticker: 'VAGF', nombre: 'Vanguard Global Aggregate Bond', tipo: 'Renta fija Global', peso: 15 },
      { ticker: 'XDCB', nombre: 'Xtrackers ESG EUR Corporate Bond', tipo: 'Renta fija Corp EUR', peso: 12 },
      { ticker: 'AECE', nombre: 'Amundi Cash EUR', tipo: 'Monetario', peso: 10 },
      { ticker: 'IGIL', nombre: 'iShares Global Inflation-Linked', tipo: 'Bonos ligados IPC', peso: 10 },
      { ticker: 'EMB',  nombre: 'iShares J.P. Morgan EM Bond', tipo: 'Renta fija EM (USD hedged)', peso: 8 },
      { ticker: 'IUSA', nombre: 'iShares S&P 500', tipo: 'RV USA', peso: 9 },
      { ticker: 'EUNA', nombre: 'iShares Core MSCI Europe', tipo: 'RV Europa', peso: 7 },
      { ticker: 'IEMG', nombre: 'iShares Core MSCI EM', tipo: 'RV Emergentes', peso: 6 },
      { ticker: 'IWDP', nombre: 'iShares Global Dividend', tipo: 'Dividendos Global', peso: 5 },
    ],
    moderado: [
      { ticker: 'IWRD', nombre: 'iShares MSCI World', tipo: 'RV Global', peso: 22 },
      { ticker: 'CNDX', nombre: 'iShares NASDAQ 100', tipo: 'RV USA Tech', peso: 12 },
      { ticker: 'VFEM', nombre: 'Vanguard FTSE Emerging Markets', tipo: 'RV Emergentes', peso: 10 },
      { ticker: 'EUNA', nombre: 'iShares Core MSCI Europe', tipo: 'RV Europa', peso: 10 },
      { ticker: 'VAGF', nombre: 'Vanguard Global Aggregate Bond', tipo: 'Renta fija Global', peso: 16 },
      { ticker: 'XDCB', nombre: 'Xtrackers ESG EUR Corporate Bond', tipo: 'Renta fija Corp EUR', peso: 10 },
      { ticker: 'IGIL', nombre: 'iShares Global Inflation-Linked', tipo: 'Bonos ligados IPC', peso: 6 },
      { ticker: 'IUSV', nombre: 'iShares S&P 500 Value', tipo: 'Factor Value USA', peso: 6 },
      { ticker: 'IMID', nombre: 'iShares MSCI World Mid-Cap', tipo: 'RV Global Mid', peso: 5 },
      { ticker: 'IWDP', nombre: 'iShares Global Dividend', tipo: 'Dividendos Global', peso: 3 },
    ],
    dinámico: [
      { ticker: 'IWRD', nombre: 'iShares MSCI World', tipo: 'RV Global', peso: 24 },
      { ticker: 'CNDX', nombre: 'iShares NASDAQ 100', tipo: 'RV USA Tech', peso: 16 },
      { ticker: 'ARKK', nombre: 'ARK Innovation ETF', tipo: 'Innovación', peso: 8 },
      { ticker: 'IUSV', nombre: 'iShares S&P 500 Value', tipo: 'Factor Value USA', peso: 8 },
      { ticker: 'IMID', nombre: 'iShares MSCI World Mid-Cap', tipo: 'RV Global Mid', peso: 8 },
      { ticker: 'VFEM', nombre: 'Vanguard FTSE Emerging Markets', tipo: 'RV Emergentes', peso: 10 },
      { ticker: 'EUNA', nombre: 'iShares Core MSCI Europe', tipo: 'RV Europa', peso: 10 },
      { ticker: 'VAGF', nombre: 'Vanguard Global Aggregate Bond', tipo: 'Renta fija Global', peso: 8 },
      { ticker: 'XDCB', nombre: 'Xtrackers ESG EUR Corporate Bond', tipo: 'Renta fija Corp EUR', peso: 5 },
      { ticker: 'IGIL', nombre: 'iShares Global Inflation-Linked', tipo: 'Bonos ligados IPC', peso: 3 },
    ],
  }
  return base[perfil] || []
}

// ======== Explicación del perfil (demo) ========
const explicacionPerfil = (perfil) => {
  const textos = {
    conservador:
      'Perfil conservador: prioriza la preservación de capital y una volatilidad baja. La cartera favorece renta fija de calidad, monetarios y una exposición moderada a renta variable para protegerse de la inflación.',
    moderado:
      'Perfil moderado: busca equilibrio entre crecimiento y estabilidad. Combina renta variable global con renta fija diversificada para mantener la volatilidad en un rango manejable.',
    dinámico:
      'Perfil dinámico: persigue crecimiento a largo plazo aceptando mayor volatilidad. Pondera más la renta variable global, factores (tecnología, value, mid-cap) y mantiene algo de renta fija para diversificación.',
  }
  return textos[perfil] || 'Perfil no clasificado.'
}

// ======== Utilidad: formateo simple ========
const pct = (n) => '${Number(n).toFixed(0)}%'

// ======== Generador de PDF extenso con fuente Unicode y logo ========
async function generarPDFExtenso({ nombre = '', perfil, volObjetivo = '', cartera = [] }) {
  const pdf = await PDFDocument.create()

  // Fuente Unicode
  const fontBytes = await fetch('/fonts/Inter-Regular.ttf').then(r => r.arrayBuffer())
  const font = await pdf.embedFont(fontBytes, { subset: true })

  // Logo (opcional)
  let logoImage
  try {
    const logoBytes = await fetch('/logo-carterasai.png').then(r => r.arrayBuffer())
    logoImage = await pdf.embedPng(logoBytes)
  } catch (e) {
    // si no está el logo, seguimos sin romper
    logoImage = null
  }

  const addPage = () => {
    const page = pdf.addPage([600, 800])
    let y = 760
    const left = 50
    const text = (t, size = 12, color = rgb(0, 0, 0), x = left) => {
      page.drawText(String(t ?? ''), { x, y, size, font, color })
      y -= size + 6
    }
    const spacer = (h = 12) => { y -= h }
    const rule = () => {
      page.drawLine({
        start: { x: left, y: y + 8 },
        end: { x: 550, y: y + 8 },
        thickness: 1,
        color: rgb(0.85, 0.85, 0.85),
      })
      y -= 10
    }
    const ensure = (need = 80) => {
      if (y < need) return addPage()
      return { page, y, left, text, spacer, rule, ensure }
    }
    return { page, y, left, text, spacer, rule, ensure }
  }

  // ——— Portada
  let ctx = addPage()
  if (logoImage) {
    const w = 120
    const h = (logoImage.height / logoImage.width) * w
    ctx.page.drawImage(logoImage, { x: ctx.left, y: ctx.y - h + 20, width: w, height: h })
  }
  ctx.text('Informe de Cartera — CarterasAI', 20, rgb(0, 0, 0.6))
  const fecha = new Date().toLocaleString()
  ctx.text(Fecha: ${fecha}, 11, rgb(0.25, 0.25, 0.25))
  if (nombre) ctx.text(Usuario: ${nombre}, 11)
  ctx.spacer(8)
  ctx.rule()
  ctx.text(Perfil inversor detectado: ${perfil}, 14)
  if (volObjetivo) ctx.text(Volatilidad objetivo: ${volObjetivo}, 12)
  ctx.spacer(6)
  ctx.text('Resumen del enfoque', 14)
  ctx.text(explicacionPerfil(perfil), 12)

  // ——— Cartera sugerida (resumen)
  ctx.spacer(10)
  ctx.text('Cartera sugerida (resumen de asignaciones)', 14)
  const items = cartera.length ? cartera : []
  if (!items.length) ctx.text('No hay instrumentos para este perfil.', 12)
  items.forEach((it) => {
    ctx = ctx.ensure(40)
    ctx.text(• ${it.nombre} (${it.ticker}) — ${it.tipo} — ${pct(it.peso)})
  })

  // ——— Tabla detallada
  ctx = ctx.ensure(140)
  ctx.spacer(8)
  ctx.text('Detalle de instrumentos', 14)
  const headerY = ctx.y
  const drawAt = (txt, x, size = 12) =>
    ctx.page.drawText(String(txt ?? ''), { x, y: ctx.y, size, font, color: rgb(0, 0, 0) })
  // Cabecera
  drawAt('Instrumento', ctx.left)
  drawAt('Ticker', ctx.left + 280)
  drawAt('Tipo', ctx.left + 340)
  drawAt('Peso', ctx.left + 500)
  ctx.y -= 14
  ctx.page.drawLine({ start: { x: ctx.left, y: ctx.y + 8 }, end: { x: 550, y: ctx.y + 8 }, color: rgb(0.8, 0.8, 0.8), thickness: 1 })
  ctx.y -= 8
  // Filas
  items.forEach((it) => {
    ctx = ctx.ensure(40)
    drawAt(it.nombre, ctx.left)
    drawAt(it.ticker, ctx.left + 280)
    drawAt(it.tipo, ctx.left + 340)
    drawAt(pct(it.peso), ctx.left + 500)
    ctx.y -= 16
  })

  // ——— Próximos pasos (página nueva si hace falta)
  ctx = ctx.ensure(160)
  ctx.spacer(12)
  ctx.text('Próximos pasos', 14)
  ctx.text('1) Revisa la asignación y ajusta tu perfil si cambian tus objetivos o tu situación personal.', 12)
  ctx.text('2) Considera una revisión anual o ante cambios relevantes de mercado.', 12)
  ctx.text('3) Formación continua: consulta el área de Formación para comprender riesgos y métricas.', 12)
  ctx.spacer(12)
  ctx.text('Aviso', 12, rgb(0.4, 0, 0))
  ctx.text('Este informe es educativo y no constituye recomendación personalizada. Valora consultar a un asesor registrado.', 11, rgb(0.4, 0, 0))

  const bytes = await pdf.save()
  return new Blob([bytes], { type: 'application/pdf' })
}

// ======== Componente principal ========
export default function CarteraPersonalizada() {
  const location = useLocation()
  const navigate = useNavigate()
  const perfil = location.state?.perfil
  const email = location.state?.email
  const nombre = location.state?.nombre || ''

  const [emailSent, setEmailSent] = useState(false)
  const [sending, setSending] = useState(false)

  if (!perfil) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-4 bg-white shadow rounded text-center">
        <h2 className="text-xl font-bold mb-4">No se ha podido determinar tu perfil</h2>
        <p className="mb-4">Por favor, rellena el cuestionario para recibir tu cartera sugerida.</p>
        <Link to="/simulador" className="text-blue-600 underline">Volver al simulador</Link>
      </div>
    )
  }

  const cartera = obtenerCarteraDetallada(perfil)

  const handleDownloadPDF = async () => {
    const blob = await generarPDFExtenso({ nombre, perfil, volObjetivo: '', cartera })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = CarterasAI-informe-${perfil}.pdf
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSendEmail = async () => {
    if (!email) {
      alert('No hay email en el estado de navegación. Añade el campo email en el cuestionario.')
      return
    }
    try {
      setSending(true)
      const blob = await generarPDFExtenso({ nombre, perfil, volObjetivo: '', cartera })

      // Convertir a base64
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onloadend = async () => {
        const base64Pdf = reader.result.split(',')[1]

        await emailjs.send(
          EMAIL_SERVICE_ID,
          EMAIL_TEMPLATE_ID,
          {
            to_email: email,
            nombre_usuario: nombre,
            perfil_usuario: perfil,
            // por si tu plantilla usa 3 campos concretos:
            cartera_1: cartera[0]?.nombre || '',
            cartera_2: cartera[1]?.nombre || '',
            cartera_3: cartera[2]?.nombre || '',
            // y además un campo html con toda la cartera:
            cartera_html: `<ul>${cartera.map(i => <li>${i.nombre} (${i.ticker}) — ${i.tipo} — ${i.peso}%</li>).join('')}</ul>`,
            pdf_attachment: base64Pdf
          },
          EMAIL_PUBLIC_KEY
        )

        setEmailSent(true)
        setSending(false)
        setTimeout(() => navigate('/'), 5000)
      }
    } catch (e) {
      console.error(e)
      setSending(false)
      alert('Hubo un problema enviando el email.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 dark:text-gray-100 rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">
        Tu perfil inversor es: <span className="capitalize text-blue-600">{perfil}</span>
      </h2>

      <p className="text-gray-700 dark:text-gray-300 mb-4">
        {explicacionPerfil(perfil)}
      </p>

      <h3 className="text-lg font-semibold mb-2">Cartera sugerida (10 instrumentos):</h3>
      <ul className="list-disc ml-6 text-gray-800 dark:text-gray-200">
        {cartera.map((it, i) => (
          <li key={i}>
            <strong>{it.nombre}</strong> ({it.ticker}) — {it.tipo} — {pct(it.peso)}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleDownloadPDF}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Descargar informe PDF
        </button>

        <button
          onClick={handleSendEmail}
          disabled={sending}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {sending ? 'Enviando…' : 'Enviar por email'}
        </button>
      </div>

      {emailSent && (
        <p className="mt-3 text-green-600">
          Email enviado correctamente. En unos segundos volverás al inicio.
        </p>
      )}

      <div className="mt-6">
        <Link to="/" className="text-blue-600 underline">Volver al inicio</Link>
      </div>
    </div>
  )
}
