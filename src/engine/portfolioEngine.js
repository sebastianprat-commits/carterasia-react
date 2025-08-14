// src/engine/portfolioEngine.js
import universoDefault from '../data/universo.json'

// ----------------- Helpers -----------------
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Number(n)))
const norm = (arr) => {
  const s = arr.reduce((a, b) => a + (Number(b) || 0), 0) || 1
  return arr.map(x => (Number(x) || 0) / s)
}
const by = (k, dir = 'desc') => (a, b) => {
  const av = Number(a?.[k]) || 0
  const bv = Number(b?.[k]) || 0
  return dir === 'desc' ? bv - av : av - bv
}
const safeNum = (x, fallback = 0) => (Number.isFinite(Number(x)) ? Number(x) : fallback)

// ----------------- Perfil → asignación -----------------
export function targetByPerfil(perfil) {
  if (perfil === 'conservador') return { equity: 0.20, bond: 0.70, cash: 0.10 }
  if (perfil === 'moderado')    return { equity: 0.55, bond: 0.40, cash: 0.05 }
  // dinámico / agresivo por defecto
  return                          { equity: 0.85, bond: 0.10, cash: 0.05 }
}

// ----------------- Universo y scoring -----------------
/**
 * Filtra el universo según las preferencias del usuario.
 * @param {object} preferencias { moneda, preferenciaESG, fondosTraspasables }
 * @param {Array} universoData  universo a usar (por defecto, el importado)
 */
export function filterUniverse(preferencias = {}, universoData = universoDefault) {
  const moneda = (preferencias.moneda || 'EUR').toUpperCase()
  const esgWanted = String(preferencias.preferenciaESG).toLowerCase() === 'si' || preferencias.preferenciaESG === true
  const traspWanted = String(preferencias.fondosTraspasables).toLowerCase() === 'si' || preferencias.fondosTraspasables === true

  return (universoData || [])
    .filter(etf => etf && etf.ticker && etf.nombre && etf.clase)
    .filter(etf => {
      if (moneda === 'EUR' && etf.moneda !== 'EUR' && !etf.hedged) return false
      if (esgWanted && !etf.esg) return false
      if (traspWanted && !etf.traspasable) return false
      return true
    })
    .map(x => ({
      ...x,
      // saneamos campos numéricos para evitar NaN aguas abajo
      ter: safeNum(x.ter, 0),
      ret_12m: safeNum(x.ret_12m, 0),
      vol_36m: safeNum(x.vol_36m, 0)
    }))
}

/**
 * Calcula score por clase: momentum (12m) + coste (TER) + penalización por volatilidad.
 * Ponderaciones dependen del perfil.
 */
export function scoreUniverse(list = [], perfil) {
  const weightsFor = (p) => {
    if (p === 'conservador') return { mom: 0.30, coste: 0.30, vol: 0.40 }
    if (p === 'moderado')    return { mom: 0.45, coste: 0.25, vol: 0.30 }
    return                    { mom: 0.55, coste: 0.20, vol: 0.25 } // dinámico
  }
  const W = weightsFor(perfil)

  // agrupamos por clase para normalizar intra-clase
  const byClase = list.reduce((acc, x) => {
    (acc[x.clase] ||= []).push(x)
    return acc
  }, {})

  const withScore = []
  const min = (a) => a.length ? Math.min(...a) : 0
  const max = (a) => a.length ? Math.max(...a) : 1
  const scale = (v, lo, hi, invert = false) => {
    if (!Number.isFinite(v)) v = 0
    if (hi === lo) return 0.5
    const t = clamp((v - lo) / (hi - lo), 0, 1)
    return invert ? 1 - t : t
  }

  for (const clase of Object.keys(byClase)) {
    const arr = byClase[clase]
    const momVals = arr.map(x => safeNum(x.ret_12m, 0))
    const terVals = arr.map(x => safeNum(x.ter, 0))
    const volVals = arr.map(x => safeNum(x.vol_36m, 0))

    const momLo = min(momVals), momHi = max(momVals)
    const terLo = min(terVals), terHi = max(terVals)
    const volLo = min(volVals), volHi = max(volVals)

    for (const x of arr) {
      const s_mom  = scale(safeNum(x.ret_12m, 0), momLo, momHi, false)
      const s_cost = scale(safeNum(x.ter, 0),     terLo, terHi, true)  // menor TER = mejor
      const s_vol  = scale(safeNum(x.vol_36m, 0), volLo, volHi, true)  // menor vol = mejor
      const score  = W.mom * s_mom + W.coste * s_cost + W.vol * s_vol
      withScore.push({ ...x, score })
    }
  }
  return withScore
}

