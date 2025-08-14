// api/report.js (Vercel Serverless Function, ESM)
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

// ——— Helpers (mismos que en la plantilla, duplicados aquí para aislar la API) ———
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Number(n)));
const pct = (x, d=1) => `${(Number(x||0)*100).toFixed(d)}%`;
const fmt2 = (n) => Number(n||0).toFixed(2);

function terPonderado(portfolio){
  return portfolio.reduce((a,p)=>a+(Number(p.ter)||0)*(Number(p.weight)||0),0);
}
function shareWeighted(portfolio, key){
  return portfolio.reduce((a,p)=>a+((p[key])?Number(p.weight)||0:0),0);
}

function seriesFromReturns(ret12, ret36, ret60){
  // Normaliza a 100 y proyecta 0-60m
  const s = [
    {t:0, v:100},
    {t:12, v:100*(1+(Number(ret12)||0)/100)},
    {t:36, v:100*(1+(Number(ret36)||0)/100)},
    {t:60, v:100*(1+(Number(ret60)||0)/100)}
  ];
  return s;
}

function sparklineSVG(series, {w=360,h=90,pad=8}={}){
  const xs = series.map(p=>p.t), ys = series.map(p=>p.v);
  const xmin=Math.min(...xs), xmax=Math.max(...xs), ymin=Math.min(...ys), ymax=Math.max(...ys);
  const sx = (t)=> pad + (w-2*pad) * (xmax===xmin?0.5:(t-xmin)/(xmax-xmin));
  const sy = (v)=> h-pad - (h-2*pad) * (ymax===ymin?0.5:(v-ymin)/(ymax-ymin));
  const d = series.map((p,i)=> `${i?"L":"M"}${sx(p.t).toFixed(1)},${sy(p.v).toFixed(1)}`).join(" ");
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${w}" height="${h}" fill="white"/>
    <path d="${d}" fill="none" stroke="#0a66c2" stroke-width="2"/>
  </svg>`;
}

function esc(s=""){ return String(s).replace(/[&<>]/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m])); }

// ——— Plantilla HTML del informe ———
function buildHTML({usuario, perfil, objetivo, volatilidad, portfolio, macro, riesgos, demo}){
  const terMedio = terPonderado(portfolio);
  const pctESG = shareWeighted(portfolio, "esg");
  const pctHedged = shareWeighted(portfolio, "hedged");
  const traspasables = portfolio.filter(p=>p.traspasable).length;
  const fecha = new Date().toLocaleString();

  const header = `
  <header class="hdr">
    <div>
      <h1>CarterasIA · Informe de Cartera</h1>
      <div class="muted">Fecha: ${esc(fecha)}</div>
    </div>
    <div class="badge">${demo?"DEMO":"PRO"}</div>
  </header>`;

  const portada = `
  <section class="page portada">
    <h2>Resumen ejecutivo</h2>
    <div class="grid2">
      <div class="card">
        <h3>Usuario</h3>
        <p>${esc(usuario?.nombre||"Usuario")}</p>
        <p class="muted">${esc(usuario?.email||"")}</p>
      </div>
      <div class="card">
        <h3>Perfil</h3>
        <p class="pill">${esc(String(perfil||"").toUpperCase())}</p>
      </div>
      <div class="card">
        <h3>Objetivo estratégico</h3>
        <p>Equity ${pct(objetivo?.equity)}, Bond ${pct(objetivo?.bond)}, Cash ${pct(objetivo?.cash)}</p>
      </div>
      <div class="card">
        <h3>Volatilidad estimada</h3>
        <p><strong>~${fmt2(volatilidad)}%</strong></p>
      </div>
      <div class="card">
        <h3>Métricas agregadas</h3>
        <ul>
          <li>TER ponderado: <strong>${fmt2(terMedio)}%</strong></li>
          <li>% ESG: <strong>${pct(pctESG)}</strong> · % Hedged: <strong>${pct(pctHedged)}</strong></li>
          <li>Traspasables: <strong>${traspasables}</strong> · Nº posiciones: <strong>${portfolio.length}</strong></li>
        </ul>
      </div>
      <div class="card note">
        <h3>Aviso</h3>
        <p class="muted">Documento educativo; no constituye recomendación personalizada.</p>
      </div>
    </div>
  </section>`;

  // ——— Sección Macro ———
  const bloquesMacro = (macro?.bloques||[]).map(b=>`
    <article class="card">
      <h3>${esc(b.titulo)}</h3>
      ${(b.parrafos||[]).map(p=>`<p>${esc(p)}</p>`).join("")}
      ${b.bullets?.length?`<ul>${b.bullets.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}
    </article>
  `).join("");

  const macroHTML = `
  <section class="page">
    <h2>Contexto macro global</h2>
    <div class="grid2">${bloquesMacro}</div>
  </section>`;

  // ——— Riesgos ———
  const riesgosHTML = `
  <section class="page">
    <h2>Riesgos y momento actual</h2>
    <table class="table">
      <thead><tr><th>Riesgo</th><th>Descripción</th><th>Prob.</th><th>Impacto</th><th>Mitigación en cartera</th></tr></thead>
      <tbody>
        ${(riesgos?.items||[]).map(r=>`
          <tr>
            <td>${esc(r.nombre)}</td>
            <td>${esc(r.descripcion)}</td>
            <td>${esc(r.probabilidad)}</td>
            <td>${esc(r.impacto)}</td>
            <td>${esc(r.mitigacion)}</td>
          </tr>`).join("")}
      </tbody>
    </table>
  </section>`;

  // ——— Cartera tabla ———
  const carteraTabla = `
  <section class="page">
    <h2>Cartera sugerida</h2>
    <table class="table">
      <thead><tr><th>#</th><th>Ticker</th><th>Nombre</th><th>Clase</th><th>Región</th><th>TER</th><th>Peso</th></tr></thead>
      <tbody>
        ${portfolio.map((p,i)=>`
          <tr>
            <td>${String(i+1).padStart(2,'0')}</td>
            <td>${esc(p.ticker)}</td>
            <td>${esc(p.nombre)}</td>
            <td>${esc(p.clase)}</td>
            <td>${esc(p.region)}</td>
            <td>${fmt2((p.ter||0))}%</td>
            <td>${pct(p.weight)}</td>
          </tr>`).join("")}
      </tbody>
    </table>
  </section>`;

  // ——— Fichas por fondo ———
  const fichas = portfolio.map(p=>{
    const sFund = seriesFromReturns(p.ret_12m, p.ret_36m, p.ret_60m);
    const sBench = seriesFromReturns(p.bench_ret_12m, p.bench_ret_36m, p.bench_ret_60m);
    const svgA = sparklineSVG(sFund,{w:520,h:120});
    const svgB = sparklineSVG(sBench,{w:520,h:120});

    return `
    <section class="page ficha">
      <h2>${esc(p.nombre)} <span class="muted">(${esc(p.ticker)})</span></h2>
      <div class="grid2">
        <div class="card">
          <h3>Detalles</h3>
          <ul class="kv">
            <li><span>ISIN</span><span>${esc(p.isin||'-')}</span></li>
            <li><span>Gestora</span><span>${esc(p.gestora||p.proveedor||'-')}</span></li>
            <li><span>Comercializador</span><span>${esc(p.comercializador||'-')}</span></li>
            <li><span>Clase</span><span>${esc(p.clase||'-')}</span></li>
            <li><span>Subclase</span><span>${esc(p.subclase||'-')}</span></li>
            <li><span>Región</span><span>${esc(p.region||'-')}</span></li>
            <li><span>Moneda</span><span>${esc(p.moneda||'-')}${p.hedged?" (EUR-H)":""}</span></li>
            <li><span>UCITS / Traspasable</span><span>${p.ucits?"Sí":"No"} / ${p.traspasable?"Sí":"No"}</span></li>
            <li><span>TER</span><span>${fmt2(p.ter||0)}%</span></li>
            <li><span>Benchmark</span><span>${esc(p.benchmark||'-')}</span></li>
          </ul>
        </div>
        <div class="card">
          <h3>Evolución (normalizada a 100)</h3>
          <div class="charts">
            <figure><figcaption>Fondo</figcaption>${svgA}</figure>
            <figure><figcaption>Benchmark</figcaption>${svgB}</figure>
          </div>
        </div>
      </div>
      <div class="grid2">
        <div class="card">
          <h3>Top 5 posiciones</h3>
          <ol>
            ${(p.top_holdings||[]).slice(0,5).map(h=>`<li>${esc(h.nombre)} — ${fmt2(h.peso||0)}%</li>`).join("") || '<li class="muted">Sin datos</li>'}
          </ol>
        </div>
        <div class="card">
          <h3>Exposición sectorial</h3>
          <ul>
            ${(p.sector_breakdown||[]).slice(0,8).map(s=>`<li>${esc(s.sector)} — ${fmt2(s.peso||0)}%</li>`).join("") || '<li class="muted">Sin datos</li>'}
          </ul>
        </div>
      </div>
      <div class="card">
        <h3>Racional de la elección</h3>
        <p>${esc(p.racional||'Seleccionado por coste (TER), representatividad del benchmark, liquidez y complementariedad en la cartera.')}</p>
        ${p.alternativas?.length?`<p><strong>Alternativas:</strong> ${p.alternativas.map(a=>esc(a)).join(', ')}</p>`:''}
      </div>
      ${p.factsheet_url?`<p class="muted">Ficha del producto: ${esc(p.factsheet_url)}</p>`:''}
    </section>`;
  }).join("");

  const metodologia = `
  <section class="page">
    <h2>Metodología</h2>
    <ul>
      <li>Universo UCITS curado; preferencia por costes bajos y clases sencillas.</li>
      <li>Scoring: momentum 12m, coste (TER) y penalización por volatilidad intra-clase.</li>
      <li>Asignación estratégica por perfil y límites por clase/subclase/región.</li>
      <li>Rebalanceo trimestral o por desviaciones significativas.</li>
    </ul>
    <h3>Glosario</h3>
    <p><strong>TER</strong>: Coste total anual del fondo. <strong>Volatilidad</strong>: desviación estándar anualizada. <strong>Tracking difference</strong>: diferencia vs. benchmark.</p>
    <p class="muted">Este documento es informativo y no constituye asesoramiento financiero personalizado.</p>
  </section>`;

  const watermark = demo?`<div class="wm">DEMO · CarterasIA</div>`:"";

  const css = `
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#111; }
    .hdr { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ddd; padding-bottom:6px; margin-bottom:12px; }
    .badge { background:#0a66c2; color:#fff; padding:4px 10px; border-radius:999px; font-weight:700; }
    h1{ font-size:20px; margin:0; } h2{ font-size:18px; margin:10px 0; } h3{ font-size:14px; margin:8px 0; }
    .muted{ color:#555; }
    .pill{ display:inline-block; background:#eef5ff; border:1px solid #cfe2ff; padding:2px 8px; border-radius:8px; }
    .page{ page-break-after: always; }
    .grid2{ display:grid; grid-template-columns: 1fr 1fr; gap:10px; }
    .card{ border:1px solid #e5e7eb; border-radius:8px; padding:10px; }
    .note{ background:#fafafa; }
    .table{ width:100%; border-collapse: collapse; font-size:12px; }
    .table th, .table td{ border-top:1px solid #e5e7eb; padding:6px; text-align:left; vertical-align:top; }
    .kv{ list-style:none; padding:0; margin:0; }
    .kv li{ display:flex; justify-content:space-between; border-top:1px dashed #eee; padding:4px 0; }
    .charts figure{ margin:0 0 6px 0; }
    .ficha h2{ margin-top:0; }
    .portada { display:block; }
    .wm{ position: fixed; top: 45%; left: 50%; transform: translate(-50%, -50%) rotate(-25deg); font-size:64px; color:rgba(0,0,0,0.07); pointer-events:none; user-select:none; }
  </style>`;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>Informe CarterasIA</title>${css}</head><body>${watermark}${header}${portada}${macroHTML}${riesgosHTML}${carteraTabla}${fichas}${metodologia}</body></html>`;
}

// ——— Handler ———
export default async function handler(req, res) {
  try {
    const method = req.method || req.httpMethod;
    if (method !== 'POST') {
      res.status(405).json({ error: 'Use POST' });
      return;
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const { usuario, perfil, objetivo, volatilidad, portfolio, macro, riesgos, demo=true } = body;

    // Validación mínima
    if (!portfolio || !Array.isArray(portfolio) || portfolio.length === 0) {
      res.status(400).json({ error: 'Falta portfolio[]' });
      return;
    }

    const html = buildHTML({ usuario, perfil, objetivo, volatilidad, portfolio, macro, riesgos, demo });

    // Lanzar Chrome headless en Vercel
    const exePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: exePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '10mm', bottom: '14mm', left: '12mm' }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="informe_cartera.pdf"`);
    res.status(200).end(Buffer.from(pdf));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generando el PDF', detail: String(err?.message||err) });
  }
}