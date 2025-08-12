// src/components/CarteraPersonalizada.jsx
import React, { useMemo, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { buildPortfolio, estimateVol, targetByPerfil } from '../engine/portfolioEngine'
import { SITE_NAME } from '../constants/brand'

function pct(n) {
  return `${(Number(n) * 100).toFixed(1)}%`
}

export default function CarteraPersonalizada() {
  const { state } = useLocation()
  const perfil = state?.perfil
  const email = state?.email
  const nombre = state?.nombre
  const preferencias = {
    moneda: state?.moneda || 'EUR',
    preferenciaESG: state?.preferenciaESG || 'no',
    fondosTraspasables: state?.fondosTraspasables || 'no'
  }

  const portfolio = useMemo(() => {
    if (!perfil) return []
    return buildPortfolio({ perfil, preferencias })
  }, [perfil])

  const volEst = useMemo(() => estimateVol(portfolio), [portfolio])
  const target = targetByPerfil(perfil)

  const handleDownloadPDF = async () => {
    if (!perfil || portfolio.length === 0) return
    const pdf = await PDFDocument.create()
    const page = pdf.addPage([595.28, 841.89]) // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const fontB = await pdf.embedFont(StandardFonts.HelveticaBold)
    const M = 40
    let y = 800

    const line = (x1, y1, x2, y2, color = rgb(0.85, 0.85, 0.85)) =>
      page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color, thickness: 1 })
    const text = (t, x, yy, size = 11, bold = false, color = rgb(0, 0, 0)) =>
      page.drawText(String(t), { x, y: yy, size, font: bold ? fontB : font, color })

    // Portada breve
    text(`${SITE_NAME} - Informe de Cartera`, M, y, 16, true, rgb(0, 0, 0.6)); y -= 18
    const fecha = new Date().toLocaleString()
    text(`Fecha: ${fecha}`, M, y, 10, false, rgb(0.25, 0.25, 0.25)); y -= 14
    if (nombre) { text(`Usuario: ${nombre}`, M, y); y -= 14 }
    text(`Perfil inversor: ${perfil.toUpperCase()}`, M, y, 12, true, rgb(0.05, 0.25, 0.65)); y -= 16
    text(`Objetivo de asignacion ~ Equity ${pct(target.equity)}, Bond ${pct(target.bond)}, Cash ${pct(target.cash)}`, M, y); y -= 14
    text(`Volatilidad estimada cartera: ~${volEst}% (aprox)`, M, y); y -= 16
    line(M, y, 595.28 - M, y); y -= 18

    // Tabla de 10–12 posiciones
    text('Cartera sugerida', M, y, 12, true); y -= 16
    text('Pos', M, y); text('Ticker', M + 30, y); text('Nombre', M + 90, y); text('Clase', M + 330, y); text('Reg', M + 390, y); text('TER', M + 440, y); text('Peso', M + 490, y); y -= 12
    line(M, y, 595.28 - M, y); y -= 10

    portfolio.slice(0, 12).forEach((p, i) => {
      text(String(i + 1).padStart(2, '0'), M, y)
      text(p.ticker, M + 30, y)
      text(p.nombre.slice(0, 36), M + 90, y)
      text(p.clase, M + 330, y)
      text(p.region, M + 390, y)
      text(`${(p.ter * 100).toFixed(2)}%`, M + 440, y)
      text(pct(p.weight), M + 490, y)
      y -= 14
      if (y < 80) { y = 800 } // (MVP: una sola página; fácil extender a multi-página)
    })

    y -= 8
    line(M, y, 595.28 - M, y); y -= 14
    text('Metodologia (resumen):', M, y, 12, true); y -= 14
    const bullet = [
      'Universo curado UCITS, costes bajos, clases sencillas.',
      'Puntuacion combina momentum 12m, coste (TER) y penalizacion por volatilidad.',
      'Asignacion estrategica por perfil y limites por clase/subclase/region.',
      'Rebalanceo trimestral o por desviaciones significativas.'
    ]
    bullet.forEach(s => { text(`- ${s}`, M, y); y -= 12 })

    y -= 6
    text('Aviso legal: Informe educativo. No constituye recomendacion personalizada.', M, y, 9, false, rgb(0.35, 0.35, 0.35))

    const bytes = await pdf.save()
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cartera_${perfil}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!perfil) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-4 bg-white shadow rounded text-center">
        <h2 className="text-xl font-bold mb-4">No se ha podido determinar tu perfil</h2>
        <p className="mb-4">Por favor, rellena el cuestionario para recibir tu cartera sugerida.</p>
        <Link to="/simulador" className="text-blue-600 underline">Volver al simulador</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-soft">
      <h2 className="text-2xl font-bold mb-4">Tu perfil: <span className="capitalize text-blue-600">{perfil}</span></h2>

      <div className="mb-4 text-sm text-gray-700 dark:text-gray-200">
        <p>Asignacion objetivo: Equity {pct(target.equity)}, Bond {pct(target.bond)}, Cash {pct(target.cash)}.</p>
        <p>Volatilidad estimada (aprox): ~{volEst}%.</p>
      </div>

      <h3 className="text-lg font-semibold mb-2">Cartera sugerida (10–12 posiciones)</h3>
      <div className="overflow-auto border rounded">
        <table className="min-w-[700px] w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr className="text-left">
              <Th>Pos</Th><Th>Ticker</Th><Th>Nombre</Th><Th>Clase</Th><Th>Región</Th><Th>TER</Th><Th>Peso</Th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((p, i) => (
              <tr key={p.isin || p.ticker || i} className="border-t dark:border-gray-700">
                <Td>{String(i + 1).padStart(2, '0')}</Td>
                <Td>{p.ticker}</Td>
                <Td title={p.nombre}>{p.nombre}</Td>
                <Td className="capitalize">{p.clase}</Td>
                <Td>{p.region}</Td>
                <Td>{(p.ter * 100).toFixed(2)}%</Td>
                <Td>{pct(p.weight)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={handleDownloadPDF} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Descargar PDF
        </button>
        <Link to="/" className="text-blue-600 underline self-center">Volver al inicio</Link>
      </div>
    </div>
  )
}

function Th({ children }) { return <th className="p-2 text-gray-700 dark:text-gray-200">{children}</th> }
function Td({ children }) { return <td className="p-2 text-gray-800 dark:text-gray-100">{children}</td> }