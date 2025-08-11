import React, { useMemo, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { SITE_NAME, LOGO_PATH } from '../constants/brand'

// -----------------------------
// Datos base (10 posiciones por perfil, ejemplo)
// -----------------------------
const CARTERAS = {
  conservador: [
    { name: 'Vanguard Global Aggregate Bond', ticker: 'VAGF', class: 'Renta Fija Global', region: 'Global', weight: 18, ter: 0.10, perf1: 2.3, perf3: 1.1, perf5: 1.5, desc: 'Bonos globales grado inversión.' },
    { name: 'iShares Euro Gov Bond 1-3yr',   ticker: 'IBGL', class: 'Renta Fija Gob. EUR', region: 'Europa', weight: 14, ter: 0.20, perf1: 1.0, perf3: 0.5, perf5: 0.8, desc: 'Deuda pública euro corto plazo.' },
    { name: 'Xtrackers EUR Corp Bond ESG',   ticker: 'XDCB', class: 'Renta Fija Corp. EUR', region: 'Europa', weight: 12, ter: 0.16, perf1: 2.1, perf3: 1.3, perf5: 1.7, desc: 'Bonos corporativos europeos ESG.' },
    { name: 'Amundi Cash EUR',               ticker: 'AECE', class: 'Monetario', region: 'EUR', weight: 10, ter: 0.14, perf1: 3.0, perf3: 1.2, perf5: 0.8, desc: 'Fondo monetario en euros.' },
    { name: 'iShares Global Inflation-Link', ticker: 'IGIL', class: 'Bonos ligados inflación', region: 'Global', weight: 10, ter: 0.25, perf1: 1.5, perf3: 1.0, perf5: 1.2, desc: 'Cobertura frente a inflación.' },
    { name: 'iShares MSCI World Min Vol',    ticker: 'MVOL', class: 'RV Global min vol', region: 'Global', weight: 10, ter: 0.30, perf1: 7.5, perf3: 5.0, perf5: 6.2, desc: 'Acciones de baja volatilidad.' },
    { name: 'Vanguard FTSE Developed Europe', ticker: 'VEVE', class: 'Renta Variable', region: 'Europa', weight: 8,  ter: 0.12, perf1: 9.1, perf3: 5.5, perf5: 7.0, desc: 'Acciones mercados desarrollados Europa.' },
    { name: 'Vanguard S&P 500',              ticker: 'VUSA', class: 'Renta Variable', region: 'USA', weight: 8,  ter: 0.07, perf1: 12.3, perf3: 9.8, perf5: 11.1, desc: 'Acciones grandes compañías USA.' },
    { name: 'iShares MSCI Japan',            ticker: 'IJP',  class: 'Renta Variable', region: 'Japón', weight: 5,  ter: 0.19, perf1: 6.8, perf3: 3.9, perf5: 5.1, desc: 'Acciones japonesas diversificadas.' },
    { name: 'Vanguard Global REIT',          ticker: 'VGRE', class: 'Inmobiliario', region: 'Global', weight: 5,  ter: 0.20, perf1: 4.2, perf3: 2.1, perf5: 3.5, desc: 'Socimis/REITs globales.' },
  ],
  moderado: [
    { name: 'iShares MSCI World',            ticker: 'IWRD', class: 'Renta Variable', region: 'Global', weight: 20, ter: 0.20, perf1: 12.2, perf3: 9.5, perf5: 10.8, desc: 'Acciones globales desarrolladas.' },
    { name: 'Vanguard S&P 500',              ticker: 'VUSA', class: 'Renta Variable', region: 'USA',    weight: 16, ter: 0.07, perf1: 12.3, perf3: 9.8, perf5: 11.1, desc: 'Grandes compañías estadounidenses.' },
    { name: 'Vanguard FTSE All-World ex-US', ticker: 'VEU',  class: 'Renta Variable', region: 'ex-USA', weight: 10, ter: 0.08, perf1: 8.4,  perf3: 5.7, perf5: 6.9,  desc: 'Acciones globales fuera de USA.' },
    { name: 'Vanguard Emerging Markets',     ticker: 'VFEM', class: 'Renta Variable', region: 'Emergentes', weight: 8, ter: 0.22, perf1: 6.1, perf3: 1.9, perf5: 3.7, desc: 'Acciones mercados emergentes.' },
    { name: 'Vanguard Global Aggregate Bond', ticker: 'VAGF', class: 'Renta Fija', region: 'Global', weight: 12, ter: 0.10, perf1: 2.3, perf3: 1.1, perf5: 1.5, desc: 'Bonos globales grado inversión.' },
    { name: 'Xtrackers EUR Corp Bond ESG',   ticker: 'XDCB', class: 'Renta Fija', region: 'Europa', weight: 10, ter: 0.16, perf1: 2.1, perf3: 1.3, perf5: 1.7, desc: 'Bonos corporativos europeos ESG.' },
    { name: 'iShares MSCI World Quality',    ticker: 'IWQU', class: 'Factor Quality', region: 'Global', weight: 8, ter: 0.30, perf1: 11.0, perf3: 8.1, perf5: 9.0, desc: 'Empresas con beneficios de calidad.' },
    { name: 'Vanguard Global Small-Cap',     ticker: 'VTWO', class: 'Small Caps', region: 'Global', weight: 6, ter: 0.10, perf1: 10.1, perf3: 6.1, perf5: 7.4, desc: 'Pequeñas compañías globales.' },
    { name: 'iShares Global Inflation-Link', ticker: 'IGIL', class: 'Bonos ligados inflación', region: 'Global', weight: 5, ter: 0.25, perf1: 1.5, perf3: 1.0, perf5: 1.2, desc: 'Cobertura frente a inflación.' },
    { name: 'Vanguard Global REIT',          ticker: 'VGRE', class: 'Inmobiliario', region: 'Global', weight: 5, ter: 0.20, perf1: 4.2, perf3: 2.1, perf5: 3.5, desc: 'Inmobiliario cotizado global.' },
  ],
  'dinámico': [
    { name: 'Vanguard S&P 500',              ticker: 'VUSA', class: 'Renta Variable', region: 'USA',    weight: 22, ter: 0.07, perf1: 12.3, perf3: 9.8, perf5: 11.1, desc: 'Grandes compañías USA.' },
    { name: 'iShares MSCI World',            ticker: 'IWRD', class: 'Renta Variable', region: 'Global', weight: 18, ter: 0.20, perf1: 12.2, perf3: 9.5, perf5: 10.8, desc: 'Acciones globales desarrolladas.' },
    { name: 'Vanguard FTSE All-World ex-US', ticker: 'VEU',  class: 'Renta Variable', region: 'ex-USA', weight: 10, ter: 0.08, perf1: 8.4,  perf3: 5.7, perf5: 6.9,  desc: 'Acciones globales fuera de USA.' },
    { name: 'Vanguard Emerging Markets',     ticker: 'VFEM', class: 'Renta Variable', region: 'Emergentes', weight: 10, ter: 0.22, perf1: 6.1, perf3: 1.9, perf5: 3.7, desc: 'Mercados emergentes.' },
    { name: 'Vanguard Global Small-Cap',     ticker: 'VTWO', class: 'Small Caps', region: 'Global', weight: 8, ter: 0.10, perf1: 10.1, perf3: 6.1, perf5: 7.4, desc: 'Pequeñas compañías globales.' },
    { name: 'iShares NASDAQ 100',            ticker: 'CNDX', class: 'Tecnología USA', region: 'USA',  weight: 8, ter: 0.20, perf1: 15.5, perf3: 12.9, perf5: 14.6, desc: 'Grandes tecnológicas USA.' },
    { name: 'iShares MSCI World Quality',    ticker: 'IWQU', class: 'Factor Quality', region: 'Global', weight: 6, ter: 0.30, perf1: 11.0, perf3: 8.1, perf5: 9.0, desc: 'Empresas de calidad.' },
    { name: 'Vanguard Global REIT',          ticker: 'VGRE', class: 'Inmobiliario', region: 'Global', weight: 6, ter: 0.20, perf1: 4.2, perf3: 2.1, perf5: 3.5, desc: 'REITs globales diversificados.' },
    { name: 'Vanguard Global Aggregate Bond', ticker: 'VAGF', class: 'Renta Fija', region: 'Global', weight: 6, ter: 0.10, perf1: 2.3, perf3: 1.1, perf5: 1.5, desc: 'Bonos globales grado inversión.' },
    { name: 'Xtrackers EUR Corp Bond ESG',   ticker: 'XDCB', class: 'Renta Fija', region: 'Europa', weight: 6, ter: 0.16, perf1: 2.1, perf3: 1.3, perf5: 1.7, desc: 'Bonos corporativos europeos ESG.' },
  ],
}

// -----------------------------
// Helpers
// -----------------------------
const pct = (n) => `${Number(n).toFixed(0)}%`

async function fetchImageAsBytes(url) {
  const res = await fetch(url)
  const ab = await res.arrayBuffer()
  return new Uint8Array(ab)
}

function buildPieChartUrl(allocs) {
  const labels = allocs.map(a => a.ticker)
  const data = allocs.map(a => a.weight)
  const cfg = {
    type: 'pie',
    data: { labels, datasets: [{ data }] },
    options: { plugins: { legend: { position: 'bottom' } } }
  }
  return `https://quickchart.io/chart?width=600&height=350&c=${encodeURIComponent(JSON.stringify(cfg))}`
}

function buildPerfChartUrl(seriesLabel = 'Cartera', benchLabel = 'Benchmark') {
  // Serie ficticia (puedes sustituir por datos reales más adelante)
  const labels = Array.from({ length: 24 }, (_, i) => `M${i + 1}`)
  const cartera = labels.map((_, i) => 100 * Math.pow(1.006, i)) // +0.6%/mes aproximado
  const bench = labels.map((_, i) => 100 * Math.pow(1.005, i))   // +0.5%/mes aproximado
  const cfg = {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: seriesLabel, data: cartera, fill: false, borderWidth: 2 },
        { label: benchLabel, data: bench, fill: false, borderWidth: 2 }
      ]
    },
    options: {
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { ticks: { callback: (v) => v.toFixed ? v.toFixed(0) : v } } }
    }
  }
  return `https://quickchart.io/chart?width=700&height=350&c=${encodeURIComponent(JSON.stringify(cfg))}`
}

