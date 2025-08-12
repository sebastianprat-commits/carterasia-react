import React, { useMemo, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { SITE_NAME, LOGO_PATH } from '../constants/brand'
import { db, storage } from '../firebaseConfig'
import { doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// ========= Cartera base (10 posiciones por perfil; ejemplo) =========
const CARTERAS = {
  conservador: [
    { name: 'Vanguard Global Aggregate Bond', ticker: 'VAGF', class: 'Renta Fija Global', region: 'Global', weight: 18, ter: 0.10, perf1: 2.3, perf3: 1.1, perf5: 1.5, desc: 'Bonos globales grado inversión.' },
    { name: 'iShares Euro Gov Bond 1-3yr',   ticker: 'IBGL', class: 'Renta Fija Gob. EUR', region: 'Europa', weight: 14, ter: 0.20, perf1: 1.0, perf3: 0.5, perf5: 0.8, desc: 'Deuda pública euro corto plazo.' },
    { name: 'Xtrackers EUR Corp Bond ESG',   ticker: 'XDCB', class: 'Renta Fija Corp. EUR', region: 'Europa', weight: 12, ter: 0.16, perf1: 2.1, perf3: 1.3, perf5: 1.7, desc: 'Bonos corporativos europeos ESG.' },
    { name: 'Amundi Cash EUR',               ticker: 'AECE', class: 'Monetario', region: 'EUR', weight: 10, ter: 0.14, perf1: 3.0, perf3: 1.2, perf5: 0.8, desc: 'Fondo monetario en euros.' },
    { name: 'iShares Global Inflation-Link', ticker: 'IGIL', class: 'Bonos ligados infl.', region: 'Global', weight: 10, ter: 0.25, perf1: 1.5, perf3: 1.0, perf5: 1.2, desc: 'Cobertura frente a inflación.' },
    { name: 'iShares MSCI World Min Vol',    ticker: 'MVOL', class: 'RV Global baja vol.', region: 'Global', weight: 10, ter: 0.30, perf1: 7.5, perf3: 5.0, perf5: 6.2, desc: 'Acciones de baja volatilidad.' },
    { name: 'Vanguard FTSE Developed Europe', ticker: 'VEVE', class: 'Renta Variable', region: 'Europa', weight: 8,  ter: 0.12, perf1: 9.1, perf3: 5.5, perf5: 7.0, desc: 'Desarrollados Europa.' },
    { name: 'Vanguard S&P 500',              ticker: 'VUSA', class: 'Renta Variable', region: 'USA',    weight: 8,  ter: 0.07, perf1: 12.3, perf3: 9.8, perf5: 11.1, desc: 'Grandes compañías USA.' },
    { name: 'iShares MSCI Japan',            ticker: 'IJP',  class: 'Renta Variable', region: 'Japón',  weight: 5,  ter: 0.19, perf1: 6.8, perf3: 3.9, perf5: 5.1, desc: 'Acciones Japón.' },
    { name: 'Vanguard Global REIT',          ticker: 'VGRE', class: 'Inmobiliario', region: 'Global',   weight: 5,  ter: 0.20, perf1: 4.2, perf3: 2.1, perf5: 3.5, desc: 'REITs globales.' },
  ],
  moderado: [
    { name: 'iShares MSCI World',            ticker: 'IWRD', class: 'Renta Variable', region: 'Global', weight: 20, ter: 0.20, perf1: 12.2, perf3: 9.5, perf5: 10.8, desc: 'Acciones globales desarrolladas.' },
    { name: 'Vanguard S&P 500',              ticker: 'VUSA', class: 'Renta Variable', region: 'USA',    weight: 16, ter: 0.07, perf1: 12.3, perf3: 9.8, perf5: 11.1, desc: 'Grandes compañías USA.' },
    { name: 'Vanguard FTSE All-World ex-US', ticker: 'VEU',  class: 'Renta Variable', region: 'ex-USA', weight: 10, ter: 0.08, perf1: 8.4,  perf3: 5.7, perf5: 6.9,  desc: 'Acciones fuera de USA.' },
    { name: 'Vanguard Emerging Markets',     ticker: 'VFEM', class: 'Renta Variable', region: 'Emergentes', weight: 8, ter: 0.22, perf1: 6.1, perf3: 1.9, perf5: 3.7, desc: 'Mercados emergentes.' },
    { name: 'Vanguard Global Aggregate Bond', ticker: 'VAGF', class: 'Renta Fija', region: 'Global', weight: 12, ter: 0.10, perf1: 2.3, perf3: 1.1, perf5: 1.5, desc: 'Bonos globales.' },
    { name: 'Xtrackers EUR Corp Bond ESG',   ticker: 'XDCB', class: 'Renta Fija', region: 'Europa', weight: 10, ter: 0.16, perf1: 2.1, perf3: 1.3, perf5: 1.7, desc: 'Bonos corp. europeos ESG.' },
    { name: 'iShares MSCI World Quality',    ticker: 'IWQU', class: 'Factor Quality', region: 'Global', weight: 8, ter: 0.30, perf1: 11.0, perf3: 8.1, perf5: 9.0, desc: 'Empresas de calidad.' },
    { name: 'Vanguard Global Small-Cap',     ticker: 'VTWO', class: 'Small Caps', region: 'Global', weight: 6, ter: 0.10, perf1: 10.1, perf3: 6.1, perf5: 7.4, desc: 'Pequeñas compañías globales.' },
    { name: 'iShares Global Inflation-Link', ticker: 'IGIL', class: 'Bonos ligados infl.', region: 'Global', weight: 5, ter: 0.25, perf1: 1.5, perf3: 1.0, perf5: 1.2, desc: 'Cobertura inflación.' },
    { name: 'Vanguard Global REIT',          ticker: 'VGRE', class: 'Inmobiliario', region: 'Global', weight: 5, ter: 0.20, perf1: 4.2, perf3: 2.1, perf5: 3.5, desc: 'REITs globales.' },
  ],
  'dinámico': [
    { name: 'Vanguard S&P 500',              ticker: 'VUSA', class: 'Renta Variable', region: 'USA',    weight: 22, ter: 0.07, perf1: 12.3, perf3: 9.8, perf5: 11.1, desc: 'Grandes compañías USA.' },
    { name: 'iShares MSCI World',            ticker: 'IWRD', class: 'Renta Variable', region: 'Global', weight: 18, ter: 0.20, perf1: 12.2, perf3: 9.5, perf5: 10.8, desc: 'Acciones globales desarr.' },
    { name: 'Vanguard FTSE All-World ex-US', ticker: 'VEU',  class: 'Renta Variable', region: 'ex-USA', weight: 10, ter: 0.08, perf1: 8.4,  perf3: 5.7, perf5: 6.9,  desc: 'Acciones fuera de USA.' },
    { name: 'Vanguard Emerging Markets',     ticker: 'VFEM', class: 'Renta Variable', region: 'Emergentes', weight: 10, ter: 0.22, perf1: 6.1, perf3: 1.9, perf5: 3.7, desc: 'Mercados emergentes.' },
    { name: 'Vanguard Global Small-Cap',     ticker: 'VTWO', class: 'Small Caps', region: 'Global', weight: 8, ter: 0.10, perf1: 10.1, perf3: 6.1, perf5: 7.4, desc: 'Small caps globales.' },
    { name: 'iShares NASDAQ 100',            ticker: 'CNDX', class: 'Tecnología USA', region: 'USA',  weight: 8, ter: 0.20, perf1: 15.5, perf3: 12.9, perf5: 14.6, desc: 'Grandes tecnológicas.' },
    { name: 'iShares MSCI World Quality',    ticker: 'IWQU', class: 'Factor Quality', region: 'Global', weight: 6, ter: 0.30, perf1: 11.0, perf3: 8.1, perf5: 9.0, desc: 'Empresas de calidad.' },
    { name: 'Vanguard Global REIT',          ticker: 'VGRE', class: 'Inmobiliario', region: 'Global', weight: 6, ter: 0.20, perf1: 4.2, perf3: 2.1, perf5: 3.5, desc: 'REITs globales.' },
    { name: 'Vanguard Global Aggregate Bond', ticker: 'VAGF', class: 'Renta Fija', region: 'Global', weight: 6, ter: 0.10, perf1: 2.3, perf3: 1.1, perf5: 1.5, desc: 'Bonos globales grado inv.' },
    { name: 'Xtrackers EUR Corp Bond ESG',   ticker: 'XDCB', class: 'Renta Fija', region: 'Europa', weight: 6, ter: 0.16, perf1: 2.1, perf3: 1.3, perf5: 1.7, desc: 'Bonos corporativos ESG.' },
  ],
}

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
  const labels = Array.from({ length: 24 }, (_, i) => `M${i + 1}`)
  const cartera = labels.map((_, i) => 100 * Math.pow(1.006, i))
  const bench = labels.map((_, i) => 100 * Math.pow(1.005, i))
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
      scales: { y: { ticks: { callback: (v) => (v.toFixed ? v.toFixed(0) : v) } } }
    }
  }
  return `https://quickchart.io/chart?width=700&height=350&c=${encodeURIComponent(JSON.stringify(cfg))}`
}

