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
  // ¿usuario premium? (pásalo en navigate/link: state: { premium: true })
  const isPremium = state?.premium === true;

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

  // 4.1) KPIs extra para el informe (se calculan DESPUÉS de portfolio)
  const kpis = useMemo(() => {
    const terW = portfolio.reduce((a, p) => a + (Number(p.ter) || 0) * (Number(p.weight) || 0), 0);
    const nEq = portfolio.filter(p => p.clase === 'equity').length;
    const nBd = portfolio.filter(p => p.clase === 'bond').length;
    const nCash = portfolio.filter(p => p.clase === 'cash').length;
    const byRegion = {};
    for (const p of portfolio) {
      const r = p.region || 'N/A';
      byRegion[r] = (byRegion[r] || 0) + (Number(p.weight) || 0);
    }
    const topRegions = Object.entries(byRegion)
      .sort((a,b)=>b[1]-a[1])
      .slice(0,6)
      .map(([r,w])=>({ region:r, peso:w }));

    return {
      terPonderado: Number((terW).toFixed(4)),
      nEq, nBd, nCash, topRegions
    };
  }, [portfolio]);

 // 5) PDF WOW (multi-sección, paginado, DEMO/Premium) CON GRÁFICAS
const handleDownloadPDF = async ({ demo = false } = {}) => {
  try {
    if (!perfil || portfolio.length === 0) {
      alert('No hay datos para generar el PDF.');
      return;
    }

    const pdf = await PDFDocument.create();
    const A4 = { w: 595.28, h: 841.89 };
    const M = 40;
    const rowH = 14;
    const headerGap = 36;
    const footerH = 30;

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontB = await pdf.embedFont(StandardFonts.HelveticaBold);

    const drawHeader = (page, title, pageNum, totalHint) => {
      page.drawText(`${SITE_NAME} — Informe de Cartera`, {
        x: M, y: A4.h - M + 6, size: 10, font: fontB, color: rgb(0.05, 0.25, 0.65)
      });
      page.drawText(title, { x: M, y: A4.h - M - 8, size: 14, font: fontB });
      page.drawLine({ start: { x: M, y: A4.h - M - 14 }, end: { x: A4.w - M, y: A4.h - M - 14 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
      page.drawLine({ start: { x: M, y: footerH }, end: { x: A4.w - M, y: footerH }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
      page.drawText(`Página ${pageNum}${totalHint ? ` de ${totalHint}` : ''}`, {
        x: A4.w - M - 120, y: footerH - 16, size: 9, font: fontB, color: rgb(0.35, 0.35, 0.35)
      });
    };

    const drawWatermarkDemo = (page) => {
      if (!demo) return;
      page.drawText('DEMO', {
        x: A4.w / 2 - 80,
        y: A4.h / 2,
        size: 80,
        font: fontB,
        color: rgb(0.92, 0.92, 0.92),
        rotate: { type: 'degrees', angle: 30 }
      });
    };

    const drawKV = (page, x, y, label, value) => {
      page.drawText(label, { x, y, size: 10, font: font, color: rgb(0.35,0.35,0.35) });
      page.drawText(String(value), { x, y: y - 14, size: 12, font: fontB });
    };

    const drawSectionTitle = (page, title, y0) => {
      page.drawText(title, { x: M, y: y0, size: 13, font: fontB });
      page.drawLine({ start: { x: M, y: y0 - 6 }, end: { x: A4.w - M, y: y0 - 6 }, thickness: 1, color: rgb(0.85,0.85,0.85) });
    };

    const drawTableHeader = (page, y0, cols) => {
      cols.forEach(c =>
        page.drawText(c.label, { x: c.x, y: y0, size: 11, font: fontB, color: rgb(0.1, 0.1, 0.1) })
      );
      page.drawLine({ start: { x: M, y: y0 - 8 }, end: { x: A4.w - M, y: y0 - 8 }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
      return y0 - 14;
    };

    const textWidth = (t, size = 11) => font.widthOfTextAtSize(String(t), size);

    // ==================== Portada ====================
    let pageNum = 1;
    let cover = pdf.addPage([A4.w, A4.h]);
    drawHeader(cover, 'Portada', pageNum);
    drawWatermarkDemo(cover);

    let y = A4.h - M - headerGap;
    const T = (txt, size = 11, bold = false, color = rgb(0, 0, 0)) => {
      cover.drawText(String(txt), { x: M, y, size, font: bold ? fontB : font, color });
      y -= size + 4;
    };
    T(`Fecha: ${new Date().toLocaleString()}`, 10, false, rgb(0.25, 0.25, 0.25));
    if (nombre) T(`Usuario: ${nombre}`);
    T(`Perfil inversor: ${String(perfil).toUpperCase()}`, 12, true, rgb(0.05, 0.25, 0.65));

    // KPIs portada
    y -= 6;
    drawSectionTitle(cover, 'Resumen ejecutivo', y); y -= 24;
    drawKV(cover, M, y, 'Asignación objetivo', `Equity ${pct(target?.equity)} · Bond ${pct(target?.bond)} · Cash ${pct(target?.cash)}`);
    drawKV(cover, M + 260, y, 'Volatilidad estimada', `~${volEst}%`);
    y -= 36;
    drawKV(cover, M, y, 'TER ponderado', `${(kpis.terPonderado * 100).toFixed(2)}%`);
    drawKV(cover, M + 260, y, 'Nº posiciones', portfolio.length);
    y -= 44;

    // Metodología breve
    drawSectionTitle(cover, 'Metodología (resumen)', y); y -= 20;
    [
      'Universo UCITS curado, foco en costes bajos y liquidez.',
      'Scoring interno: momentum 12m, coste (TER) y penalización por volatilidad.',
      'Asignación estratégica por perfil con límites por clase/subclase/región.',
      'Rebalanceo trimestral o ante desviaciones significativas.'
    ].forEach(s => { cover.drawText(`• ${s}`, { x: M, y, size: 11, font }); y -= 14; });

    y -= 8;
    cover.drawText('Aviso: Informe educativo. No constituye recomendación personalizada.', {
      x: M, y, size: 9, font, color: rgb(0.35, 0.35, 0.35)
    });

// ==================== Visualizaciones (gráficas) ====================
{
  pageNum++;
  const page = pdf.addPage([A4.w, A4.h]);
  drawHeader(page, 'Visualizaciones', pageNum);
  drawWatermarkDemo(page);

  // Datos de las gráficas
  const slices = [
    { label: 'Equity', value: clamp01(target?.equity ?? 0), color: '#2563eb' },
    { label: 'Bond',   value: clamp01(target?.bond   ?? 0), color: '#10b981' },
    { label: 'Cash',   value: clamp01(target?.cash   ?? 0), color: '#f59e0b' }
  ];
  const bars = (kpis.topRegions.length ? kpis.topRegions : [{region:'N/A', peso:1}]).map(r => ({
    label: r.region, value: clamp01(r.peso)
  }));

  // --- NUEVO: pesos reales por clase (a partir del portfolio)
  const sumClass = (cls) => portfolio
    .filter(p => p.clase === cls)
    .reduce((a,p)=> a + (Number(p.weight)||0), 0);

  const actualEquity = clamp01(sumClass('equity'));
  const actualBond   = clamp01(sumClass('bond'));
  const actualCash   = clamp01(sumClass('cash'));

  // Datos agrupados objetivo vs actual
  const grouped = [
    { label: 'Equity', objetivo: clamp01(target?.equity ?? 0), actual: actualEquity },
    { label: 'Bond',   objetivo: clamp01(target?.bond   ?? 0), actual: actualBond   },
    { label: 'Cash',   objetivo: clamp01(target?.cash   ?? 0), actual: actualCash   }
  ];

  // Render canvas -> PNG (dataURL)
  const pieUrl   = await renderPiePng({  width: 520, height: 260, slices, title: 'Asignación objetivo' });
  const barsUrl  = await renderBarsPng({ width: 520, height: 260, data: bars, title: 'Top regiones por peso' });
  const grpUrl   = await renderGroupedBarsPng({ width: 520, height: 260, data: grouped, title: 'Objetivo vs Actual' }); // NUEVO

  // Empotrar imágenes en PDF
  const pieBytes  = await (await fetch(pieUrl)).arrayBuffer();
  const barsBytes = await (await fetch(barsUrl)).arrayBuffer();
  const grpBytes  = await (await fetch(grpUrl)).arrayBuffer(); // NUEVO

  const pieImg  = await pdf.embedPng(pieBytes);
  const barsImg = await pdf.embedPng(barsBytes);
  const grpImg  = await pdf.embedPng(grpBytes); // NUEVO

  // Dibujo en página 1 de visualizaciones (tarta + regiones)
  const imgW = 520, imgH = 260;
  page.drawImage(pieImg,  { x: (A4.w - imgW)/2, y: A4.h - M - headerGap - imgH - 10, width: imgW, height: imgH });
  page.drawImage(barsImg, { x: (A4.w - imgW)/2, y: footerH + 40,                    width: imgW, height: imgH });

  // NUEVO: segunda página para la comparativa Objetivo vs Actual
  pageNum++;
  const page2 = pdf.addPage([A4.w, A4.h]);
  drawHeader(page2, 'Visualizaciones (comparativa)', pageNum);
  drawWatermarkDemo(page2);
  page2.drawImage(grpImg, { x: (A4.w - imgW)/2, y: A4.h/2 - imgH/2, width: imgW, height: imgH });
}


    // ==================== Tabla Cartera (paginada) ====================
    const rowsAll = portfolio.map((p, i) => ({
      pos: String(i + 1).padStart(2, '0'),
      ticker: p.ticker || '',
      nombre: p.nombre || '',
      clase: p.clase || '',
      region: p.region || '',
      ter: Number.isFinite(Number(p.ter)) ? `${(Number(p.ter) * 100).toFixed(2)}%` : '-',
      peso: pct(p.weight)
    }));

    const rows = demo ? rowsAll.slice(0, 3) : rowsAll;

    const colsMain = [
      { key: 'pos',    x: M,       w: 26,  align: 'left',  label: 'Pos' },
      { key: 'ticker', x: M + 28,  w: 58,  align: 'left',  label: 'Ticker' },
      { key: 'nombre', x: M + 90,  w: 232, align: 'left',  label: 'Nombre' },
      { key: 'clase',  x: M + 326, w: 54,  align: 'left',  label: 'Clase' },
      { key: 'region', x: M + 384, w: 60,  align: 'left',  label: 'Reg' },
      { key: 'ter',    x: M + 448, w: 54,  align: 'right', label: 'TER' },
      { key: 'peso',   x: M + 506, w: 54,  align: 'right', label: 'Peso' }
    ];

    const bottomLimit = footerH + 16;
    const drawTablePage = (title, list) => {
      pageNum++;
      const page = pdf.addPage([A4.w, A4.h]);
      drawHeader(page, title, pageNum);
      drawWatermarkDemo(page);
      let yy = drawTableHeader(page, A4.h - M - headerGap, colsMain);
      for (const r of list) {
        if (yy - rowH < bottomLimit) {
          pageNum++;
          const page2 = pdf.addPage([A4.w, A4.h]);
          drawHeader(page2, `${title} (cont.)`, pageNum);
          drawWatermarkDemo(page2);
          yy = drawTableHeader(page2, A4.h - M - headerGap, colsMain);
          const name = r.nombre.length > 36 ? `${r.nombre.slice(0, 34)}…` : r.nombre;
          colsMain.forEach(c => {
            const val = c.key === 'nombre' ? name : r[c.key];
            const tw = textWidth(val, 11);
            const x = c.align === 'right' ? c.x + c.w - tw : c.x;
            page2.drawText(String(val), { x, y: yy, size: 11, font });
          });
          yy -= rowH;
          continue;
        }
        const name = r.nombre.length > 36 ? `${r.nombre.slice(0, 34)}…` : r.nombre;
        colsMain.forEach(c => {
          const val = c.key === 'nombre' ? name : r[c.key];
          const tw = textWidth(val, 11);
          const x = c.align === 'right' ? c.x + c.w - tw : c.x;
          page.drawText(String(val), { x, y: yy, size: 11, font });
        });
        yy -= rowH;
      }
    };

    drawTablePage('Cartera sugerida', rows);

    // ==================== Detalle Equity ====================
    const eqRows = (demo ? portfolio.slice(0, 3) : portfolio)
      .filter(p => p.clase === 'equity')
      .map((p, i) => ({
        pos: String(i + 1).padStart(2, '0'),
        ticker: p.ticker || '',
        nombre: p.nombre || '',
        subclase: p.subclase || '',
        region: p.region || '',
        ter: Number.isFinite(Number(p.ter)) ? `${(Number(p.ter) * 100).toFixed(2)}%` : '-',
        peso: pct(p.weight)
      }));

    const colsEq = [
      { key: 'pos',     x: M,       w: 26,  align: 'left',  label: 'Pos' },
      { key: 'ticker',  x: M + 28,  w: 58,  align: 'left',  label: 'Ticker' },
      { key: 'nombre',  x: M + 90,  w: 210, align: 'left',  label: 'Nombre' },
      { key: 'subclase',x: M + 304, w: 102, align: 'left',  label: 'Subclase' },
      { key: 'region',  x: M + 410, w: 60,  align: 'left',  label: 'Reg' },
      { key: 'ter',     x: M + 474, w: 44,  align: 'right', label: 'TER' },
      { key: 'peso',    x: M + 522, w: 38,  align: 'right', label: 'Peso' }
    ];

    const drawTableGeneric = (title, cols, list) => {
      if (!list.length) return;
      pageNum++;
      let page = pdf.addPage([A4.w, A4.h]);
      drawHeader(page, title, pageNum);
      drawWatermarkDemo(page);
      let yy = drawTableHeader(page, A4.h - M - headerGap, cols);
      for (const r of list) {
        if (yy - rowH < bottomLimit) {
          pageNum++;
          page = pdf.addPage([A4.w, A4.h]);
          drawHeader(page, `${title} (cont.)`, pageNum);
          drawWatermarkDemo(page);
          yy = drawTableHeader(page, A4.h - M - headerGap, cols);
        }
        cols.forEach(c => {
          const val = String(r[c.key] ?? '');
          const tw = textWidth(val, 11);
          const x = c.align === 'right' ? c.x + c.w - tw : c.x;
          page.drawText(val, { x, y: yy, size: 11, font });
        });
        yy -= rowH;
      }
    };

    drawTableGeneric('Detalle renta variable', colsEq, eqRows);

    // ==================== Detalle Bonos ====================
    const bdRows = (demo ? portfolio.slice(0, 3) : portfolio)
      .filter(p => p.clase === 'bond')
      .map((p, i) => ({
        pos: String(i + 1).padStart(2, '0'),
        ticker: p.ticker || '',
        nombre: p.nombre || '',
        subclase: p.subclase || '',
        region: p.region || '',
        ter: Number.isFinite(Number(p.ter)) ? `${(Number(p.ter) * 100).toFixed(2)}%` : '-',
        peso: pct(p.weight)
      }));

    drawTableGeneric('Detalle renta fija', colsEq, bdRows);

    // ==================== Top regiones ====================
    {
      pageNum++;
      const page = pdf.addPage([A4.w, A4.h]);
      drawHeader(page, 'Exposición por regiones (top)', pageNum);
      drawWatermarkDemo(page);
      let yy = A4.h - M - headerGap;

      kpis.topRegions.forEach(({ region, peso }) => {
        page.drawText(region, { x: M, y: yy, size: 11, font: fontB });
        const barW = (A4.w - M * 2 - 140) * clamp01(peso);
        page.drawText(pct(peso), { x: A4.w - M - 60, y: yy, size: 11, font });
        page.drawLine({ start: { x: M + 120, y: yy + 4 }, end: { x: M + 120 + barW, y: yy + 4 }, thickness: 6, color: rgb(0.16, 0.45, 0.9) });
        yy -= 24;
      });
    }

    // ==================== Metodología & rebalanceo ====================
    {
      pageNum++;
      const page = pdf.addPage([A4.w, A4.h]);
      drawHeader(page, 'Metodología y rebalanceo', pageNum);
      drawWatermarkDemo(page);
      let yy = A4.h - M - headerGap;

      const bullet = (s) => { page.drawText(`• ${s}`, { x: M, y: yy, size: 11, font }); yy -= 16; };
      [
        'Selección: universe UCITS, costes bajos, liquidez y réplica transparente.',
        'Score: momentum 12m/6m, TER, volatilidad 36m (si disponible).',
        'Límites: concentración por activo, por subclase y por región.',
        'Rebalanceo: trimestral o desvío >25% del peso objetivo por bloque.',
        'Control de riesgo: asignación por perfil y seguimiento de drawdowns.'
      ].forEach(bullet);
    }

    // ==================== Riesgos clave ====================
    {
      pageNum++;
      const page = pdf.addPage([A4.w, A4.h]);
      drawHeader(page, 'Riesgos clave (resumen)', pageNum);
      drawWatermarkDemo(page);
      let yy = A4.h - M - headerGap;

      const risk = (name, desc, prob, imp, mit) => {
        page.drawText(name, { x: M, y: yy, size: 12, font: fontB }); yy -= 14;
        page.drawText(desc, { x: M, y: yy, size: 11, font }); yy -= 14;
        page.drawText(`Prob.: ${prob} · Impacto: ${imp} · Mitigación: ${mit}`, { x: M, y: yy, size: 11, font, color: rgb(0.25,0.25,0.25) }); yy -= 18;
      };

      risk('Rebrote de inflación', 'Repunte de IPC que penaliza duraciones largas y múltiplos de equity.', 'Media', 'Alta', 'Duración diversificada, sesgo IG, cash táctico.');
      risk('Desaceleración global', 'Caída de beneficios y ciclo industrial débil.', 'Media', 'Media/Alta', 'Sesgo a calidad, defensivos y grado de inversión.');
      risk('Geopolítica', 'Tensiones en rutas y materias primas elevan volatilidad.', 'Baja/Media', 'Media', 'Diversificación regional y gestión de divisa.');
    }

    // ==================== Glosario & Avisos ====================
    {
      pageNum++;
      const page = pdf.addPage([A4.w, A4.h]);
      drawHeader(page, 'Glosario & Avisos', pageNum);
      drawWatermarkDemo(page);
      let yy = A4.h - M - headerGap;

      const line = (s, size = 11, bold = false) => { page.drawText(s, { x: M, y: yy, size, font: bold ? fontB : font }); yy -= size + 6; };

      line('TER (Total Expense Ratio): coste anual del vehículo sobre patrimonio.', 11);
      line('Volatilidad: oscilación histórica del precio; no predice resultados futuros.', 11);
      line('Momentum 12m: rendimiento a 12 meses usado como señal de tendencia.', 11);
      yy -= 8;
      line('Aviso legal', 12, true);
      line('Este documento es informativo y no constituye recomendación personalizada ni oferta de compra/venta.', 10);
      line('La inversión conlleva riesgos, incluido la posible pérdida del capital invertido.', 10);
    }

    // Guardar y descargar
    const bytes = await pdf.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = demo ? `cartera_${perfil}_DEMO.pdf` : `cartera_${perfil}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (e) {
    console.error('PDF error:', e);
    alert('No se pudo generar el PDF. Revisa la consola.');
  }
};


  // 6) DEMO Premium (servidor)
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

  // Filas visibles en UI (teaser si no es premium)
  const visibleRows = isPremium ? portfolio : portfolio.slice(0, 3);

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
            {visibleRows.map((p, i) => (
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
          {!isPremium && portfolio.length > 3 && (
            <tfoot>
              <tr className="border-t dark:border-gray-700">
                <td colSpan={7} className="p-3 text-center text-gray-500">
                  {portfolio.length - 3} posiciones más — <span className="font-medium">Solo en Premium</span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="mt-6 flex gap-3 flex-wrap">
        {!isPremium ? (
          <>
            <button
              onClick={() => handleDownloadPDF({ demo: true })}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Descargar PDF (DEMO)
            </button>
            <button
              onClick={() => alert('Función Premium: actívala para ver la cartera completa y el informe completo.')}
              className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
            >
              Ver informe completo (Premium)
            </button>
          </>
        ) : (
          <button
            onClick={() => handleDownloadPDF({ demo: false })}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Descargar informe completo (PDF)
          </button>
        )}

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

// Helper de texto multilínea (usado en portada si lo necesitas)
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

// ===== Helpers para gráficas (canvas offscreen -> PNG) =====
async function renderPiePng({ width=520, height=260, slices=[], title='Gráfico' }) {
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');

  // fondo
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,width,height);

  // título
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(title, 12, 22);

  const total = slices.reduce((a,s)=>a+(Number(s.value)||0),0) || 1;
  const cx = 110, cy = height/2 + 8, r = Math.min(90, height/2 - 20);

  // tarta
  let start = -Math.PI/2;
  slices.forEach(s=>{
    const val = (Number(s.value)||0)/total;
    const end = start + val * Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,start,end);
    ctx.closePath();
    ctx.fillStyle = s.color || '#999999';
    ctx.fill();
    start = end;
  });

  // borde
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.stroke();

  // leyenda
  const legendX = 230, legendY = 50;
  ctx.font = '13px Arial';
  slices.forEach((s, i)=>{
    const y = legendY + i*24;
    ctx.fillStyle = s.color || '#999999';
    ctx.fillRect(legendX, y-10, 14, 14);
    ctx.fillStyle = '#111827';
    const pct = `${Math.round((Number(s.value)||0)/total*100)}%`;
    ctx.fillText(`${s.label || 'Item'} — ${pct}`, legendX + 20, y+2);
  });

  return c.toDataURL('image/png');
}

async function renderBarsPng({ width=520, height=260, data=[], title='Gráfico' }) {
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');

  // fondo
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,width,height);

  // título
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(title, 12, 22);

  // área de gráfico
  const padL = 60, padR = 16, padB = 40, padT = 30;
  const gw = width - padL - padR;
  const gh = height - padT - padB;
  const x0 = padL, y0 = height - padB;

  const maxV = Math.max(0.001, ...data.map(d=>Number(d.value)||0));
  const barW = Math.max(12, Math.min(48, gw / Math.max(1, data.length) * 0.6));
  const gap = Math.max(8, (gw - barW*data.length) / Math.max(1, data.length-1));

  // ejes
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y0 - gh);
  ctx.lineTo(x0, y0);
  ctx.lineTo(x0 + gw, y0);
  ctx.stroke();

  // ticks Y
  ctx.fillStyle = '#6b7280';
  ctx.font = '12px Arial';
  for (let i=0;i<=4;i++){
    const y = y0 - (gh * i/4);
    const val = `${Math.round((maxV * i/4)*100)}%`;
    ctx.fillText(val, 8, y+4);
    ctx.strokeStyle = '#f3f4f6';
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 + gw, y);
    ctx.stroke();
  }

  // barras
  let x = x0;
  data.forEach((d, idx)=>{
    const v = (Number(d.value)||0) / maxV;
    const h = gh * v;
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(x, y0 - h, barW, h);

    // etiqueta X
    ctx.save();
    ctx.translate(x + barW/2, y0 + 14);
    ctx.rotate(-Math.PI/12);
    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    const label = String(d.label ?? `#${idx+1}`);
    ctx.fillText(label.length>14? label.slice(0,12)+'…' : label, -barW, 0);
    ctx.restore();

    // valor encima
    ctx.fillStyle = '#111827';
    ctx.font = '12px Arial';
    ctx.fillText(`${Math.round((Number(d.value)||0)*100)}%`, x, y0 - h - 4);

    x += barW + gap;
  });

  return c.toDataURL('image/png');
}
