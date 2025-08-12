// src/lib/universo.js
import base from '../data/universo_v2.json'
import local from '../data/universo_local.json'

// Normalización mínima
const norm = (x) => ({
  ...x,
  ticker: x.ticker ?? null,
  isin: x.isin ?? null,
  nombre: x.nombre?.trim(),
  proveedor: x.proveedor ?? null,
  clase: x.clase ?? null,
  subclase: x.subclase ?? null,
  region: x.region ?? 'Global',
  moneda: x.moneda ?? 'EUR',
  hedged: Boolean(x.hedged),
  ucits: Boolean(x.ucits),
  traspasable: Boolean(x.traspasable),
  esg: Boolean(x.esg),
  ter: x.ter ?? null,
  benchmark: x.benchmark ?? null,
  ret_12m: x.ret_12m ?? null,
  ret_36m: x.ret_36m ?? null,
  ret_60m: x.ret_60m ?? null,
  vol_36m: x.vol_36m ?? null,
  data_as_of: x.data_as_of ?? null,
  notas: x.notas ?? null
})

// Merge por ISIN (si no hay ISIN, usa ticker)
export function loadUniverse() {
  const byKey = new Map()

  const put = (item) => {
    const k = item.isin || `T:${item.ticker}`
    if (!k) return
    const prev = byKey.get(k) || {}
    byKey.set(k, { ...prev, ...item })
  }

  base.map(norm).forEach(put)
  local.map(norm).forEach(put)

  // Validaciones suaves
  const out = Array.from(byKey.values()).filter(r => r.isin || r.ticker)
  const issues = out.filter(r => !r.nombre || !r.clase || !r.region)
  if (issues.length) {
    // Solo log en consola; más adelante podemos mostrar en Admin
    // eslint-disable-next-line no-console
    console.warn('[universo] filas incompletas:', issues.map(i => i.isin || i.ticker))
  }
  return out
}