
import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import emailjs from '@emailjs/browser'

// ---------- Cartera 10 posiciones con pesos y metadatos (educativo) ----------
function cartera10(perfil) {
  // Pesos por perfil (suman 100)
  const presets = {
    conservador: [25,20,20,10,8,7,5,3,1,1],
    moderado:    [18,16,16,12,10,8,8,6,4,2],
    dinamico:    [12,12,12,11,10,10,8,8,9,8], // algo más concentrado en RV
  }
  const w = presets[perfil] || presets.moderado

  // Universo ejemplo (ETF/fondos globales)
  const base = [
    { ticker:'IWDA',  nombre:'iShares MSCI World UCITS ETF', tipo:'ETF RV Global', region:'Desarrollados', ter:0.20, nota:'Núcleo de renta variable global' },
    { ticker:'EIMI',  nombre:'iShares Core MSCI EM IMI UCITS ETF', tipo:'ETF RV Emergentes', region:'Emergentes', ter:0.18, nota:'Diversifica hacia emergentes' },
    { ticker:'ESPO',  nombre:'VanEck Video Gaming & eSports', tipo:'ETF Temático', region:'Global', ter:0.55, nota:'Temática crecimiento (ej.)' },
    { ticker:'EUNA',  nombre:'iShares Core € Govt Bond UCITS', tipo:'ETF RF Soberana EUR', region:'EUR', ter:0.20, nota:'Columna defensiva en EUR' },
    { ticker:'VUKE',  nombre:'Vanguard FTSE 100 UCITS ETF', tipo:'ETF RV UK', region:'UK', ter:0.09, nota:'Exposición a UK' },
    { ticker:'CSPX',  nombre:'iShares Core S&P 500 UCITS', tipo:'ETF RV USA', region:'USA', ter:0.07, nota:'Exposición USA eficiente' },
    { ticker:'AGGH',  nombre:'iShares Core Global Aggregate Bond', tipo:'ETF RF Global', region:'Global', ter:0.10, nota:'Bonos globales agregados' },
    { ticker:'EMAG',  nombre:'iShares J.P. Morgan $ EM Bond', tipo:'ETF RF EM USD', region:'Emergentes', ter:0.25, nota:'Bonos emergentes (USD)' },
    { ticker:'GLD',   nombre:'SPDR Gold Trust (proxy)', tipo:'Oro', region:'Global', ter:0.40, nota:'Cobertura e inflación' },
    { ticker:'CASH',  nombre:'Amundi Cash EUR', tipo:'Monetario', region:'EUR', ter:0.10, nota:'Liquidez táctica' },
  ]

  // Ajuste por perfil hacia RF/RV (simple)
  const tilt = perfil === 'conservador' ? [0.8,0.6,0.3,1.3,0.7,0.7,1.2,1.1,0.8,1.3]
            : perfil === 'dinamico'     ? [1.2,1.2,1.3,0.6,1.0,1.2,0.8,0.8,1.0,0.4]
            : [1,1,1,1,1,1,1,1,1,1]

  let total = 0
  const items = base.map((b,i) => {
    const peso = Math.max(0, Math.round(w[i] * tilt[i]))
    total += peso
    return { ...b, peso }
  })
  // Normalizar a 100
  return items.map(it => ({ ...it, peso: Math.round((it.peso/total)*100) }))
}

// ---------- Gráficos simples (barras / línea) en pdf-lib ----------
function drawBarChart(page, { x=50, y=260, width=500, height=140, data=[] }) {
  const max = Math.max(...data.map(d=>d.value), 1)
  const barW = width / data.length
  data.forEach((d,i) => {
    const h = (d.value / max) * height
    page.drawRectangle({
      x: x + i*barW + 4,
      y,
      width: barW - 8,
      height: h,
      color: rgb(0.16, 0.44, 0.78)
    })
  })
}

function drawLineChart(page, { x=50, y=260, width=500, height=140, series=[] }) {
  // series: [{name, values:[...] , color: rgb()}]
  const max = Math.max(...series.flatMap(s=>s.values))
  const min = Math.min(...series.flatMap(s=>s.values))
  const n = Math.max(...series.map(s=>s.values.length))
  const dx = width / (n-1 || 1)

  series.forEach(s => {
    let prev = null
    s.values.forEach((v, i) => {
      const px = x + i*dx
      const py = y + ((v - min) / (max - min || 1)) * height
      if (prev) {
        page.drawLine({ start: prev, end: {x:px,y:py}, thickness: 1.2, color: s.color })
      }
      prev = { x:px, y:py }
    })
  })
}

