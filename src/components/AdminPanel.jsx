
// src/components/AdminPanel.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { useAuth } from '../AuthContext'
import { Navigate, useNavigate } from 'react-router-dom'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import logo from '../assets/logo-carterasai.png' // <-- ajusta si tu ruta es distinta

// -------------------------
// Utilidades
// -------------------------
function toDate(ts) {
  return ts?.toDate?.().toLocaleString?.() || ''
}

// Reemplaza caracteres “raros” por ASCII seguro
function sanitize(str = '') {
  return String(str)
    .replaceAll('–', '-')
    .replaceAll('—', '-')
    .replaceAll('’', "'")
    .replaceAll('“', '"')
    .replaceAll('”', '"')
    .replaceAll('≈', '~')
}

// Pesos sugeridos (suman 100) por perfil
function sugerirPesos(perfil) {
  if (perfil === 'conservador') return [20,15,10,10,10,10,8,7,5,5]
  if (perfil === 'moderado')   return [15,12,12,10,10,10,8,8,8,7]
  return [14,13,12,11,10,10,9,8,7,6] // dinámico
}

// Cartera de 10 fondos/ETFs por perfil
function cartera10(perfil) {
  const CONSERVADOR = [
    'Amundi Cash EUR (AECE)',
    'iShares Euro Gov Bond 1-3y (IBGL)',
    'Vanguard Global Aggregate Bond (VAGF)',
    'Xtrackers Eurozone Gov Bond (XGLE)',
    'iShares Euro Corporate Bond (IEAC)',
    'Lyxor Euro Inflation Linked (MTSI)',
    'Vanguard Short-Term Euro Gov (VGEG)',
    'iShares J.P. Morgan EM Local Govt Bond (IEML)',
    'Xtrackers ESG EUR Corp Bond (XDCB)',
    'iShares Global Govt Bond EUR Hedged (IGLE)',
  ]
  const MODERADO = [
    'iShares MSCI World (IWRD)',
    'Vanguard FTSE All-World (VWRL)',
    'iShares Core S&P 500 (CSP1)',
    'Xtrackers MSCI EM (XMME)',
    'iShares MSCI Europe (IMEU)',
    'iShares Global Clean Energy (INRG)',
    'Xtrackers ESG EUR Corp Bond (XDCB)',
    'Vanguard Global Aggregate Bond (VAGF)',
    'iShares Global Tech (IXN)',
    'SPDR MSCI World Small Cap (WDSC)',
  ]
  const DINAMICO = [
    'iShares NASDAQ 100 (CNDX)',
    'ARK Innovation ETF (ARKK)',
    'Vanguard Emerging Markets (VFEM)',
    'iShares S&P 500 Equal Weight (EQQW)',
    'Vanguard FTSE Developed Asia Pac (VAPX)',
    'iShares Global Tech (IXN)',
    'SPDR MSCI World Small Cap (WDSC)',
    'iShares MSCI World Momentum (IWMO)',
    'iShares MSCI EM (IEMG)',
    'Xtrackers MSCI China (XCS6)',
  ]
  if (perfil === 'conservador') return CONSERVADOR
  if (perfil === 'moderado')   return MODERADO
  return DINAMICO
}

// Notas por activo (demo rápida)
function notaActivo(ticker) {
  const M = {
    AECE: 'Monetario EUR (liquidez).',
    IBGL: 'Gob. Euro 1-3 años.',
    VAGF: 'Renta fija global agregada.',
    XGLE: 'Gobiernos zona euro.',
    IEAC: 'Corporativos EUR IG.',
    MTSI: 'Bonos ligados a inflación EUR.',
    VGEG: 'Gob. EUR corto plazo.',
    IEML: 'Bonos EM en divisa local.',
    XDCB: 'Corp EUR ESG IG.',
    IGLE: 'Gobierno global EUR cubierto.',
    IWRD: 'RV global desarrollados.',
    VWRL: 'All-World (des.+emerg.).',
    CSP1: 'S&P 500 USA.',
    XMME: 'RV emergentes.',
    IMEU: 'RV Europa.',
    INRG: 'Energías limpias.',
    IXN: 'Tecnología global.',
    WDSC: 'Small Caps globales.',
    CNDX: 'NASDAQ 100.',
    ARKK: 'Innovación disruptiva.',
    VFEM: 'Emergentes (Vanguard).',
    EQQW: 'S&P 500 equal weight.',
    VAPX: 'Asia Pacífico desarrollado.',
    IWMO: 'Factor momentum global.',
    IEMG: 'EM broad market.',
    XCS6: 'China MSCI.',
  }
  const match = ticker.match(/\(([^)]+)\)/)
  const tk = match?.[1]?.toUpperCase?.() || ''
  return M[tk] || 'Exposición diversificada acorde al perfil.'
}

