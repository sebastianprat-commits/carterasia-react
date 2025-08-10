
import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import emailjs from '@emailjs/browser'

// ---------- Cartera 10 posiciones con pesos y metadatos (educativo) ----------
function cartera10(perfil) {
  // Pesos por perfil (suman 100)
  const presets = {
    conservador: [25,20,20,10,8,7,5,3,1,1],
    moderado:    [18,16,16,12,10,8,8,6,4,2],
    dinamico:    [12,12,12,11,10,10,8,8,9,8], // algo más concentrado en RV
  }
  const w = presets[perfil] || presets.moderado

  // Universo ejemplo (ETF/fondos globales)
  const base = [
    { ticker:'IWDA',  nombre:'iShares MSCI World UCITS ETF', tipo:'ETF RV Global', region:'Desarrollados', ter:0.20, nota:'Núcleo de renta variable global' },
    { ticker:'EIMI',  nombre:'iShares Core MSCI EM IMI UCITS ETF', tipo:'ETF RV Emergentes', region:'Emergentes', ter:0.18, nota:'Diversifica hacia emergentes' },
    { ticker:'ESPO',  nombre:'VanEck Video Gaming & eSports', tipo:'ETF Temático', region:'Global', ter:0.55, nota:'Temática crecimiento (ej.)' },
    { ticker:'EUNA',  nombre:'iShares Core € Govt Bond UCITS', tipo:'ETF RF Soberana EUR', region:'EUR', ter:0.20, nota:'Columna defensiva en EUR' },
    { ticker:'VUKE',  nombre:'Vanguard FTSE 100 UCITS ETF', tipo:'ETF RV UK', region:'UK', ter:0.09, nota:'Exposición a UK' },
    { ticker:'CSPX',  nombre:'iShares Core S&P 500 UCITS', tipo:'ETF RV USA', region:'USA', ter:0.07, nota:'Exposición USA eficiente' },
    { ticker:'AGGH',  nombre:'iShares Core Global Aggregate Bond', tipo:'ETF RF Global', region:'Global', ter:0.10, nota:'Bonos globales agregados' },
    { ticker:'EMAG',  nombre:'iShares J.P. Morgan $ EM Bond', tipo:'ETF RF EM USD', region:'Emergentes', ter:0.25, nota:'Bonos emergentes (USD)' },
    { ticker:'GLD',   nombre:'SPDR Gold Trust (proxy)', tipo:'Oro', region:'Global', ter:0.40, nota:'Cobertura e inflación' },
    { ticker:'CASH',  nombre:'Amundi Cash EUR', tipo:'Monetario', region:'EUR', ter:0.10, nota:'Liquidez táctica' },
  ]

  // Ajuste por perfil hacia RF/RV (simple)
  const tilt = perfil === 'conservador' ? [0.8,0.6,0.3,1.3,0.7,0.7,1.2,1.1,0.8,1.3]
            : perfil === 'dinamico'     ? [1.2,1.2,1.3,0.6,1.0,1.2,0.8,0.8,1.0,0.4]
            : [1,1,1,1,1,1,1,1,1,1]

  let total = 0
  const items = base.map((b,i) => {
    const peso = Math.max(0, Math.round(w[i] * tilt[i]))
    total += peso
    return { ...b, peso }
  })
  // Normalizar a 100
  return items.map(it => ({ ...it, peso: Math.round((it.peso/total)*100) }))
}

// ---------- Gráficos simples (barras / línea) en pdf-lib ----------
function drawBarChart(page, { x=50, y=260, width=500, height=140, data=[] }) {
  const max = Math.max(...data.map(d=>d.value), 1)
  const barW = width / data.length
  data.forEach((d,i) => {
    const h = (d.value / max) * height
    page.drawRectangle({
      x: x + i*barW + 4,
      y,
      width: barW - 8,
      height: h,
      color: rgb(0.16, 0.44, 0.78)
    })
  })
}

function drawLineChart(page, { x=50, y=260, width=500, height=140, series=[] }) {
  // series: [{name, values:[...] , color: rgb()}]
  const max = Math.max(...series.flatMap(s=>s.values))
  const min = Math.min(...series.flatMap(s=>s.values))
  const n = Math.max(...series.map(s=>s.values.length))
  const dx = width / (n-1 || 1)

  series.forEach(s => {
    let prev = null
    s.values.forEach((v, i) => {
      const px = x + i*dx
      const py = y + ((v - min) / (max - min || 1)) * height
      if (prev) {
        page.drawLine({ start: prev, end: {x:px,y:py}, thickness: 1.2, color: s.color })
      }
      prev = { x:px, y:py }
    })
  })
}