// ----------------- Construcción de cartera -----------------
/**
 * Construye cartera (10–12 posiciones) respetando el target por clase.
 * Acepta universo externo opcional vía `universoCustom`.
 */
export function buildPortfolio({ perfil, preferencias = {}, universoCustom } = {}) {
  const target = targetByPerfil(perfil)
  const base = filterUniverse(preferencias, universoCustom || universoDefault)
  const scored = scoreUniverse(base, perfil)

  // buckets por clase
  const equity = scored.filter(x => x.clase === 'equity').sort(by('score'))
  const bond   = scored.filter(x => x.clase === 'bond').sort(by('score'))
  const cash   = scored.filter(x => x.clase === 'cash').sort(by('score'))

  // número de posiciones por clase
  const N = 12
  const nEq = Math.max(3, Math.round(N * clamp(target.equity, 0, 1)))
  const nBd = Math.max(2, Math.round(N * clamp(target.bond,   0, 1)))
  const nCs = Math.max(1, Math.max(0, N - nEq - nBd))

  // selector con límite por subclase/region para diversificar
  const pick = (arr, n, maxPerKey = 3) => {
    const out = []
    const count = {}
    for (const x of arr) {
      if (out.length >= n) break
      const key = `${x.clase}|${x.subclase}|${x.region}`
      if ((count[key] ?? 0) >= maxPerKey) continue
      out.push(x)
      count[key] = (count[key] ?? 0) + 1
    }
    return out
  }

  const selEq = pick(equity, nEq, 3)
  const selBd = pick(bond,   nBd, 3)
  const selCs = pick(cash,   nCs, 2)

  // pesos por clase -> reparto dentro de cada clase proporcional al score
  const weights = []
  const spread = (arr, targetClassWeight) => {
    if (!arr.length) return
    const s = arr.map(x => (x.score && x.score > 0) ? x.score : 0.01)
    const w = norm(s).map(v => v * clamp(targetClassWeight, 0, 1))
    arr.forEach((x, i) => weights.push({ ...x, weight: w[i] }))
  }
  spread(selEq, target.equity)
  spread(selBd, target.bond)
  spread(selCs, target.cash)

  // normaliza a 100% y redondea a 0.5%
  const W = norm(weights.map(x => x.weight))
  const portfolio = weights.map((x, i) => ({
    ...x,
    weight: Math.round((W[i] || 0) * 200) / 2 / 100 // múltiplos de 0.5%
  }))

  // renormaliza exacto 100%
  const sum = portfolio.reduce((a, b) => a + (Number(b.weight) || 0), 0)
  const diff = 1 - sum
  if (Math.abs(diff) > 0.0001 && portfolio.length) {
    portfolio[0].weight = Number((portfolio[0].weight + diff).toFixed(4))
  }

  return portfolio
}

// ----------------- Volatilidad -----------------
/**
 * Estimación simple de volatilidad de cartera (sin covarianzas).
 */
export function estimateVol(portfolio = []) {
  const v = Math.sqrt(
    portfolio.reduce((acc, x) => {
      const w = Number(x?.weight) || 0
      const vol = Number(x?.vol_36m)
      const sx = Number.isFinite(vol) && vol > 0 ? vol : 10 // fallback 10%
      return acc + (w ** 2) * (sx ** 2)
    }, 0)
  )
  return Number(v.toFixed(1))
}
