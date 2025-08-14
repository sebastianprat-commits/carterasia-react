// src/engine/portfolioEngine.js

/**
 * Devuelve el objetivo estratégico por perfil.
 * perfiles admitidos: conservador | moderado | dinamico | agresivo
 */
export function targetByPerfil(perfil) {
  const p = String(perfil || '').toLowerCase();
  const map = {
    conservador: { equity: 0.25, bond: 0.65, cash: 0.10 },
    moderado:    { equity: 0.50, bond: 0.45, cash: 0.05 },
    dinamico:    { equity: 0.70, bond: 0.25, cash: 0.05 },
    agresivo:    { equity: 0.85, bond: 0.10, cash: 0.05 },
  };
  return map[p] || map.moderado;
}

/**
 * Estima volatilidad anualizada aprox. combinando vol_36m si existe.
 * Si no hay datos, usa heurística por clase.
 */
export function estimateVol(portfolio = []) {
  if (!Array.isArray(portfolio) || portfolio.length === 0) return 0;

  const heur = (item) => {
    // heurística básica si no trae vol_36m
    const cls = (item?.clase || '').toLowerCase();
    if (cls === 'equity') return 18;
    if (cls === 'bond')   return 6;
    if (cls === 'reit')   return 20;
    if (cls === 'cash')   return 0.5;
    return 10;
  };

  const wavg =
    portfolio.reduce((acc, it) => {
      const w = Number(it?.weight) || 0;
      const v = Number(it?.vol_36m);
      const vol = Number.isFinite(v) ? v : heur(it);
      return acc + w * vol;
    }, 0);

  return Number(wavg.toFixed(1));
}

/**
 * Motor simple de construcción de cartera:
 * - Filtra el universo por preferencias ESG/traspasables
 * - Elige candidatos por clase (equity/bond/cash)
 * - Reparte pesos según el objetivo del perfil
 * Devuelve [{ ...instrumento, weight }]
 */
export function buildPortfolio({ perfil, preferencias = {}, universo = [] } = {}) {
  if (!perfil) return [];

  // objetivo estratégico
  const tgt = targetByPerfil(perfil);

  // normaliza flags de preferencias
  const esgWanted =
    String(preferencias?.preferenciaESG).toLowerCase() === 'si' || preferencias?.preferenciaESG === true;
  const traspWanted =
    String(preferencias?.fondosTraspasables).toLowerCase() === 'si' || preferencias?.fondosTraspasables === true;

  // universo filtrado y saneado
  const U = (universo || [])
    .filter(x => x && x.ticker && x.nombre && x.clase)
    .filter(x => (esgWanted ? x.esg === true : true))
    .filter(x => (traspWanted ? x.traspasable === true : true))
    .map(x => ({ ...x, ter: typeof x.ter === 'number' ? x.ter : 0 }));

  // separa por clase
  const EQ = U.filter(x => x.clase === 'equity');
  const BD = U.filter(x => x.clase === 'bond');
  const CS = U.filter(x => x.clase === 'cash');

  // pickers muy simples (mejorar después con tu scoring)
  const byLowTer = (a, b) => (a.ter ?? 1) - (b.ter ?? 1);
  const pick = (arr, n) => arr.slice(0, Math.max(0, n));

  const eqPicks = diversifyEquity(EQ).sort(byLowTer);
  const bdPicks = diversifyBonds(BD).sort(byLowTer);
  const csPicks = pick(CS.sort(byLowTer), 1);

  // si faltan clases, rellena con lo que haya
  const eq = eqPicks.length ? eqPicks : pick(EQ.sort(byLowTer), 6);
  const bd = bdPicks.length ? bdPicks : pick(BD.sort(byLowTer), 4);
  const cs = csPicks.length ? csPicks : pick(CS.sort(byLowTer), 1);

  const clamp01 = (x) => {
    const n = Number(x);
    if (!Number.isFinite(n)) return 0;
    return Math.min(1, Math.max(0, n));
  };

  const wEq = clamp01(tgt.equity);
  const wBd = clamp01(tgt.bond);
  const wCs = clamp01(tgt.cash);
  const wSum = wEq + wBd + wCs || 1;

  const eqW = wEq / wSum;
  const bdW = wBd / wSum;
  const csW = wCs / wSum;

  const spread = (items, totalW) => {
    if (!items.length) return [];
    const w = clamp01(totalW) / items.length;
    return items.map(x => ({ ...x, weight: Number(w.toFixed(6)) }));
  };

  const combined = [
    ...spread(eq, eqW),
    ...spread(bd, bdW),
    ...spread(cs, csW),
  ];

  // normaliza por si hubo redondeos
  const sum = combined.reduce((acc, p) => acc + (Number(p.weight) || 0), 0) || 1;
  return combined.map(p => ({ ...p, weight: Number((p.weight / sum).toFixed(6)) }));
}

/* ----------------- helpers internos ----------------- */

function diversifyEquity(equity) {
  if (!equity?.length) return [];
  const core = equity.slice().sort((a, b) => (a.ter ?? 1) - (b.ter ?? 1));
  const pick = (fn) => core.find(fn);

  const chosen = [
    // World / All-World
    pick((x) => /all-?world/i.test(x?.subclase ??