// ---------- Texto multi-línea ----------
function drawTextBlock(page, text, { x, y, width=500, font, size=11, leading=14 }) {
  const words = text.split(/\s+/)
  let line = ''
  let yy = y
  words.forEach((w, idx) => {
    const test = line ? (line + ' ' + w) : w
    const testWidth = font.widthOfTextAtSize(test, size)
    if (testWidth > width) {
      page.drawText(line, { x, y: yy, size, font, color: rgb(0,0,0) })
      yy -= leading
      line = w
    } else {
      line = test
    }
    if (idx === words.length - 1) {
      page.drawText(line, { x, y: yy, size, font, color: rgb(0,0,0) })
    }
  })
}

// ---------- PDF largo y con secciones ----------
async function generarPDFCompleto({ nombre, perfil, volObjetivo }) {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontB = await pdf.embedFont(StandardFonts.HelveticaBold)

  const cartera = cartera10(perfil)
  const pesos = cartera.map(c => ({ label: c.ticker, value: c.peso }))

  // Página 1: Portada / Resumen
  {
    const p = pdf.addPage([595, 842]) // A4
    p.drawText('Informe personalizado', { x: 50, y: 790, size: 20, font: fontB })
    p.drawText(`Nombre: ${nombre || '-'}`, { x: 50, y: 760, size: 12, font })
    p.drawText(`Perfil inversor: ${perfil}`, { x: 50, y: 740, size: 12, font })
    p.drawText(`Objetivo de volatilidad: ${volObjetivo}`, { x: 50, y: 720, size: 12, font })

    p.drawText('Cartera sugerida (10 posiciones):', { x: 50, y: 690, size: 13, font: fontB })
    cartera.slice(0,6).forEach((c,i) => {
      p.drawText(`${String(c.peso).padStart(2," ")}%  ${c.ticker}  ${c.nombre}`, { x: 60, y: 665 - i*16, size: 11, font })
    })
    cartera.slice(6).forEach((c,i) => {
      p.drawText(`${String(c.peso).padStart(2," ")}%  ${c.ticker}  ${c.nombre}`, { x: 320, y: 665 - i*16, size: 11, font })
    })

    // Barras de pesos
    p.drawText('Distribución por pesos', { x: 50, y: 300, size: 12, font: fontB })
    drawBarChart(p, { x: 50, y: 150, width: 495, height: 130, data: pesos })
    // Ejes simples
    p.drawLine({ start:{x:50,y:150}, end:{x:545,y:150}, thickness:0.5, color: rgb(0,0,0)})
    p.drawLine({ start:{x:50,y:150}, end:{x:50,y:280}, thickness:0.5, color: rgb(0,0,0)})

    // Disclaimer
    drawTextBlock(p,
      'Este informe es de carácter educativo. No constituye recomendación de inversión personalizada. ' +
      'Los pesos y activos son ilustrativos y pueden no ajustarse a tu situación fiscal o patrimonial. ' +
      'Para una propuesta a medida, considera una sesión de asesoría.',
      { x:50, y:100, width:495, font, size:10, leading:13 })
  }

  // Página 2: Metodología y explicación del perfil
  {
    const p = pdf.addPage([595, 842])
    p.drawText('Metodología y perfil', { x: 50, y: 790, size: 16, font: fontB })

    const texto =
      `Tu perfil (“${perfil}”) se estima a partir de tu edad, horizonte temporal, experiencia y tolerancia a pérdidas, ` +
      `además de tu objetivo (conservar, batir inflación, crecimiento...). El rango de volatilidad objetivo es ${volObjetivo}. ` +
      `La cartera combina renta variable global (núcleo desarrollado + emergentes), renta fija agregada y soberana en EUR, ` +
      `exposición temática y activos de cobertura (oro y monetario). La asignación busca diversificar por región, factor y clase de activo.`
    drawTextBlock(p, texto, { x: 50, y: 750, width: 495, font, size: 12, leading: 16 })

    p.drawText('Evolución simulada (educativa):', { x: 50, y: 500, size: 12, font: fontB })
    // Serie sintética: benchmark vs cartera (normalizada 100 = inicio)
    const carteraSeries = [100, 101, 99, 102, 104, 103, 106, 108, 107, 110, 112, 115]
    const benchSeries   = [100, 101, 100, 101, 102, 101, 103, 104, 104, 105, 106, 107]
    drawLineChart(p, {
      x:50, y:300, width: 495, height: 160,
      series: [
        { name:'Cartera', values: carteraSeries, color: rgb(0.16, 0.44, 0.78) },
        { name:'Benchmark', values: benchSeries, color: rgb(0.10, 0.7, 0.4) },
      ]
    })
    p.drawText('100 → 115 (cartera sim.)', { x: 50, y: 280, size: 10, font })
    p.drawText('100 → 107 (benchmark sim.)', { x: 180, y: 280, size: 10, font })
  }

  // Página 3: Detalle de posiciones
  {
    const p = pdf.addPage([595, 842])
    p.drawText('Detalle de posiciones', { x: 50, y: 790, size: 16, font: fontB })

    let yy = 760
    cartera.forEach((c, i) => {
      p.drawText(`${i+1}. ${c.ticker} – ${c.nombre}`, { x: 50, y: yy, size: 12, font: fontB })
      p.drawText(`${c.tipo} | Región: ${c.region} | TER: ${c.ter.toFixed(2)}% | Peso: ${c.peso}%`, { x: 50, y: yy-14, size: 11, font })
      drawTextBlock(p, `Razonamiento: ${c.nota}.`, { x: 50, y: yy-30, width: 495, font, size: 11, leading: 14 })
      yy -= 58
      if (yy < 80) {
        // nueva página si no cabe
        yy = 760
        p = pdf.addPage([595,842])
        p.drawText('Detalle de posiciones (cont.)', { x: 50, y: 790, size: 16, font: fontB })
      }
    })
  }

  const bytes = await pdf.save()
  return new Blob([bytes], { type: 'application/pdf' })
}

