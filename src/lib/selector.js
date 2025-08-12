// src/lib/selector.js
import { loadUniverse } from './universo'

// reglas simples; luego podremos optimizar (riesgo/TER/overlap)
export function proponerCartera({ perfil, esg, geografia, traspasables, moneda = 'EUR' }) {
  const U = loadUniverse()

  // Filtros básicos
  let cand = U.filter(x => {
    if (traspasables === true && !x.traspasable) return false
    if (esg === true && !x.esg) return false
    if (geografia && geografia !== 'global') {
      // si preferencia regional, sesgo pero sin excluir globales
      // (mantenemos globales para diversificar)
    }
    // preferimos EUR-hedged en RF si moneda EUR
    return true
  })

  // Bucket por clase
  const eq = cand.filter(x => x.clase === 'equity')
  const rf = cand.filter(x => x.clase === 'bond')
  const cash = cand.filter(x => x.clase === 'cash')
  const mixed = cand.filter(x => x.clase === 'mixed')

  // Asignación por perfil (aprox)
  const target = {
    conservador: { equity: 0.20, bond: 0.70, cash: 0.10 },
    moderado:    { equity: 0.50, bond: 0.45, cash: 0.05 },
    dinamico:    { equity: 0.80, bond: 0.15, cash: 0.05 }
  }[perfil || 'moderado']

  // Selección simple por TER ascendente dentro de cada clase + diversidad por subclase/region
  const pickDiverso = (arr, n) => {
    const seen = new Set()
    return arr
      .slice()
      .sort((a,b) => (a.ter ?? 9) - (b.ter ?? 9))
      .filter(x => {
        const key = `${x.subclase}|${x.region}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, n)
  }

  const N = 12
  const nEq = Math.max(4, Math.round(N * target.equity))
  const nRf = Math.max(3, Math.round(N * target.bond))
  const nC  = Math.max(1, Math.round(N * target.cash))
  let selEq = pickDiverso(eq, nEq)
  let selRf = pickDiverso(rf, nRf)
  let selC  = pickDiverso(cash, nC)

  // Si falta para llegar a 12, completamos con los mejores TER globales restantes
  let cartera = [...selEq, ...selRf, ...selC]
  if (cartera.length < N) {
    const resto = cand
      .filter(x => !cartera.find(y => (y.isin && y.isin === x.isin) || (y.ticker && y.ticker === x.ticker)))
      .sort((a,b) => (a.ter ?? 9) - (b.ter ?? 9))
      .slice(0, N - cartera.length)
    cartera = [...cartera, ...resto]
  }

  // Ponderaciones proporcionales al bucket; normalizamos a 100
  const sumEq = selEq.length || 1
  const sumRf = selRf.length || 1
  const sumC  = selC.length  || 1

  const W = []
  const pushW = (arr, bucketW) => {
    const w = bucketW / (arr.length || 1)
    arr.forEach(x => W.push({ ...x, weight: w }))
  }
  pushW(selEq, target.equity)
  pushW(selRf, target.bond)
  pushW(selC,  target.cash)

  // Normaliza por si añadimos “resto”
  if (cartera.length > W.length) {
    const restW = (1 - (target.equity + target.bond + target.cash)) // suele ser 0
    const w = restW / (cartera.length - W.length || 1)
    cartera.slice(W.length).forEach(x => W.push({ ...x, weight: w }))
  }
  // A 100%
  const total = W.reduce((s,x) => s + x.weight, 0) || 1
  return W.map(x => ({ ...x, weight: Math.round((x.weight / total) * 1000) / 10 })) // 1 decimal
}