// Wrap de texto simple (por caracteres)
function wrapText(text, maxChars = 100) {
  const words = sanitize(text).split(/\s+/)
  const lines = []
  let line = ''
  for (const w of words) {
    const t = line ? line + ' ' + w : w
    if (t.length > maxChars) {
      if (line) lines.push(line)
      line = w
    } else {
      line = t
    }
  }
  if (line) lines.push(line)
  return lines
}

// Dibujar tabla básica
function drawTable({ page, x, y, colWidths, rows, font, fontBold }) {
  const rowH = 18
  const totalW = colWidths.reduce((a,b)=>a+b,0)
  const colX = [x]
  for (let i=0; i<colWidths.length-1; i++) colX.push(colX[i] + colWidths[i])

  // Header
  page.drawRectangle({ x, y: y - rowH, width: totalW, height: rowH, color: rgb(0.96,0.98,1) })
  rows[0].forEach((cell, i) => {
    page.drawText(sanitize(cell), { x: colX[i] + 6, y: y - 13, size: 10, font: fontBold, color: rgb(0,0,0.25) })
  })

  // Body
  let yy = y - rowH
  for (let r=1; r<rows.length; r++) {
    yy -= rowH
    rows[r].forEach((cell,i)=>{
      page.drawText(sanitize(cell), { x: colX[i] + 6, y: yy + 5, size: 10, font })
    })
    page.drawLine({ start: { x, y: yy }, end: { x: x+totalW, y: yy }, color: rgb(0.9,0.9,0.9) })
  }
  return yy - 10
}

// Mini bar-chart de pesos
function drawBarChart({ page, x, y, width, height, values = [] }) {
  const maxV = Math.max(10, ...values)
  const barW = Math.min(28, (width - 20) / values.length)
  const gap = Math.min(8, (width - values.length * barW) / (values.length - 1 || 1))
  let cx = x
  values.forEach((v, i) => {
    const h = Math.max(2, (v / maxV) * (height - 20))
    page.drawRectangle({ x: cx, y, width: barW, height: h, color: rgb(0.2, 0.45, 0.9) })
    page.drawText(String(v), { x: cx + 2, y: y + h + 3, size: 8, color: rgb(0.25,0.25,0.25) })
    page.drawText(String(i+1).padStart(2,'0'), { x: cx + 4, y: y - 10, size: 8, color: rgb(0.35,0.35,0.35) })
    cx += barW + gap
  })
}

// Texto explicativo por perfil
function explicacionPerfil(perfil) {
  const MAP = {
    conservador:
      'Perfil conservador: prioriza estabilidad y preservación del capital. Mayor peso en renta fija de calidad y liquidez. Objetivo de volatilidad y caídas potenciales más contenidas.',
    moderado:
      'Perfil moderado: busca equilibrio entre crecimiento y control del riesgo. Combinación de renta variable global y renta fija diversificada.',
    dinámico:
      'Perfil dinámico: prioriza crecimiento a largo plazo asumiendo mayor volatilidad. Alta exposición a renta variable global y temáticas de crecimiento.',
  }
  return MAP[perfil] || 'Perfil no identificado.'
}