// ---------- Componente original con nuevos textos PDF ----------
const obtenerCarteraBasica = (perfil) => {
  // mantenemos compat con tu UI de lista simple (3 líneas)
  const full = cartera10(perfil)
  return full.slice(0,3).map(c => `${c.ticker} — ${c.nombre}`)
}

export default function CarteraPersonalizada() {
  const location = useLocation()
  const navigate = useNavigate()
  const perfil = location.state?.perfil
  const email = location.state?.email
  const nombre = location.state?.nombre
  const volObjetivo = location.state?.volObjetivo

  const [emailSent, setEmailSent] = useState(false)

  if (!perfil) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-4 bg-white dark:bg-gray-900 shadow rounded text-center">
        <h2 className="text-xl font-bold mb-4">No se ha podido determinar tu perfil</h2>
        <Link to="/simulador" className="text-blue-600 underline">Volver al simulador</Link>
      </div>
    )
  }

  const cartera = obtenerCarteraBasica(perfil)

  const handleDownloadPDF = async () => {
    const blob = await generarPDFCompleto({ nombre, perfil, volObjetivo })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CarterasAI_informe_${perfil}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleEmailSend = async () => {
    try {
      setEmailSent(false)
      const blob = await generarPDFCompleto({ nombre, perfil, volObjetivo })
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onloadend = async () => {
        const base64Pdf = String(reader.result).split(',')[1] || ''
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
        setEmailSent(true)
        setTimeout(()=>navigate('/'), 5000)
      }
    } catch (e) {
      console.error(e)
      alert('No se pudo enviar el email.')
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 bg-white dark:bg-gray-900 shadow rounded">
      <h2 className="text-xl font-bold mb-2">
        Tu perfil inversor es: <span className="capitalize text-blue-600">{perfil}</span>
      </h2>
      {volObjetivo && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Objetivo de volatilidad: <strong>{volObjetivo}</strong>
        </p>
      )}

      <h3 className="text-lg font-semibold mb-2">Cartera sugerida (resumen):</h3>
      <ul className="list-disc ml-6 text-gray-800 dark:text-gray-100">
        {cartera.map((activo, i) => <li key={i}>{activo}</li>)}
      </ul>

      <div className="mt-6 flex flex-col gap-3">
        {emailSent
          ? <p className="text-green-600">Email enviado correctamente. Redirigiendo…</p>
          : <>
              <button onClick={handleDownloadPDF} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">
                Descargar informe completo (PDF)
              </button>
              {email && (
                <button onClick={handleEmailSend} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Enviar por email
                </button>
              )}
            </>
        }
        <Link to="/" className="text-blue-600 underline text-center">Volver al inicio</Link>
      </div>
    </div>
  )
}