// ------- Texto de explicación en función de respuestas -------
function explicarPerfil(formData, perfil, volObjetivo) {
  const trozos = []
  if (formData?.edad) trozos.push(`Edad: ${formData.edad}.`)
  if (formData?.horizonte) {
    const mapH = { lt1: 'menos de 1 año', y1_3: '1–3 años', y3_5: '3–5 años', y5_10: '5–10 años', gt10: 'más de 10 años' }
    trozos.push(`Horizonte temporal: ${mapH[formData.horizonte] || formData.horizonte}.`)
  }
  if (formData?.objetivo) {
    const mapO = { conservar: 'conservar capital', batir_inflacion: 'batir la inflación', crecimiento: 'crecimiento del capital', agresivo: 'crecimiento agresivo' }
    trozos.push(`Objetivo principal: ${mapO[formData.objetivo] || formData.objetivo}.`)
  }
  if (formData?.experiencia) trozos.push(`Experiencia inversora: ${formData.experiencia}.`)
  if (formData?.conocimiento) trozos.push(`Conocimiento financiero: ${formData.conocimiento}.`)
  if (formData?.tolerancia) {
    const mapT = { p5: 'caídas de ~5%', p10: '~10%', p20: '~20%', p30: '~30% o más' }
    trozos.push(`Tolerancia a caídas: ${mapT[formData.tolerancia] || formData.tolerancia}.`)
  }

  const intro = `Tu perfil se clasifica como "${perfil}" con una volatilidad objetivo ${volObjetivo || '(estimada)'} en función de tus respuestas.`
  const enfoq = perfil === 'conservador'
    ? 'Priorizamos estabilidad con mayor peso en renta fija de calidad y algo de renta variable global de baja volatilidad.'
    : perfil === 'moderado'
    ? 'Buscamos equilibrio entre crecimiento y control del riesgo, combinando renta variable global y renta fija diversificada.'
    : 'Priorizamos crecimiento a largo plazo con mayor peso en renta variable global y factores de calidad/tecnología, manteniendo un núcleo de renta fija para amortiguar caídas.'
  return [intro, enfoq, trozos.join(' ')].filter(Boolean).join(' ')
}