// -------------------------
// Generador de PDF por fila (enriquecido + logo)
// -------------------------
async function generarPDFFila(row) {
  const perfil = row.perfil || 'N/D'
  const lista = cartera10(perfil)
  const pesos = sugerirPesos(perfil)

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Logo
  try {
    const res = await fetch(logo)
    const buf = await res.arrayBuffer()
    const img = await pdfDoc.embedPng(buf)
    page.drawImage(img, { x: 40, y: 792, width: 90, height: 26 }) // ajusta tamaño si quieres
  } catch (e) {
    // si falla el logo, seguimos sin él
  }

  const M = 40
  let y = 800
  const text = (t, x, yy, size = 11, f = font, color = rgb(0,0,0)) =>
    page.drawText(sanitize(t), { x, y: yy, size, font: f, color })
  const hr = () => page.drawLine({ start: { x: M, y }, end: { x: 595.28 - M, y }, color: rgb(0.88,0.88,0.9) })

  // Cabecera
  text('Informe de Cartera — CarterasAI', 140, 800, 16, bold, rgb(0,0,0.6))
  y = 780
  text(`Fecha: ${toDate(row.timestamp)}`, M, y, 10, font, rgb(0.25,0.25,0.25)); y -= 14
  hr(); y -= 22

  // Resumen usuario y perfil
  text('Resumen del perfil', M, y, 12, bold); y -= 16
  text(`Nombre: ${row.nombre || 'N/D'}`, M, y); y -= 14
  text(`Email: ${row.email || 'N/D'}`, M, y); y -= 14
  text(`Perfil: ${String(perfil).toUpperCase()}`, M, y, 12, bold, rgb(0.05,0.25,0.65)); y -= 16
  text(`Score: ${row.score ?? 'N/D'} | Volatilidad objetivo: ${sanitize(row.volObjetivo || 'N/D')}`, M, y); y -= 14
  text(`Horizonte: ${row.horizonte || 'N/D'} | Objetivo: ${row.objetivo || 'N/D'}`, M, y); y -= 14
  y -= 6
  wrapText(explicacionPerfil(perfil), 100).forEach(l => { text(l, M, y); y -= 12 })

  y -= 8
  hr(); y -= 20

  // Tabla de cartera (10)
  text('Cartera sugerida (10 posiciones)', M, y, 12, bold); y -= 18
  const rows = [['#','Activo','Peso','Notas']]
  lista.forEach((item, i) => rows.push([
    String(i+1).padStart(2,'0'),
    item,
    `${pesos[i]}%`,
    notaActivo(item)
  ]))
  y = drawTable({ page, x: M, y, colWidths: [24, 260, 60, 171], rows, font, fontBold: bold })

  // Si queda poco, nueva página para gráfico y metodología
  const needNewPage = y < 160
  const p = needNewPage ? pdfDoc.addPage([595.28, 841.89]) : page
  let yy = needNewPage ? 780 : y

  if (needNewPage) {
    p.drawText('Distribución de pesos', { x: M, y: yy, size: 12, font: bold }); yy -= 6
  } else {
    p.drawText('Distribución de pesos', { x: M, y: yy, size: 12, font: bold }); yy -= 6
  }
  drawBarChart({ page: p, x: M, y: yy - 120, width: 515, height: 110, values: pesos })
  yy -= 140

  // Metodología y rebalanceo
  p.drawText('Metodología (resumen):', { x: M, y: yy, size: 12, font: bold }); yy -= 16
  wrapText(
    'Asignación basada en tu perfil (conservador/moderado/dinámico), horizonte y tolerancia. ' +
    'Buscamos diversificar por región, estilo y tipo de activo. Los instrumentos son representativos ' +
    'y pueden sustituirse por equivalentes con mejores costes/disponibilidad.',
    100
  ).forEach(l => { p.drawText(sanitize(l), { x: M, y: (yy -= 12), size: 11, font }) })

  yy -= 6
  p.drawText('Rebalanceo recomendado:', { x: M, y: (yy -= 18), size: 12, font: bold })
  wrapText(
    'Revisar la cartera 1–2 veces al año. Si un activo se desvía ±20% relativo a su peso objetivo, ' +
    'considerar rebalanceo (venta parcial de los que más suben para comprar los que menos).',
    100
  ).forEach(l => { p.drawText(sanitize(l), { x: M, y: (yy -= 12), size: 11, font }) })

  yy -= 6
  p.drawText('Siguientes pasos:', { x: M, y: (yy -= 18), size: 12, font: bold })
  wrapText(
    '1) Valida que la volatilidad objetivo y horizonte encajan con tus circunstancias. ' +
    '2) Si buscas ejecución real, considera costes/impuestos y traspasabilidad. ' +
    '3) Revisa la cartera periódicamente o ante cambios relevantes.',
    100
  ).forEach(l => { p.drawText(sanitize(l), { x: M, y: (yy -= 12), size: 11, font }) })

  // Pie de página
  const last = pdfDoc.getPage(pdfDoc.getPageCount()-1)
  last.drawLine({ start: { x: M, y: 40 }, end: { x: 595.28 - M, y: 40 }, color: rgb(0.88,0.88,0.9) })
  last.drawText('CarterasAI — Informe educativo. No supone recomendación personalizada.', {
    x: M, y: 26, size: 9, font, color: rgb(0.35,0.35,0.35)
  })

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

// -------------------------
// Componente principal
// -------------------------
export default function AdminPanel() {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')

  useEffect(() => {
    async function fetchData() {
      const snap = await getDocs(collection(db, 'cuestionarios'))
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
      setRows(data)
    }
    fetchData()
  }, [])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return rows
    const fields = ['nombre', 'email', 'perfil', 'volObjetivo', 'situacion', 'objetivo', 'horizonte']
    return rows.filter(r => fields.some(f => String(r[f] ?? '').toLowerCase().includes(t)))
  }, [rows, q])

  if (!isAuthenticated) return <Navigate to="/admin" />

  const exportCSV = () => {
    const header = [
      'fecha','nombre','email','edad','situacion',
      'ingresos','ahorroMensual','patrimonio','moneda',
      'horizonte','objetivo','preferenciaESG','fondosTraspasables',
      'experiencia','conocimiento','tolerancia','reaccion',
      'perfil','volObjetivo','score'
    ]
    const lines = filtered.map(r => ([
      toDate(r.timestamp), r.nombre, r.email, r.edad, r.situacion,
      r.ingresos, r.ahorroMensual, r.patrimonio, r.moneda,
      r.horizonte, r.objetivo, r.preferenciaESG, r.fondosTraspasables,
      r.experiencia, r.conocimiento, r.tolerancia, r.reaccion,
      r.perfil, sanitize(r.volObjetivo), r.score
    ].map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')))

    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cuestionarios_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const descargarPDF = async (row) => {
    try {
      const blob = await generarPDFFila(row)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const nombre = sanitize(row.nombre || 'usuario')
      a.download = `informe_${nombre}_${row.perfil || 'perfil'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Error al generar PDF:', e)
      alert('No se pudo generar el PDF. Revisa la consola para más detalles.')
    }
  }

  return (
    <div className="max-w-7xl mx-auto mt-8 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-soft">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Panel de administración</h2>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Buscar (nombre, email, perfil...)"
            className="border rounded px-3 py-2 bg-white dark:bg-gray-800 text-sm"
          />
          <button
            onClick={exportCSV}
            className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
          >
            Exportar CSV
          </button>
          <button
            onClick={()=>{ logout(); navigate('/admin') }}
            className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700 text-sm"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr className="text-left">
              <Th>Fecha</Th>
              <Th>Nombre</Th>
              <Th>Email</Th>
              <Th>Edad</Th>
              <Th>Perfil</Th>
              <Th>Score</Th>
              <Th>Vol. objetivo</Th>
              <Th>Horizonte</Th>
              <Th>Objetivo</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="p-4 text-gray-500">Sin resultados</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="border-t dark:border-gray-700 align-top">
                <Td>{toDate(r.timestamp)}</Td>
                <Td>{r.nombre}</Td>
                <Td>{r.email}</Td>
                <Td>{r.edad}</Td>
                <Td className="capitalize font-medium">{r.perfil}</Td>
                <Td>{r.score ?? ''}</Td>
                <Td>{sanitize(r.volObjetivo || '')}</Td>
                <Td>{r.horizonte}</Td>
                <Td>{r.objetivo}</Td>
                <Td>
                  <button
                    onClick={() => descargarPDF(r)}
                    className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Descargar PDF
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Consejo: usa el buscador para filtrar por “moderado”, “conservador”, email, etc.
      </p>
    </div>
  )
}

function Th({children}) {
  return <th className="p-2 text-gray-700 dark:text-gray-200">{children}</th>
}
function Td({children}) {
  return <td className="p-2 text-gray-800 dark:text-gray-100">{children}</td>
}