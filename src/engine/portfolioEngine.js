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
  if (perfil === 'moderado'

