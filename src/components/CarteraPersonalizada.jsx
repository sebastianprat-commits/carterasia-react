
// src/components/CarteraPersonalizada.jsx
import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit';

// Importa fuentes y logo (las fuentes entran como URL gracias a Vite)
import fontRegularUrl from '../assets/fonts/Inter-Regular.ttf?url'
import fontBoldUrl from '../assets/fonts/Inter-Bold.ttf?url'
import { LOGO_PATH, SITE_NAME } from '../constants/brand'

// ================= Datos de carteras por perfil (10 posiciones) =================
const CARTERAS = {
  conservador: [
    { name: 'Vanguard Global Aggregate Bond (VAGF)', weight: 22, type: 'Bonos Global', region: 'Global' },
    { name: 'iShares Euro Gov Bond 1-3yr (IBGL)',  weight: 18, type: 'Bonos Gob. Euro', region: 'Europa' },
    { name: 'Xtrackers ESG EUR Corp Bond (XDCB)',  weight: 12, type: 'Bonos Corp EUR', region: 'Europa' },
    { name: 'Amundi Cash EUR (AECE)',               weight: 10, type: 'Monetario',     region: 'Europa' },
    { name: 'iShares MSCI World (IWRD)',            weight: 10, type: 'Renta Variable',region: 'Global' },
    { name: 'Vanguard FTSE Developed Europe',       weight: 8,  type: 'Renta Variable',region: 'Europa' },
    { name: 'Vanguard S&P 500',                     weight: 8,  type: 'Renta Variable',region: 'EE.UU.' },
    { name: 'iShares Global REIT',                  weight: 5,  type: 'Inmobiliario',  region: 'Global' },
    { name: 'SPDR Gold Shares',                     weight: 4,  type: 'Materias Primas',region: 'Global' },
    { name: 'Vanguard Global Minimum Volatility',   weight: 3,  type: 'Renta Variable',region: 'Global' },
  ],
  moderado: [
    { name: 'iShares MSCI World (IWRD)',            weight: 20, type: 'Renta Variable',region: 'Global' },
    { name: 'Vanguard S&P 500',                     weight: 15, type: 'Renta Variable',region: 'EE.UU.' },
    { name: 'Vanguard FTSE All-World ex-US',        weight: 10, type: 'Renta Variable',region: 'Global ex-US' },
    { name: 'Vanguard Emerging Markets (VFEM)',     weight: 8,  type: 'Renta Variable',region: 'Emergentes' },
    { name: 'iShares Euro Gov Bond 1-3yr (IBGL)',   weight: 12, type: 'Bonos Gob. Euro',region: 'Europa' },
    { name: 'Vanguard Global Aggregate Bond (VAGF)',weight: 12, type: 'Bonos Global',  region: 'Global' },
    { name: 'Xtrackers ESG EUR Corp Bond (XDCB)',   weight: 10, type: 'Bonos Corp EUR',region: 'Europa' },
    { name: 'iShares Global REIT',                  weight: 5,  type: 'Inmobiliario',  region: 'Global' },
    { name: 'SPDR Gold Shares',                     weight: 5,  type: 'Materias Primas',region: 'Global' },
    { name: 'Vanguard Global Small-Cap',            weight: 3,  type: 'Renta Variable',region: 'Global' },
  ],
  dinámico: [
    { name: 'iShares MSCI World (IWRD)',            weight: 23, type: 'Renta Variable',region: 'Global' },
    { name: 'Vanguard S&P 500',                     weight: 18, type: 'Renta Variable',region: 'EE.UU.' },
    { name: 'Vanguard Emerging Markets (VFEM)',     weight: 12, type: 'Renta Variable',region: 'Emergentes' },
    { name: 'Vanguard Global Small-Cap',            weight: 10, type: 'Renta Variable',region: 'Global' },
    { name: 'iShares NASDAQ 100 (CNDX)',            weight: 10, type: 'Renta Variable',region: 'EE.UU.' },
    { name: 'Vanguard FTSE Developed Europe',       weight: 8,  type: 'Renta Variable',region: 'Europa' },
    { name: 'Vanguard Global Aggregate Bond (VAGF)',weight: 8,  type: 'Bonos Global',  region: 'Global' },
    { name: 'Xtrackers ESG EUR Corp Bond (XDCB)',   weight: 5,  type: 'Bonos Corp EUR',region: 'Europa' },
    { name: 'iShares Global REIT',                  weight: 4,  type: 'Inmobiliario',  region: 'Global' },
    { name: 'SPDR Gold Shares',                     weight: 2,  type: 'Materias Primas',region: 'Global' },
  ],
}

