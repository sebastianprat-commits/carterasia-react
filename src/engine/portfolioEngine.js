// src/engine/portfolioEngine.js

/* ---------- Objetivo por perfil ---------- */
export function targetByPerfil(perfil) {
  const p = String(perfil || "").toLowerCase();
  const map = {
    conservador: { equity: 0.25, bond: 0.65, cash: 0.10 },
    moderado:    { equity: 0.50, bond: 0.45, cash: 0.05 },
    dinamico:    { equity: 0.70, bond: 0.25, cash: 0.05 },
    agresivo:    { equity: 0.85, bond: 0.10, cash: 0.05 }
  };
  return map[p] || map.moderado;
}

/* ---------- Estimación de volatilidad ---------- */
export function estimateVol(portfolio = []) {
  if (!Array.isArray(portfolio) || portfolio.length === 0) return 0;

  const heur = (item) => {
    const cls = (item?.clase || "").toLowerCase();
    if (cls === "equity") return 18;
    if (cls === "bond")   return 6;
    if (cls === "reit")   return 20;
    if (cls === "cash")   return 0.5;
    return 10;
  };

  const wavg = portfolio.reduce((acc, it) => {
    const w = Number(it?.weight) || 0;
    const v = Number(it?.vol_36m);
    const vol = Number.isFinite(v) ? v : heur(it);
    return acc + w * vol;
  }, 0);

  return Number(wavg.toFixed(1));
}

/* ---------- Motor simple de cartera ---------- */
export function buildPortfolio({ perfil, preferencias = {}, universo = [] } = {}) {
  if (!perfil) return [];

  const tgt = targetByPerfil(perfil);

  const esgWanted =
    String(preferencias?.preferenciaESG).toLowerCase() === "si" || preferencias?.preferenciaESG === true;
  const traspWanted =
    String(preferencias?.fondosTraspasables).toLowerCase() === "si" || preferencias?.fondosTraspasables === true;

  // Sanea y filtra universo
  const U = (universo || [])
    .filter((x) => x && x.ticker && x.nombre && x.clase)
    .filter((x) => (esgWanted ? x.esg === true : true))
    .filter((x) => (traspWanted ? x.traspasable === true : true))
    .map((x) => ({ ...x, ter: typeof x.ter === "number" ? x.ter : 0 }));

  const EQ = U.filter((x) => x.clase === "equity");
  const BD = U.filter((x) => x.clase === "bond");
  const CS = U.filter((x) => x.clase === "cash");

  const byLowTer = (a, b) => (a.ter ?? 1) - (b.ter ?? 1);
  const pick = (arr, n) => arr.slice(0, Math.max(0, n));

  const eqPicks = diversifyEquity(EQ).sort(byLowTer);
  const bdPicks = diversifyBonds(BD).sort(byLowTer);
  const csPicks = pick(CS.sort(byLowTer), 1);

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
    return items.map((x) => ({ ...x, weight: Number(w.toFixed(6)) }));
  };

  const combined = [
    ...spread(eq, eqW),
    ...spread(bd, bdW),
    ...spread(cs, csW),
  ];

  const sum = combined.reduce((acc, p) => acc + (Number(p.weight) || 0), 0) || 1;
  return combined.map((p) => ({ ...p, weight: Number((p.weight / sum).toFixed(6)) }));
}

/* ---------- Helpers internos ---------- */
function diversifyEquity(equity) {
  if (!equity?.length) return [];
  const core = equity.slice().sort((a, b) => (a.ter ?? 1) - (b.ter ?? 1));
  const pick = (fn) => core.find(fn);

  const chosen = [
    // World / All-World
    pick((x) => /all-?world/i.test(x?.subclase ?? "") || /dm world/i.test(x?.subclase ?? "") || /world/i.test(x?.nombre ?? "")) || core[0],
    // USA
    pick((x) => /usa/i.test(x?.region ?? "") || /us/i.test(x?.subclase ?? "")),
    // Europe
    pick((x) => /europe/i.test(x?.region ?? "") || /europe/i.test(x?.subclase ?? "")),
    // Emerging
    pick((x) => /emerg/i.test(x?.region ?? "") || /em/i.test(x?.subclase ?? "")),
    // Small Cap
    pick((x) => /small cap/i.test(x?.subclase ?? "")),
    // Tech/NASDAQ
    pick((x) => /tech|information technology|nasdaq/i.test(x?.subclase ?? "") || /tech/i.test(x?.nombre ?? "")),
  ].filter(Boolean);

  const seen = new Set();
  const out = [];
  for (const it of chosen) {
    if (it && !seen.has(it.ticker)) { seen.add(it.ticker); out.push(it); }
  }
  return out.slice(0, 6);
}

function diversifyBonds(bonds) {
  if (!bonds?.length) return [];
  const findKw = (kw) =>
    bonds.find((b) => [b.subclase, b.nombre].join(' ').toLowerCase().includes(kw));

  const chosen = [
    findKw('aggregate') || bonds[0],
    findKw('gov 1-3') || findKw('0-3') || findKw('short'),
    findKw('gov 7-10') || findKw('7-10'),
    findKw('corp') || findKw('investment grade'),
    findKw('inflation') || findKw(' il '),
    findKw('high yield') || findKw(' hy'),
  ].filter(Boolean);

  const seen = new Set();
  const out = [];
  for (const it of chosen) {
    if (it && !seen.has(it.ticker)) { seen.add(it.ticker); out.push(it); }
  }
  return out.slice(0, 4);
}



