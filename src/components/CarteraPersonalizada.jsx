
// src/components/CarteraPersonalizada.jsx
import React, { useMemo, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { buildPortfolio, estimateVol, targetByPerfil } from '../engine/portfolioEngine'
import universoBase from '../data/universo.json'
import { SITE_NAME } from '../constants/brand'

function pct(n) {
  const num = Number(n)
  if (!isFinite(num)) return '0.0%'
  return `${(num * 100).toFixed(1)}%`
}

function clamp01(x) {
  const n = Number(x)
  if (!isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
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

  // 1) Universo: filtra por preferencias (ESG / Traspasables) y datos básicos válidos
  const universo = useMemo(() => {
    const esgWanted = String(preferencias.preferenciaESG).toLowerCase() === 'si' || preferencias.preferenciaESG === true
    const traspWanted = String(preferencias.fondosTraspasables).toLowerCase() === 'si' || preferencias.fondosTraspasables === true

    return (universoBase || [])
      .filter(x => x && x.ticker && x.nombre && x.clase && x.region)
      .filter(x => (esgWanted ? x.esg === true : true))
      .filter(x => (traspWanted ? x.traspasable === true : true))
      .map(x => ({
        ...x,
        ter: typeof x.ter === 'number' ? x.ter : 0, // asegura ter numérico
      }))
  }, [preferencias])

  // 2) Target por perfil
  const target = useMemo(() => targetByPerfil(perfil), [perfil])

  // 3) Cartera: intenta usar el motor; si no acepta `universo`, fallback simple
  const portfolio = useMemo(() => {
    if (!perfil) return []

    // Primero intentamos con el motor pasando universo si lo soporta
    try {
      const candidate = buildPortfolio({ perfil, preferencias, universo })
      if (Array.isArray(candidate) && candidate.length > 0) return normalizeWeights(candidate)
    } catch {
      // si el motor no acepta `universo`, intentamos sin él
      try {
        const candidate = buildPortfolio({ perfil, preferencias })
        if (Array.isArray(candidate) && candidate.length > 0) return normalizeWeights(candidate)
      } catch {
        // seguimos al fallback
      }
    }

    // Fallback: muestra una cartera básica coherente con el target
    // Selecciona 4-6 posiciones equity, 3-4 bonos, 1-2 cash si hay
    const equity = universo.filter(x => x.clase === 'equity')
    const bond = universo.filter(x => x.clase === 'bond')
    const cash = universo.filter(x => x.clase === 'cash')

    const pick = (arr, n = 3) => arr.slice(0, Math.max(0, n))

    // intenta dar algo de diversificación razonable
    const equityPicks = diversifyEquity(equity)
    const bondPicks = diversifyBonds(bond)

    // pesos base por bloque
    const wEq = clamp01(target?.equity ?? 0.6)
    const wBd = clamp01(target?.bond ?? 0.35)
    const wCs = clamp01(target?.cash ?? 0.05)
    const wSum = wEq + wBd + wCs || 1

    const eqWeight = wEq / wSum
    const bdWeight = wBd / wSum
    const csWeight = wCs / wSum

    const eqList = spreadWeights(equityPicks, eqWeight)
    const bdList = spreadWeights(bondPicks, bdWeight)
    const csList = spreadWeights(pick(cash, 1), csWeight)

    return normalizeWeights([...eqList, ...bdList, ...csList])
  }, [perfil, preferencias, universo])

  // 4) Métricas
  const volEst = useMemo(() => {
    try {
      return estimateVol(portfolio)
    } catch {
      // heurística simple si no hay motor de volatilidad
      const avg = portfolio.reduce((acc, p) => acc + (Number(p?.vol_36m) || 0) * (p.weight || 0), 0)
      return (avg || 0).toFixed(1)
    }
  }, [portfolio])

  const pesoTotal = useMemo(() => {
    const sum = portfolio.reduce((acc, p) => acc + (Number(p.weight) || 0), 0)
    return Math.round(sum * 1000) / 1000
  }, [portfolio])

  // 5) PDF
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
    text(`Perfil inversor: ${String(perfil).toUpperCase()}`, M, y, 12, true, rgb(0.05, 0.25, 0.65)); y -= 16
    text(`Objetivo de asignacion ~ Equity ${pct(target?.equity)}, Bond ${pct(target?.bond)}, Cash ${pct(target?.cash)}`, M, y); y -= 14
    text(`Volatilidad estimada cartera: ~${volEst}% (aprox)`, M, y); y -= 16
    line(M, y, 595.28 - M, y); y -= 18

    // Tabla
    text('Cartera sugerida', M, y, 12, true); y -= 16
    text('Pos', M, y); text('Ticker', M + 30, y); text('Nombre', M + 90, y); text('Clase', M + 330, y); text('Reg', M + 390, y); text('TER', M + 440, y); text('Peso', M + 490, y); y -= 12
    line(M, y, 595.28 - M, y); y -= 10

    portfolio.slice(0, 12).forEach((p, i) => {
      text(String(i + 1).padStart(2, '0'), M, y)
      text(String(p.ticker || ''), M + 30, y)
      text(String(p.nombre || '').slice(0, 36), M + 90, y)
      text(String(p.clase || ''), M + 330, y)
      text(String(p.region || ''), M + 390, y)
      const ter = Number(p.ter); text(isFinite(ter) ? `${(ter * 100).toFixed(2)}%` : '-', M + 440, y)
      text(pct(p.weight), M + 490, y)
      y -= 14
      if (y < 80) { y = 800 } // MVP
    })

    y -= 8
    line(M, y, 595.28 - M, y); y -= 14
    text('Metodologia (resumen):', M, y, 12, true); y -= 14
    ;[
      'Universo UCITS curado, costes bajos y clases sencillas.',
      'Scoring interno: momentum 12m, coste (TER) y penalización por volatilidad.',
      'Asignación estratégica por perfil y límites por clase/subclase/región.',
      'Rebalanceo trimestral o por desviaciones significativas.'
    ].forEach(s => { text(`- ${s}`, M, y); y -= 12 })

    y -= 6
    text('Aviso legal: Informe educativo. No constituye recomendación personalizada.', M, y, 9, false, rgb(0.35, 0.35, 0.35))

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
      <div className="max-w-xl mx-auto mt-10 p-4 bg-white dark:bg-gray-900 shadow-md rounded text-center">
        <h2 className="text-xl font-bold mb-4">No se ha podido determinar tu perfil</h2>
        <p className="mb-4">Por favor, rellena el cuestionario para recibir tu cartera sugerida.</p>
        <Link to="/simulador" className="text-blue-600 underline">Volver al simulador</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Tu perfil: <span className="capitalize text-blue-600">{perfil}</span></h2>

      <div className="mb-4 text-sm text-gray-700 dark:text-gray-200">
        <p>Asignación objetivo: Equity {pct(target?.equity)}, Bond {pct(target?.bond)}, Cash {pct(target?.cash)}.</p>
        <p>Volatilidad estimada (aprox): ~{volEst}%.</p>
        <p>Posiciones: {portfolio.length} · Peso total: {pct(pesoTotal)}</p>
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
                <Td>{Number.isFinite(p.ter) ? `${(p.ter * 100).toFixed(2)}%` : '-'}</Td>
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

/* -------- Helpers -------- */

function normalizeWeights(list) {
  const sum = list.reduce((acc, p) => acc + (Number(p.weight) || 0), 0)
  if (sum <= 0) return list
  return list.map(p => ({ ...p, weight: (Number(p.weight) || 0) / sum }))
}

function spreadWeights(items, totalWeight) {
  if (!items || items.length === 0) return []
  const w = clamp01(totalWeight) / items.length
  return items.map(x => ({ ...x, weight: w }))
}

function diversifyEquity(equity) {
  if (!equity.length) return []
  // ordena por TER asc (baratos primero) y mezcla regiones core
  const core = equity
    .slice()
    .sort((a, b) => (a.ter ?? 1) - (b.ter ?? 1))

  const pick = (fn) => core.find(fn)
  const chosen = [
    pick(x => /all-?world/i.test(x.subclase) || /DM World/i.test(x.subclase) || /World/i.test(x.nombre)) || core[0],
    pick(x => /USA/i.test(x.region) || /US/i.test(x.subclase)),
    pick(x => /Europe/i.test(x.region) || /Europe/i.test(x.subclase)),
    pick(x => /Emerg/i.test(x.region) || /EM/i.test(x.subclase)),
    pick(x => /Small Cap/i.test(x.subclase)),
    pick(x => /Tech|Information Technology|NASDAQ/i.test(x.subclase) || /Tech/i.test(x.nombre)),
  ].filter(Boolean)

  // elimina duplicados por ticker
  const seen = new Set()
  const dedup = []
  for (const x of chosen) {
    if (x && !seen.has(x.ticker)) { seen.add(x.ticker); dedup.push(x) }
  }
  return dedup.slice(0, 6)
}

function diversifyBonds(bonds) {
  if (!bonds.length) return []
  // agrupa tipos frecuentes: aggregate, gov corto, gov 7-10, corp IG, IL, HY
  const by = (kw) => bonds.find(b => [b.subclase, b.nombre].join(' ').toLowerCase().includes(kw))
  const chosen = [
    by('aggregate') || bonds[0],
    by('gov 1-3') || by('0-3') || by('short'),
    by('gov 7-10') || by('7-10'),
    by('corp') || by('investment grade'),
    by('inflation') || by('il'),
    by('high yield') || by('hy')
  ].filter(Boolean)

  // dedup por ticker
  const seen = new Set()
  const dedup = []
  for (const x of chosen) {
    if (x && !seen.has(x.ticker)) { seen.add(x.ticker); dedup.push(x) }
  }
  return dedup.slice(0, 4)
}