// -----------------------------
// PDF
// -----------------------------
async function generarPDF({ perfil, nombre, volObjetivo }) {
  const cartera = CARTERAS[perfil] || []
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const M = { l: 50, r: 50, t: 60, b: 60 } // márgenes
  const pageSize = [595.28, 841.89] // A4 en puntos
  const colorTitle = rgb(0.12, 0.2, 0.45)
  const colorText = rgb(0.12, 0.12, 0.12)

  // Utilidad de escritura
  function addPage() {
    const p = pdfDoc.addPage(pageSize)
    let y = pageSize[1] - M.t
    const move = (dy) => (y -= dy)
    const text = (t, size = 11, bold = false) => {
      const f = bold ? fontBold : font
      page.drawText(String(t), { x: M.l, y, size, font: f, color: colorText })
    }
    const rule = () => page.drawLine({ start: { x: M.l, y }, end: { x: pageSize[0] - M.r, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })
    const page = p
    return { page, yRef: () => y, move, text, rule }
  }

  // Portada
  {
    const { page, move, text } = addPage()

    // Logo
    try {
      if (LOGO_PATH) {
        const bytes = await fetchImageAsBytes(LOGO_PATH)
        const img = await pdfDoc.embedPng(bytes)
        const w = 140
        const h = (img.height / img.width) * w
        page.drawImage(img, { x: M.l, y: pageSize[1] - M.t - h, width: w, height: h })
      }
    } catch {}

    move(160)
    page.drawText(`${SITE_NAME}`, { x: M.l, y: pageSize[1] - 250, size: 22, font: fontBold, color: colorTitle })
    move(70)
    text('Informe Personalizado de Inversión', 18, true)
    move(24)
    text(`Perfil inversor: ${perfil}`, 13)
    move(16)
    if (nombre) text(`Cliente: ${nombre}`, 12)
    move(14)
    text(`Fecha: ${new Date().toLocaleString()}`, 11)
  }

  // Resumen del perfil
  {
    const { move, text, rule } = addPage()
    text('Resumen del perfil', 16, true)
    move(10); rule(); move(20)

    text('Cómo interpretamos tu perfil:', 12, true); move(16)
    text('- Tu tolerancia al riesgo y horizonte estimado determinan el peso en renta variable y renta fija.')
    move(14)
    text('- La cartera equilibra diversificación geográfica, sectorial y por clases de activo.')
    move(14)
    const vol = volObjetivo || (perfil === 'conservador' ? '0–5%' : perfil === 'moderado' ? '5–10%' : '10–15%')
    text(`Volatilidad objetivo: ${vol}`)
    move(22)

    text('Cartera propuesta (asignación):', 12, true); move(14)
    const total = CARTERAS[perfil]?.reduce((s, a) => s + a.weight, 0) || 0
    CARTERAS[perfil]?.forEach(a => {
      text(`• ${a.ticker}  ${a.name} — ${pct(a.weight)}  | ${a.class}  | ${a.region}`)
      move(12)
    })
    if (total && total !== 100) {
      move(8)
      text(`Nota: las ponderaciones suman ${total}%. Se reescalarán a 100% a la ejecución.`, 10)
    }
  }

  // Gráfico de asignación + tabla con métricas
  {
    const { page, move, text, rule } = addPage()
    text('Asignación y métricas', 16, true)
    move(10); rule(); move(18)

    // Pie chart (QuickChart)
    try {
      const pieUrl = buildPieChartUrl(CARTERAS[perfil])
      const pieBytes = await fetchImageAsBytes(pieUrl)
      const pieImg = await pdfDoc.embedPng(pieBytes)
      page.drawImage(pieImg, { x: M.l, y: page.getHeight() - 300, width: 250, height: 145 })
    } catch {}

    // Tabla a la derecha
    const startX = M.l + 270
    let y = page.getHeight() - 170
    const headers = ['Ticker', 'Clase', 'Región', 'Peso', 'TER', '1Y', '3Y', '5Y']
    const colW = [60, 80, 60, 40, 35, 35, 35, 35]

    page.drawText('Cartera (top 10):', { x: startX, y: y + 18, size: 12, font: fontBold, color: colorText })

    headers.reduce((x, h, i) => {
      page.drawText(h, { x, y, size: 9, font: fontBold, color: colorText })
      return x + colW[i]
    }, startX)
    y -= 12
    page.drawLine({ start: { x: startX, y }, end: { x: startX + colW.reduce((a, b) => a + b, 0), y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
    y -= 10

    CARTERAS[perfil].forEach(a => {
      const row = [a.ticker, a.class, a.region, pct(a.weight), `${a.ter.toFixed(2)}%`, `${a.perf1.toFixed(1)}%`, `${a.perf3.toFixed(1)}%`, `${a.perf5.toFixed(1)}%`]
      row.reduce((x, val, i) => {
        page.drawText(String(val), { x, y, size: 9, font, color: colorText })
        return x + colW[i]
      }, startX)
      y -= 12
    })
  }

  // Evolución histórica vs. benchmark
  {
    const { page, move, text, rule } = addPage()
    text('Evolución histórica (simulada)', 16, true)
    move(10); rule(); move(16)
    text('Comparativa cartera vs. benchmark global a 24 meses (curvas simuladas a modo ilustrativo).')
    move(10)

    try {
      const lineUrl = buildPerfChartUrl('Cartera', 'MSCI World')
      const lineBytes = await fetchImageAsBytes(lineUrl)
      const lineImg = await pdfDoc.embedPng(lineBytes)
      page.drawImage(lineImg, { x: M.l, y: page.getHeight() - 400, width: page.getWidth() - M.l - M.r, height: 220 })
    } catch {}

    move(240)
    text('Advertencia: Rentabilidades pasadas no garantizan resultados futuros. Este gráfico es orientativo.', 10)
  }

  // Recomendaciones y notas legales
  {
    const { move, text, rule } = addPage()
    text('Recomendaciones y notas', 16, true)
    move(10); rule(); move(18)
    text('• Rebalanceo sugerido: revisar cada 6–12 meses o si una clase de activo se desvía más de 5 puntos porcentuales.')
    move(12)
    text('• Aportaciones periódicas: mensual o trimestral, para suavizar el timing de entrada.')
    move(12)
    text('• Diversificación: combina regiones, sectores y clases de activo para reducir riesgo específico.')
    move(18)
    text('Nota legal:', 12, true); move(12)
    text(`${SITE_NAME} es una herramienta informativa y educativa. No constituye recomendación de inversión personalizada.`, 10)
    move(12)
    text('Antes de invertir, considera tu situación personal y normativa fiscal. Consulta a un asesor financiero registrado.', 10)
  }

  // Output
  return await pdfDoc.save()
}

// -----------------------------
// Componente principal
// -----------------------------
export default function CarteraPersonalizada() {
  const { state } = useLocation()
  const perfil = state?.perfil
  const nombre = state?.nombre || ''
  const volObjetivo = state?.volObjetivo || ''

  const [downloading, setDownloading] = useState(false)

  const cartera = useMemo(() => CARTERAS[perfil] || [], [perfil])

  if (!perfil) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-4 bg-white shadow rounded text-center">
        <h2 className="text-xl font-bold mb-4">No se ha podido determinar tu perfil</h2>
        <p className="mb-4">Rellena el cuestionario para obtener tu informe de inversión.</p>
        <Link to="/simulador" className="text-blue-600 underline">Volver al simulador</Link>
      </div>
    )
  }

  const handleDownload = async () => {
    try {
      setDownloading(true)
      const bytes = await generarPDF({ perfil, nombre, volObjetivo })
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Informe-${SITE_NAME}-${perfil}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert('No se pudo generar el PDF. Vuelve a intentarlo.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-soft">
      <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
        Tu perfil inversor: <span className="capitalize text-blue-600">{perfil}</span>
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Volatilidad objetivo: <strong>{volObjetivo || (perfil === 'conservador' ? '0–5%' : perfil === 'moderado' ? '5–10%' : '10–15%')}</strong>
      </p>

      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Cartera sugerida (10 posiciones)</h3>
      <ul className="list-disc ml-6 text-gray-800 dark:text-gray-200 mb-6">
        {cartera.map((a, i) => (
          <li key={i}>
            <span className="font-medium">{a.ticker}</span> — {a.name} · {a.class} · {a.region} · {pct(a.weight)}
          </li>
        ))}
      </ul>

      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {downloading ? 'Generando PDF…' : 'Descargar informe PDF'}
        </button>
        <Link to="/" className="text-blue-600 underline self-center">Volver al inicio</Link>
      </div>
    </div>
  )
}
