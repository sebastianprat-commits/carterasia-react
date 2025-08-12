// src/engine/portfolioEngine.js
import universo from '../data/universo.json'

// Helpers
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))
const norm = (arr) => {
  const s = arr.reduce((a, b) => a + b, 0) || 1
  return arr.map(x => x / s)
}
const by = (k, dir = 'desc') => (a, b) =>
  dir === 'desc' ? (b[k] ?? 0) - (a[k] ?? 0) : (a[k] ?? 0) - (b[k] ?? 0)

// Perfil → asignación estratégica
export function targetByPerfil(perfil) {
  if (perfil === 'conservador') return { equity: 0.20, bond: 0.70, cash: 0.10 }
  if (perfil === 'moderado')    return { equity: 0.55, bond: 0.40, cash: 0.05 }
  return                          { equity: 0.85, bond: 0.10, cash: 0.05 } // dinámico
}

// Filtrado por preferencias del usuario
export function filterUniverse({ moneda, preferenciaESG, fondosTraspasables }) {
  return universo.filter(etf => {
    if (moneda === 'EUR' && etf.moneda !== 'EUR' && !etf.hedged) return false
    if (preferenciaESG === 'si' && !etf.esg) return false
    if (fondosTraspasables === 'si' && !etf.traspasable) return false
    return true
  })
}

// Scoring: momentum + coste + (penalización vol), con pesos según perfil
export function scoreUniverse(list, perfil) {
  const w = (p) => {
    if (p === 'conservador') return { mom: 0.3, coste: 0.3, vol: 0.4 }
    if (p === 'moderado')    return { mom: 0.45, coste: 0.25, vol: 0.30 }
    return                    { mom: 0.55, coste: 0.20, vol: 0.25 } // dinámico
  }
  const W = w(perfil)

  // normaliza a z-like con min-max simple por clase
  const byClase = list.reduce((acc, x) => {
    (acc[x.clase] ||= []).push(x)
    return acc
  }, {})

  const withScore = []
  for (const clase of Object.keys(byClase)) {
    const arr = byClase[clase]
    const momVals = arr.map(x => x.ret_12m ?? 0)
    const terVals = arr.map(x => x.ter ?? 0)
    const volVals = arr.map(x => x.vol_36m ?? 0)

    const min = (a) => Math.min(...a)
    const max = (a) => Math.max(...a)
    const scale = (v, lo, hi, invert = false) => {
      if (hi === lo) return 0.5
      const t = clamp((v - lo) / (hi - lo), 0, 1)
      return invert ? 1 - t : t
    }

    const momLo = min(momVals), momHi = max(momVals)
    const terLo = min(terVals), terHi = max(terVals)
    const volLo = min(volVals), volHi = max(volVals)

    for (const x of arr) {
      const s_mom = scale(x.ret_12m ?? 0, momLo, momHi, false)
      const s_coste = scale(x.ter ?? 0, terLo, terHi, true)    // menor TER = mejor
      const s_vol = scale(x.vol_36m ?? 0, volLo, volHi, true)  // menor vol = mejor
      const score = W.mom * s_mom + W.coste * s_coste + W.vol * s_vol
      withScore.push({ ...x, score })
    }
  }
  return withScore
}

// Construye cartera (10–12 posiciones) respetando target por clase
export function buildPortfolio({ perfil, preferencias }) {
  const target = targetByPerfil(perfil)
  const base = filterUniverse(preferencias)
  const scored = scoreUniverse(base, perfil)

  // buckets por clase
  const equity = scored.filter(x => x.clase === 'equity').sort(by('score'))
  const bond   = scored.filter(x => x.clase === 'bond').sort(by('score'))
  const cash   = scored.filter(x => x.clase === 'cash').sort(by('score'))

  // número de posiciones por clase
  const N = 12
  const nEq = Math.max(3, Math.round(N * target.equity))
  const nBd = Math.max(2, Math.round(N * target.bond))
  const nCs = Math.max(1, N - nEq - nBd)

  const pick = (arr, n, maxPerSub = 3) => {
    const out = []
    const countSub = {}
    for (const x of arr) {
      if (out.length >= n) break
      const key = `${x.clase}|${x.subclase}|${x.region}`
      if ((countSub[key] ?? 0) >= maxPerSub) continue
      out.push(x)
      countSub[key] = (countSub[key] ?? 0) + 1
    }
    return out
  }

  const selEq = pick(equity, nEq, 3)
  const selBd = pick(bond, nBd, 3)
  const selCs = pick(cash, nCs, 2)

  // pesos por clase -> reparto dentro de cada clase proporcional al score
  const weights = []
  const spread = (arr, targetClassWeight) => {
    const s = arr.map(x => x.score <= 0 ? 0.01 : x.score)
    const w = norm(s).map(v => v * targetClassWeight)
    arr.forEach((x, i) => weights.push({ ...x, weight: w[i] }))
  }
  spread(selEq, target.equity)
  spread(selBd, target.bond)
  spread(selCs, target.cash)

  // normaliza a 100% y redondea a 0.5%
  const W = norm(weights.map(x => x.weight))
  const portfolio = weights.map((x, i) => ({
    ...x,
    weight: Math.round(W[i] * 200) / 2 / 100  // a múltiplos de 0.5%
  }))

  // renormaliza exacto 100%
  const sum = portfolio.reduce((a, b) => a + b.weight, 0)
  const diff = 1 - sum
  if (Math.abs(diff) > 0.0001 && portfolio.length) {
    portfolio[0].weight = portfolio[0].weight + diff
  }

  return portfolio
}

// Estimación simple de volatilidad de cartera
export function estimateVol(portfolio) {
  const v = Math.sqrt(
    portfolio.reduce((acc, x) => acc + (x.weight ** 2) * ((x.vol_36m ?? 10) ** 2), 0)
  )
  return Number(v.toFixed(1))
}