// src/components/CarteraPersonalizada.jsx
import React, { useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { buildPortfolio, estimateVol, targetByPerfil } from '../engine/portfolioEngine';
import universoBase from '../data/universo.json';
import { SITE_NAME } from '../constants/brand';

function pct(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '0.0%';
  return `${(num * 100).toFixed(1)}%`;
}

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export default function CarteraPersonalizada() {
  const { state } = useLocation();
  const perfil = state?.perfil;
  const email = state?.email;
  const nombre = state?.nombre;
  const preferencias = {
    moneda: state?.moneda || 'EUR',
    preferenciaESG: state?.preferenciaESG || 'no',
    fondosTraspasables: state?.fondosTraspasables || 'no',
  };

  // 1) Universo filtrado por preferencias
  const universo = useMemo(() => {
    const esgWanted =
      String(preferencias.preferenciaESG).toLowerCase() === 'si' || preferencias.preferenciaESG === true;
    const traspWanted =
      String(preferencias.fondosTraspasables).toLowerCase() === 'si' || preferencias.fondosTraspasables === true;

    return (universoBase || [])
      .filter((x) => x && x.ticker && x.nombre && x.clase && x.region)
      .filter((x) => (esgWanted ? x.esg === true : true))
      .filter((x) => (traspWanted ? x.traspasable === true : true))
      .map((x) => ({
        ...x,
        ter: typeof x.ter === 'number' ? x.ter : 0,
      }));
  }, [preferencias]);

  // 2) Target por perfil
  const target = useMemo(() => targetByPerfil(perfil), [perfil]);

  // 3) Cartera (motor -> fallback)
  const portfolio = useMemo(() => {
    if (!perfil) return [];

    try {
      const candidate = buildPortfolio({ perfil, preferencias, universo });
      if (Array.isArray(candidate) && candidate.length > 0) return normalizeWeights(candidate);
    } catch {
      try {
        const candidate = buildPortfolio({ perfil, preferencias });
        if (Array.isArray(candidate) && candidate.length > 0) return normalizeWeights(candidate);
      } catch {
        // seguimos a fallback
      }
    }

    const equity = universo.filter((x) => x.clase === 'equity');
    const bond = universo.filter((x) => x.clase === 'bond');
    const cash = universo.filter((x) => x.clase === 'cash');

    const pick = (arr, n = 3) => arr.slice(0, Math.max(0, n));

    const equityPicks = diversifyEquity(equity);
    const bondPicks = diversifyBonds(bond);

    const wEq = clamp01(target?.equity ?? 0.6);
    const wBd = clamp01(target?.bond ?? 0.35);
    const wCs = clamp01(target?.cash ?? 0.05);
    const wSum = wEq + wBd + wCs || 1;

    const eqWeight = wEq / wSum;
    const bdWeight = wBd / wSum;
    const csWeight = wCs / wSum;

    const eqList = spreadWeights(equityPicks, eqWeight);
    const bdList = spreadWeights(bondPicks, bdWeight);
    const csList = spreadWeights(pick(cash, 1), csWeight);

    return normalizeWeights([...eqList, ...bdList, ...csList]);
  }, [perfil, preferencias, universo, target]);

  // 4) Métricas
  const volEst = useMemo(() => {
    try {
      return estimateVol(portfolio);
    } catch {
      const avg = portfolio.reduce(
        (acc, p) => acc + (Number(p?.vol_36m) || 0) * (p.weight || 0),
        0
      );
      return (avg || 0).toFixed(1);
    }
  }, [portfolio]);

  const pesoTotal = useMemo(() => {
    const sum = portfolio.reduce((acc, p) => acc + (Number(p.weight) || 0), 0);
    return Math.round(sum * 1000) / 1000;
  }, [portfolio]);

  // 5) PDF (descarga local)
const handleDownloadPDF = async () => {
  if (!perfil || portfolio.length === 0) return;

  const A4 = { w: 595.28, h: 841.89 };     // puntos
  const M = 40;                             // margen
  const rowH = 14;                          // alto de fila
  const headerH = 24;                       // alto cabecera tabla
  const footerH = 30;                       // alto del pie
  const usableH = A4.h - M - footerH - 60;  // zona útil por página

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontB = await pdf.embedFont(StandardFonts.HelveticaBold);

  const drawHeader = (page, title, pageIndex, pageCount) => {
    page.drawText(`${SITE_NAME} — Informe de Cartera`, {
      x: M, y: A4.h - M + 6, size: 10, font: fontB, color: rgb(0.05, 0.25, 0.65)
    });
    page.drawText(title, { x: M, y: A4.h - M - 8, size: 14, font: fontB });
    page.drawLine({ start: {x: M, y: A4.h - M - 14}, end: {x: A4.w - M, y: A4.h - M - 14},
      thickness: 1, color: rgb(0.8,0.8,0.8) });
    // Pie + numeración
    page.drawLine({ start: {x: M, y: footerH}, end: {x: A4.w - M, y: footerH},
      thickness: 1, color: rgb(0.85,0.85,0.85) });
    page.drawText(`Página ${pageIndex} de ${pageCount}`, {
      x: A4.w - M - 120, y: footerH - 16, size: 9, font, color: rgb(0.35,0.35,0.35)
    });
  };

  // 1) Portada
  {
    const page = pdf.addPage([A4.w, A4.h]);
    const y0 = A4.h - M - 20;
    drawHeader(page, 'Portada', 1, 1); // se reescribirá al final con el total real

    let y = y0 - 6;
    page.drawText(`Fecha: ${new Date().toLocaleString()}`, { x: M, y, size: 10, font, color: rgb(0.25,0.25,0.25)}); y -= 16;
    if (nombre) { page.drawText(`Usuario: ${nombre}`, { x: M, y, size: 11, font }); y -= 16; }
    page.drawText(`Perfil inversor: ${String(perfil).toUpperCase()}`, { x: M, y, size: 12, font: fontB, color: rgb(0.05, 0.25, 0.65)}); y -= 18;

    page.drawText(
      `Asignación objetivo → Equity ${pct(target?.equity)}, Bond ${pct(target?.bond)}, Cash ${pct(target?.cash)}`,
      { x: M, y, size: 11, font }
    ); y -= 16;
    page.drawText(`Volatilidad estimada (aprox): ~${volEst}%`, { x: M, y, size: 11, font }); y -= 20;

    wrapText(page, 'Metodología (resumen):', { x: M, y, size: 12, font: fontB }); y -= 16;
    [
      'Universo UCITS curado, costes bajos y clases sencillas.',
      'Scoring interno: momentum 12m, coste (TER) y penalización por volatilidad.',
      'Asignación estratégica por perfil y límites por clase/subclase/región.',
      'Rebalanceo trimestral o por desviaciones significativas.'
    ].forEach(s => { wrapText(page, `• ${s}`, { x: M, y, size: 11, font }); y -= 14; });

    y -= 8;
    wrapText(page, 'Aviso legal: Informe educativo. No constituye recomendación personalizada.',
      { x: M, y, size: 9, font, color: rgb(0.35,0.35,0.35) });
  }

  // 2) Tabla paginada (todas las filas)
  const rows = portfolio.map((p, i) => ({
    pos: String(i + 1).padStart(2, '0'),
    ticker: p.ticker || '',
    nombre: p.nombre || '',
    clase: p.clase || '',
    region: p.region || '',
    ter: Number.isFinite(Number(p.ter)) ? `${(Number(p.ter) * 100).toFixed(2)}%` : '-',
    peso: pct(p.weight)
  }));

  // Cálculo de filas por página
  const rowsPerPage = Math.max(1, Math.floor((usableH - headerH) / rowH));
  const pagesNeeded = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  let pageIndex = 0;
  let printed = 0;

  while (printed < rows.length || pagesNeeded === 1) {
    pageIndex++;
    const page = pdf.addPage([A4.w, A4.h]);
    drawHeader(page, 'Cartera sugerida', pageIndex + 1, pagesNeeded + 1); // +1 por portada

    // Cabecera de columnas
    let y = A4.h - M - 36;
    const cols = [
      { key: 'pos',    x: M,       w: 26,  align: 'left', label: 'Pos' },
      { key: 'ticker', x: M + 28,  w: 58,  align: 'left', label: 'Ticker' },
      { key: 'nombre', x: M + 90,  w: 232, align: 'left', label: 'Nombre' },
      { key: 'clase',  x: M + 326, w: 54,  align: 'left', label: 'Clase' },
      { key: 'region', x: M + 384, w: 60,  align: 'left', label: 'Reg' },
      { key: 'ter',    x: M + 448, w: 54,  align: 'right', label: 'TER' },
      { key: 'peso',   x: M + 506, w: 54,  align: 'right', label: 'Peso' }
    ];

    cols.forEach(c =>
      page.drawText(c.label, { x: c.x, y, size: 11, font: fontB, color: rgb(0.1,0.1,0.1) })
    );
    y -= 8;
    page.drawLine({ start: {x: M, y}, end: {x: A4.w - M, y}, thickness: 1, color: rgb(0.85,0.85,0.85) });
    y -= 8;

    const slice = rows.slice(printed, printed + rowsPerPage);
    slice.forEach(r => {
      // Nombre truncado si hace falta
      const name = r.nombre.length > 36 ? `${r.nombre.slice(0, 34)}…` : r.nombre;

      cols.forEach(c => {
        const val = c.key === 'nombre' ? name : r[c.key];
        const txW = font.widthOfTextAtSize(String(val), 11);
        const x = c.align === 'right' ? c.x + c.w - txW : c.x;
        page.drawText(String(val), { x, y, size: 11, font, color: rgb(0,0,0) });
      });
      y -= rowH;
    });

    printed += slice.length;
    if (printed >= rows.length) break;
  }

  // Arregla numeración en portada (ahora que sabemos total)
  const pdfBytes = await pdf.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);

  // Descarga fiable: ancla temporal en el DOM
  const a = document.createElement('a');
  a.href = url;
  a.download = `cartera_${perfil}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => window.URL.revokeObjectURL(url), 2000);
};

// Helpers: wrapText y color opcional
function wrapText(page, text, { x, y, size = 11, font, color = rgb(0,0,0), maxWidth = 515 }) {
  const words = String(text).split(' ');
  let line = '';
  let yy = y;
  words.forEach((w, idx) => {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      page.drawText(line, { x, y: yy, size, font, color });
      yy -= 14;
      line = w;
    } else {
      line = test;
    }
    if (idx === words.length - 1) {
      page.drawText(line, { x, y: yy, size, font, color });
    }
  });
  return yy - 14;
}

  // 6) DEMO Premium (mover fuera del JSX)
  const handleVerInformeDemo = async () => {
    try {
      const payload = {
        demo: true,
        usuario: { nombre, email },
        perfil,
        objetivo: target,
        volatilidad: volEst,
        portfolio,
        macro: {
          bloques: [
            { titulo: 'EE.UU.', parrafos: [
              'Crecimiento resiliente; desinflación gradual.',
              'Fed cerca del final del ciclo restrictivo.'
            ], bullets: ['PIB 1.8–2.2%', 'IPC 2.5–3.0%'] },
            { titulo: 'Zona Euro', parrafos: [
              'Mejora cíclica moderada; BCE normalizando.'
            ], bullets: ['PIB 0.8–1.2%', 'IPC 2.0–2.5%'] },
            { titulo: 'China', parrafos: ['Apoyo selectivo; inmobiliario lastra.'] },
            { titulo: 'India', parrafos: ['Tesis estructural de crecimiento.'] },
            { titulo: 'Emergentes', parrafos: ['FX y materias primas son clave.'] }
          ]
        },
        riesgos: {
          items: [
            { nombre: 'Rebrote de inflación', descripcion: 'Retrasa recortes', probabilidad: 'Media', impacto: 'Alto', mitigacion: 'Duración diversificada, IG y cash' },
            { nombre: 'Desaceleración global', descripcion: 'Industria débil', probabilidad: 'Media', impacto: 'Medio/Alto', mitigacion: 'Sesgo a calidad/defensivos' },
            { nombre: 'Geopolítica', descripcion: 'Tensiones rutas/energía', probabilidad: 'Baja/Media', impacto: 'Medio', mitigacion: 'Diversificación regional' }
          ]
        }
      };

      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Fallo al generar el informe');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      alert('No se pudo generar el informe: ' + e.message);
    }
  };

  if (!perfil) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-4 bg-white dark:bg-gray-900 shadow-md rounded text-center">
        <h2 className="text-xl font-bold mb-4">No se ha podido determinar tu perfil</h2>
        <p className="mb-4">Por favor, rellena el cuestionario para recibir tu cartera sugerida.</p>
        <Link to="/simulador" className="text-blue-600 underline">Volver al simulador</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">
        Tu perfil: <span className="capitalize text-blue-600">{perfil}</span>
      </h2>

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
        <button
          onClick={handleVerInformeDemo}
          className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
        >
          Ver informe DEMO (Premium)
        </button>

        <button
          onClick={handleDownloadPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Descargar PDF rápido
        </button>

        <Link to="/" className="text-blue-600 underline self-center">Volver al inicio</Link>
      </div>
    </div>
  );
}

function Th({ children }) { return <th className="p-2 text-gray-700 dark:text-gray-200">{children}</th>; }
function Td({ children }) { return <td className="p-2 text-gray-800 dark:text-gray-100">{children}</td>; }

/* -------- Helpers -------- */

function normalizeWeights(list) {
  const sum = list.reduce((acc, p) => acc + (Number(p.weight) || 0), 0);
  if (sum <= 0) return list;
  return list.map((p) => ({ ...p, weight: (Number(p.weight) || 0) / sum }));
}

function spreadWeights(items, totalWeight) {
  if (!items || items.length === 0) return [];
  const w = clamp01(totalWeight) / items.length;
  return items.map((x) => ({ ...x, weight: w }));
}

function diversifyEquity(equity) {
  if (!equity.length) return [];
  const core = equity.slice().sort((a, b) => (a.ter ?? 1) - (b.ter ?? 1));
  const pick = (fn) => core.find(fn);

  const chosen = [
    pick((x) => /all-?world/i.test(x?.subclase ?? '') || /dm world/i.test(x?.subclase ?? '') || /world/i.test(x?.nombre ?? '')) || core[0],
    pick((x) => /usa/i.test(x?.region ?? '') || /us/i.test(x?.subclase ?? '')),
    pick((x) => /europe/i.test(x?.region ?? '') || /europe/i.test(x?.subclase ?? '')),
    pick((x) => /emerg/i.test(x?.region ?? '') || /em/i.test(x?.subclase ?? '')),
    pick((x) => /small cap/i.test(x?.subclase ?? '')),
    pick((x) => /tech|information technology|nasdaq/i.test(x?.subclase ?? '') || /tech/i.test(x?.nombre ?? '')),
  ].filter(Boolean);

  const seen = new Set();
  const dedup = [];
  for (const x of chosen) {
    if (x && !seen.has(x.ticker)) { seen.add(x.ticker); dedup.push(x); }
  }
  return dedup.slice(0, 6);
}

function diversifyBonds(bonds) {
  if (!bonds.length) return [];
  const by = (kw) =>
    bonds.find((b) => [b.subclase, b.nombre].join(' ').toLowerCase().includes(kw));
  const chosen = [
    by('aggregate') || bonds[0],
    by('gov 1-3') || by('0-3') || by('short'),
    by('gov 7-10') || by('7-10'),
    by('corp') || by('investment grade'),
    by('inflation') || by(' il '),
    by('high yield') || by(' hy'),
  ].filter(Boolean);

  const seen = new Set();
  const dedup = [];
  for (const x of chosen) {
    if (x && !seen.has(x.ticker)) { seen.add(x.ticker); dedup.push(x); }
  }
  return dedup.slice(0, 4);
}