// ---------- Texto multi-línea ----------
function drawTextBlock(page, text, { x, y, width=500, font, size=11, leading=14 }) {
  const words = text.split(/\s+/)
  let line = ''
  let yy = y
  words.forEach((w, idx) => {
    const test = line ? (line + ' ' + w) : w
    const testWidth = font.widthOfTextAtSize(test, size)
    if (testWidth > width) {
      page.drawText(line, { x, y: yy, size, font, color: rgb(0,0,0) })
      yy -= leading
      line = w
    } else {
      line = test
    }
    if (idx === words.length - 1) {
      page.drawText(line, { x, y: yy, size, font, color: rgb(0,0,0) })
    }
  })
}

// ========= Helpers para texto seguro en PDF (evita “≈”, “€” y Unicode no-ASCII) =========
const sanitizeForPdf = (str = '') =>
  String(str)
    .replace(/€/g, 'EUR')
    .replace(/≈/g, '~')              // “aprox.” también sirve si prefieres
    .replace(/[^\x20-\x7E]/g, '');   // opcional: elimina otros no-ASCII

const drawSafeText = (page, text, options) => {
  page.drawText(sanitizeForPdf(text), options);
};

// ========= Generador de PDF (multi-sección) con texto saneado =========
async function generarPDFCompleto({ nombre = '', perfil, volObjetivo = '', cartera = [] }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 780]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const left = 50;
  let y = 740;

  // Cabecera / Portada
  drawSafeText(page, 'Informe de Cartera Personalizada — CarterasAI', {
    x: left, y, size: 18, font, color: rgb(0, 0, 0)
  });
  y -= 30;

  const fecha = new Date().toLocaleString();
  drawSafeText(page, Fecha: ${fecha}, { x: left, y, size: 11, font, color: rgb(0.2,0.2,0.2) });
  y -= 18;

  if (nombre) {
    drawSafeText(page, Usuario: ${nombre}, { x: left, y, size: 11, font });
    y -= 22;
  }

  // Resumen de perfil
  drawSafeText(page, 'Resumen de perfil', { x: left, y, size: 14, font });
  y -= 18;

  drawSafeText(page, Perfil inversor detectado: ${perfil}, { x: left, y, size: 12, font });
  y -= 16;

  if (volObjetivo) {
    // Ojo: si antes ponías “≈20%”, aquí se convertirá en “~20%”
    drawSafeText(page, Volatilidad objetivo: ${volObjetivo}, { x: left, y, size: 12, font });
    y -= 22;
  } else {
    y -= 10;
  }

  // Cartera sugerida (lista)
  drawSafeText(page, 'Cartera sugerida (resumen):', { x: left, y, size: 14, font });
  y -= 16;

  const items = cartera.length ? cartera : ['(sin elementos)'];
  items.forEach((activo) => {
    drawSafeText(page, • ${activo}, { x: left + 18, y, size: 12, font });
    y -= 16;
  });

  // Nueva página para tabla simple si no cabe
  if (y < 120) {
    y = 740;
    const page2 = pdfDoc.addPage([600, 780]);
    // Redirige page al nuevo lienzo
    page.drawLine; // no hace nada, sólo evita lints
    // Reasignamos la referencia de página a la nueva
    // (truco: simplemente volvemos a usar variable "page" con el nuevo page2)
    // En JS, usa otra variable:
    const p2 = page2;

    drawSafeText(p2, 'Detalle de instrumentos (tabla rápida)', {
      x: left, y, size: 14, font
    });
    y -= 22;

    // Cabecera de tabla
    drawSafeText(p2, 'Instrumento', { x: left,       y, size: 12, font });
    drawSafeText(p2, 'Tipo',       { x: left + 260,  y, size: 12, font });
    drawSafeText(p2, 'Nota',       { x: left + 360,  y, size: 12, font });
    y -= 14;

    p2.drawLine({
      start: { x: left, y: y + 8 }, end: { x: 550, y: y + 8 },
      color: rgb(0.8,0.8,0.8), thickness: 1
    });
    y -= 4;

    // Relleno de tabla (muy básico; deduce tipo por nombre)
    items.forEach((activo) => {
      const tipo = activo.toLowerCase().includes('bond') || activo.toLowerCase().includes('gov') ? 'Renta fija' : 'Renta variable';
      drawSafeText(p2, activo, { x: left, y, size: 11, font });
      drawSafeText(p2, tipo,   { x: left + 260, y, size: 11, font });
      drawSafeText(p2, 'ETF/Fondo', { x: left + 360, y, size: 11, font });
      y -= 16;
    });
  } else {
    // Si queda espacio, metemos una “tabla corta” en la misma página
    y -= 10;
    drawSafeText(page, 'Detalle de instrumentos (tabla rápida)', {
      x: left, y, size: 14, font
    });
    y -= 22;

    drawSafeText(page, 'Instrumento', { x: left,       y, size: 12, font });
    drawSafeText(page, 'Tipo',        { x: left + 260, y, size: 12, font });
    drawSafeText(page, 'Nota',        { x: left + 360, y, size: 12, font });
    y -= 14;

    page.drawLine({
      start: { x: left, y: y + 8 }, end: { x: 550, y: y + 8 },
      color: rgb(0.8,0.8,0.8), thickness: 1
    });
    y -= 4;

    items.forEach((activo) => {
      const tipo = activo.toLowerCase().includes('bond') || activo.toLowerCase().includes('gov') ? 'Renta fija' : 'Renta variable';
      drawSafeText(page, activo, { x: left, y, size: 11, font });
      drawSafeText(page, tipo,   { x: left + 260, y, size: 11, font });
      drawSafeText(page, 'ETF/Fondo', { x: left + 360, y, size: 11, font });
      y -= 16;
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

// ---------- Componente original con nuevos textos PDF ----------
const obtenerCarteraBasica = (perfil) => {
  // mantenemos compat con tu UI de lista simple (3 líneas)
  const full = cartera10(perfil)
  return full.slice(0,3).map(c => `${c.ticker} — ${c.nombre}`)
}

export default function CarteraPersonalizada() {
  const location = useLocation()
  const navigate = useNavigate()
  const perfil = location.state?.perfil
  const email = location.state?.email
  const nombre = location.state?.nombre
  const volObjetivo = location.state?.volObjetivo

  const [emailSent, setEmailSent] = useState(false)

  if (!perfil) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-4 bg-white dark:bg-gray-900 shadow rounded text-center">
        <h2 className="text-xl font-bold mb-4">No se ha podido determinar tu perfil</h2>
        <Link to="/simulador" className="text-blue-600 underline">Volver al simulador</Link>
      </div>
    )
  }

  const cartera = obtenerCarteraBasica(perfil)

  const handleDownloadPDF = async () => {
    const blob = await generarPDFCompleto({ nombre, perfil, volObjetivo })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CarterasAI_informe_${perfil}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleEmailSend = async () => {
    try {
      setEmailSent(false)
      const blob = await generarPDFCompleto({ nombre, perfil, volObjetivo })
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onloadend = async () => {
        const base64Pdf = String(reader.result).split(',')[1] || ''
        await emailjs.send(
          'service_toji81m',
          'template_6us1g68',
          {
            to_email: email,
            nombre_usuario: nombre || '',
            perfil_usuario: perfil,
            cartera_1: cartera[0] || '',
            cartera_2: cartera[1] || '',
            cartera_3: cartera[2] || '',
            pdf_attachment: base64Pdf,
          },
          'y2-PNRI-wvGie9Qdb'
        )
        setEmailSent(true)
        setTimeout(()=>navigate('/'), 5000)
      }
    } catch (e) {
      console.error(e)
      alert('No se pudo enviar el email.')
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 bg-white dark:bg-gray-900 shadow rounded">
      <h2 className="text-xl font-bold mb-2">
        Tu perfil inversor es: <span className="capitalize text-blue-600">{perfil}</span>
      </h2>
      {volObjetivo && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Objetivo de volatilidad: <strong>{volObjetivo}</strong>
        </p>
      )}

      <h3 className="text-lg font-semibold mb-2">Cartera sugerida (resumen):</h3>
      <ul className="list-disc ml-6 text-gray-800 dark:text-gray-100">
        {cartera.map((activo, i) => <li key={i}>{activo}</li>)}
      </ul>

      <div className="mt-6 flex flex-col gap-3">
        {emailSent
          ? <p className="text-green-600">Email enviado correctamente. Redirigiendo…</p>
          : <>
              <button onClick={handleDownloadPDF} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">
                Descargar informe completo (PDF)
              </button>
              {email && (
                <button onClick={handleEmailSend} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Enviar por email
                </button>
              )}
            </>
        }
        <Link to="/" className="text-blue-600 underline text-center">Volver al inicio</Link>
      </div>
    </div>
  )
}