// ------- Generación del PDF (multi-sección) -------
async function generarPDF({ perfil, nombre, volObjetivo, formData }) {
  const cartera = CARTERAS[perfil] || []
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const pageSize = [595.28, 841.89] // A4
  const M = { l: 50, r: 50, t: 60, b: 60 }
  const colorTitle = rgb(0.12, 0.2, 0.45)
  const colorText = rgb(0.12, 0.12, 0.12)

  const addPage = () => {
    const p = pdfDoc.addPage(pageSize)
    let y = pageSize[1] - M.t
    const drawText = (t, size = 11, b = false, x = M.l) => {
      p.drawText(String(t), { x, y, size, font: b ? bold : font, color: colorText })
    }
    const line = () => p.drawLine({ start: { x: M.l, y }, end: { x: pageSize[0] - M.r, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })
    const down = (dy) => { y -= dy }
    return { p, yRef: () => y, drawText, line, down }
  }

  // Portada
  {
    const { p, drawText, down } = addPage()
    try {
      if (LOGO_PATH) {
        const bytes = await fetchImageAsBytes(LOGO_PATH)
        const img = await pdfDoc.embedPng(bytes)
        const w = 140
        const h = (img.height / img.width) * w
        p.drawImage(img, { x: M.l, y: pageSize[1] - M.t - h, width: w, height: h })
      }
    } catch {}

    down(160)
    p.drawText(SITE_NAME, { x: M.l, y: pageSize[1] - 250, size: 22, font: bold, color: colorTitle })
    down(70)
    drawText('Informe Personalizado de Inversión', 18, true)
    down(24)
    drawText(`Perfil inversor: ${perfil}`, 13)
    down(16)
    if (nombre) drawText(`Cliente: ${nombre}`, 12)
    down(14)
    drawText(`Fecha: ${new Date().toLocaleString()}`, 11)
  }

  // Explicación del perfil
  {
    const { drawText, line, down } = addPage()
    drawText('Por qué este perfil', 16, true)
    down(10); line(); down(18)
    const par = explicarPerfil(formData, perfil, volObjetivo)
    // Pintamos el párrafo en varias líneas simples (envoltura ingenua)
    const words = par.split(' ')
    let lineStr = ''
    words.forEach((w) => {
      const test = lineStr ? `${lineStr} ${w}` : w
      if (test.length > 110) { // ancho aproximado
        drawText(lineStr); down(14); lineStr = w
      } else {
        lineStr = test
      }
    })
    if (lineStr) { drawText(lineStr); down(14) }
  }

  // Asignación + tabla
  {
    const { p, drawText, line, down } = addPage()
    drawText('Cartera propuesta (10 posiciones)', 16, true)
    down(10); line(); down(16)

    // Pie chart
    try {
      const pieUrl = buildPieChartUrl(cartera)
      const pieBytes = await fetchImageAsBytes(pieUrl)
      const pieImg = await pdfDoc.embedPng(pieBytes)
      p.drawImage(pieImg, { x: M.l, y: p.getHeight() - 300, width: 250, height: 145 })
    } catch {}

    // Tabla
    const x0 = M.l + 270
    let y = p.getHeight() - 170
    const headers = ['Ticker', 'Clase', 'Región', 'Peso', 'TER', '1Y', '3Y', '5Y']
    const colW = [60, 80, 60, 40, 35, 35, 35, 35]

    p.drawText('Detalle:', { x: x0, y: y + 18, size: 12, font: bold, color: colorText })
    headers.reduce((x, h, i) => {
      p.drawText(h, { x, y, size: 9, font: bold, color: colorText })
      return x + colW[i]
    }, x0)
    y -= 12
    p.drawLine({ start: { x: x0, y }, end: { x: x0 + colW.reduce((a,b)=>a+b,0), y }, thickness: 1, color: rgb(0.8,0.8,0.8) })
    y -= 10

    cartera.forEach(a => {
      const row = [a.ticker, a.class, a.region, pct(a.weight), `${a.ter.toFixed(2)}%`, `${a.perf1.toFixed(1)}%`, `${a.perf3.toFixed(1)}%`, `${a.perf5.toFixed(1)}%`]
      row.reduce((x, val, i) => {
        p.drawText(String(val), { x, y, size: 9, font, color: colorText })
        return x + colW[i]
      }, x0)
      y -= 12
    })
  }

  // Evolución (simulada) vs benchmark
  {
    const { p, drawText, line, down } = addPage()
    drawText('Evolución histórica (simulada)', 16, true)
    down(10); line(); down(16)
    drawText('Comparativa cartera vs benchmark global a 24 meses (simulación ilustrativa).')
    down(10)
    try {
      const url = buildPerfChartUrl('Cartera', 'MSCI World')
      const bytes = await fetchImageAsBytes(url)
      const img = await pdfDoc.embedPng(bytes)
      p.drawImage(img, { x: M.l, y: p.getHeight() - 400, width: p.getWidth() - M.l - M.r, height: 220 })
    } catch {}
    down(240)
    drawText('Aviso: Rentabilidades pasadas no garantizan resultados futuros. Este gráfico es orientativo.', 10)
  }

  return await pdfDoc.save()
}

// ------- Subir a Storage y guardar URL en Firestore -------
async function subirYGuardarInforme(docId, bytes) {
  const fileRef = ref(storage, `informes/${docId}.pdf`)
  await uploadBytes(fileRef, new Blob([bytes], { type: 'application/pdf' }))
  const url = await getDownloadURL(fileRef)
  await updateDoc(doc(db, 'cuestionarios', docId), { informeUrl: url })
  return url
}

// -----------------------------
// Componente principal
// -----------------------------
export default function CarteraPersonalizada() {
  const { state } = useLocation()
  const perfil = state?.perfil
  const nombre = state?.nombre || ''
  const volObjetivo = state?.volObjetivo || ''
  const docId = state?.docId
  const formData = state?.formData

  const [downloading, setDownloading] = useState(false)
  const [informeUrl, setInformeUrl] = useState('')

  const cartera = useMemo(() => CARTERAS[perfil] || [], [perfil])

  if (!perfil) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-4 bg-white shadow rounded text-center">
        <h2 className="text-xl font-bold mb-4">No se ha podido determinar tu perfil</h2>
        <p className="mb-4">Rellena el cuestionario para obtener tu informe.</p>
        <Link to="/simulador" className="text-blue-600 underline">Volver al simulador</Link>
      </div>
    )
  }

  const handleDownload = async () => {
    try {
      setDownloading(true)
      const bytes = await generarPDF({ perfil, nombre, volObjetivo, formData })
      // Descargar
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Informe-${SITE_NAME}-${perfil}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      // Subir y guardar URL si tenemos docId
      if (docId) {
        const savedUrl = await subirYGuardarInforme(docId, bytes)
        setInformeUrl(savedUrl)
      }
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

      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {downloading ? 'Generando PDF…' : 'Descargar informe PDF'}
        </button>
        {informeUrl && (
          <a
            href={informeUrl}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
            title="Abrir informe en una nueva pestaña"
          >
            Ver informe guardado
          </a>
        )}
        <Link to="/" className="text-blue-600 underline">Volver al inicio</Link>
      </div>
    </div>
  )
}