// Textos explicativos por perfil
const TEXTO_PERFIL = {
  conservador:
    'Perfil conservador: prioriza la preservación del capital y la estabilidad. La exposición a renta variable es moderada y el peso de bonos y liquidez ayuda a suavizar la volatilidad.',
  moderado:
    'Perfil moderado: busca equilibrio entre crecimiento y estabilidad. Combina renta variable global con una base de renta fija diversificada.',
  dinámico:
    'Perfil dinámico: prioriza el crecimiento a largo plazo aceptando mayor volatilidad. Mayor exposición a renta variable global y factores de crecimiento.',
}

// Helpers
const pct = (n) => `${Number(n).toFixed(0)}%`

function groupAndSum(items, key) {
  return items.reduce((acc, it) => {
    acc[it[key]] = (acc[it[key]] || 0) + it.weight
    return acc
  }, {})
}

// ================= Generador de PDF =================
async function generarPDF({ perfil, nombre, volObjetivo }) {
  // Preparar datos de cartera
  const items = CARTERAS[perfil] || []
  const porTipo = groupAndSum(items, 'type')
  const porRegion = groupAndSum(items, 'region')

  // Cargar fuentes y logo
  const [fontRegularBytes, fontBoldBytes, logoBytes] = await Promise.all([
    fetch(fontRegularUrl).then((r) => r.arrayBuffer()),
    fetch(fontBoldUrl).then((r) => r.arrayBuffer()),
    fetch(LOGO_PATH).then((r) => r.arrayBuffer()),
  ])

  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit); 
  const fontRegular = await pdfDoc.embedFont(fontRegularBytes)
  const fontBold = await pdfDoc.embedFont(fontBoldBytes)
  const logoImg = await pdfDoc.embedPng(logoBytes)

  const PAGE = { w: 595.28, h: 841.89 } // A4 en puntos
  const MARGIN = 50
  const colorTitle = rgb(0.16, 0.38, 0.69) // azul marca aprox
  const colorText = rgb(0.15, 0.15, 0.18)
  const colorSubtle = rgb(0.45, 0.45, 0.5)

  // Utilities de dibujo
  const addPage = () => pdfDoc.addPage([PAGE.w, PAGE.h])
  const drawHeader = (page, title) => {
    // logo
    const lw = 120
    const lh = (logoImg.height / logoImg.width) * lw
    page.drawImage(logoImg, { x: MARGIN, y: PAGE.h - MARGIN - lh, width: lw, height: lh })
    // título
    page.drawText(title, {
      x: MARGIN,
      y: PAGE.h - MARGIN - lh - 18,
      size: 18,
      font: fontBold,
      color: colorTitle,
    })
    // línea
    page.drawLine({
      start: { x: MARGIN, y: PAGE.h - MARGIN - lh - 26 },
      end: { x: PAGE.w - MARGIN, y: PAGE.h - MARGIN - lh - 26 },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.95),
    })
  }
  const drawFooter = (page, text = `${SITE_NAME} · Informe generado automáticamente`) => {
    page.drawLine({
      start: { x: MARGIN, y: MARGIN + 28 },
      end: { x: PAGE.w - MARGIN, y: MARGIN + 28 },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.93),
    })
    page.drawText(text, {
      x: MARGIN,
      y: MARGIN + 12,
      size: 9,
      font: fontRegular,
      color: colorSubtle,
    })
    const pageIndex = pdfDoc.getPageCount()
    page.drawText(`Página ${pageIndex}`, {
      x: PAGE.w - MARGIN - 70,
      y: MARGIN + 12,
      size: 9,
      font: fontRegular,
      color: colorSubtle,
    })
  }
  const wrapText = (text, maxWidth, size, font) => {
    const words = text.split(' ')
    const lines = []
    let line = ''
    for (const w of words) {
      const test = line ? line + ' ' + w : w
      const width = font.widthOfTextAtSize(test, size)
      if (width > maxWidth) {
        if (line) lines.push(line)
        line = w
      } else {
        line = test
      }
    }
    if (line) lines.push(line)
    return lines
  }
  const drawParagraph = (page, text, x, y, width, size = 11, leading = 1.4, color = colorText) => {
    const lines = wrapText(text, width, size, fontRegular)
    let cursorY = y
    for (const ln of lines) {
      page.drawText(ln, { x, y: cursorY, size, font: fontRegular, color })
      cursorY -= size * leading
    }
    return cursorY
  }
  const drawTable = (page, { x, y, cols, rows, rowHeight = 18 }) => {
    // header
    let curX = x
    const headY = y
    cols.forEach((c) => {
      page.drawText(c.label, {
        x: curX + 4,
        y: headY,
        size: 10,
        font: fontBold,
        color: colorText,
      })
      curX += c.w
    })
    page.drawLine({
      start: { x, y: headY - 4 },
      end: { x: x + cols.reduce((s, c) => s + c.w, 0), y: headY - 4 },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.93),
    })

    // rows
    let rowY = headY - 14
    rows.forEach((r, idx) => {
      curX = x
      cols.forEach((c) => {
        const val = String(r[c.key] ?? '')
        page.drawText(val, {
          x: curX + 4,
          y: rowY,
          size: 10,
          font: fontRegular,
          color: colorText,
        })
        curX += c.w
      })
      rowY -= rowHeight
      if (idx < rows.length - 1) {
        page.drawLine({
          start: { x, y: rowY + 4 },
          end: { x: x + cols.reduce((s, c) => s + c.w, 0), y: rowY + 4 },
          thickness: 0.5,
          color: rgb(0.92, 0.92, 0.95),
        })
      }
    })
  }
  const drawBarH = (page, { x, y, w, h, valuePct }) => {
    // fondo
    page.drawRectangle({ x, y, width: w, height: h, color: rgb(0.95, 0.96, 0.99) })
    // valor
    page.drawRectangle({ x, y, width: (w * Math.min(valuePct, 100)) / 100, height: h, color: rgb(0.17, 0.4, 0.7) })
  }

  // ============ Página 1: Portada ============
  {
    const page = addPage()
    drawHeader(page, `${SITE_NAME} — Informe de Cartera`)

    const fecha = new Date().toLocaleString()
    const titleY = PAGE.h - 200
    page.drawText('Cartera personalizada', { x: MARGIN, y: titleY, size: 24, font: fontBold, color: colorTitle })
    page.drawText(`Perfil: ${capitalize(perfil)}`, { x: MARGIN, y: titleY - 28, size: 14, font: fontBold, color: colorText })
    if (nombre) {
      page.drawText(`Usuario: ${nombre}`, { x: MARGIN, y: titleY - 48, size: 12, font: fontRegular, color: colorText })
    }
    page.drawText(`Fecha: ${fecha}`, { x: MARGIN, y: titleY - 66, size: 11, font: fontRegular, color: colorSubtle })

    drawFooter(page)
  }

  // ============ Página 2: Tu perfil ============
  {
    const page = addPage()
    drawHeader(page, 'Tu perfil de inversión')

    const textTop = PAGE.h - 210
    let cursorY = drawParagraph(
      page,
      TEXTO_PERFIL[perfil] || '',
      MARGIN,
      textTop,
      PAGE.w - MARGIN * 2,
      12
    )
    cursorY -= 16
    page.drawText(`Volatilidad objetivo: ${volObjetivo || '—'}`, {
      x: MARGIN,
      y: cursorY,
      size: 12,
      font: fontBold,
      color: colorText,
    })

    drawFooter(page)
  }

  // ============ Página 3: Cartera sugerida ============
  {
    const page = addPage()
    drawHeader(page, 'Cartera sugerida (10 posiciones)')

    const rows = items.map((it) => ({
      activo: it.name,
      tipo: it.type,
      region: it.region,
      peso: pct(it.weight),
    }))

    const cols = [
      { key: 'activo', label: 'Activo / Fondo / ETF', w: 260 },
      { key: 'tipo', label: 'Clase', w: 110 },
      { key: 'region', label: 'Región', w: 110 },
      { key: 'peso', label: 'Peso', w: 60 },
    ]

    drawTable(page, {
      x: MARGIN,
      y: PAGE.h - 220,
      cols,
      rows,
      rowHeight: 18,
    })

    drawFooter(page)
  }

  // ============ Página 4: Distribuciones y barras ============
  {
    const page = addPage()
    drawHeader(page, 'Distribuciones agregadas')

    // Por Clase de Activo
    page.drawText('Por clase de activo', { x: MARGIN, y: PAGE.h - 220, size: 14, font: fontBold, color: colorText })
    let bx = MARGIN
    let by = PAGE.h - 240
    const barW = PAGE.w - MARGIN * 2
    const barH = 12

    Object.entries(porTipo).forEach(([k, v]) => {
      page.drawText(`${k} — ${pct(v)}`, { x: bx, y: by + 4, size: 10, font: fontRegular, color: colorText })
      by -= 16
      drawBarH(page, { x: bx, y: by, w: barW, h: barH, valuePct: v })
      by -= 24
    })

    // Por Región
    const rightY = by - 8
    page.drawText('Por región', { x: MARGIN, y: rightY, size: 14, font: fontBold, color: colorText })
    let ry = rightY - 20
    Object.entries(porRegion).forEach(([k, v]) => {
      page.drawText(`${k} — ${pct(v)}`, { x: MARGIN, y: ry + 4, size: 10, font: fontRegular, color: colorText })
      ry -= 16
      drawBarH(page, { x: MARGIN, y: ry, w: barW, h: barH, valuePct: v })
      ry -= 24
    })

    drawFooter(page)
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

// ================= Utilidad =================
function capitalize(s) {
  return (s || '').charAt(0).toUpperCase() + (s || '').slice(1)
}

// ================= UI principal =================
const obtenerCartera = (perfil) => CARTERAS[perfil] || []

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
    const pdfBlob = await generarPDF({ perfil, nombre, volObjetivo })
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Cartera-${perfil}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 shadow-soft rounded-xl">
      <h2 className="text-2xl font-bold mb-2">
        Tu perfil inversor: <span className="capitalize text-blue-600 dark:text-blue-400">{perfil}</span>
      </h2>
      {volObjetivo && (
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Volatilidad objetivo aproximada: {volObjetivo}
        </p>
      )}

      <h3 className="text-lg font-semibold mb-2">Cartera sugerida (10 posiciones):</h3>
      <ul className="list-disc ml-6 text-gray-800 dark:text-gray-100 mb-4">
        {cartera.map((it, i) => (
          <li key={i}>
            {it.name} — <span className="text-gray-600 dark:text-gray-300">{pct(it.weight)}</span>
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

        {/* Si más adelante vuelves a EmailJS con adjuntos, aquí reutilizamos el blob */}
        <Link to="/" className="text-blue-600 underline self-center">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
