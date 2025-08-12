// src/components/AdminPanel.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { useAuth } from '../AuthContext'
import { Navigate, useNavigate } from 'react-router-dom'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

// -------------------------
// Utilidades
// -------------------------
function toDate(ts) {
  return ts?.toDate?.().toLocaleString?.() || ''
}

// Reemplaza caracteres “raros” por ASCII seguro para WinAnsi
function sanitize(str = '') {
  return String(str)
    .replaceAll('–', '-')
    .replaceAll('—', '-')
    .replaceAll('’', "'")
    .replaceAll('“', '"')
    .replaceAll('”', '"')
    .replaceAll('≈', '~') // por si hubiera quedado en datos históricos
}

// Cartera de 10 fondos/ETFs por perfil (placeholder inicial)
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
    'iShares S&P 500 Equal Weight (EQQW)*',
    'Vanguard FTSE Developed Asia Pac (VAPX)',
    'iShares Global Tech (IXN)',
    'SPDR MSCI World Small Cap (WDSC)',
    'iShares MSCI World Momentum (IWMO)',
    'iShares MSCI EM (IEMG)*',
    'Xtrackers MSCI China (XCS6)*',
  ]

  if (perfil === 'conservador') return CONSERVADOR
  if (perfil === 'moderado') return MODERADO
  return DINAMICO
}

// -------------------------
// PDF por fila
// -------------------------
async function generarPDFFila(row) {
  const perfil = row.perfil || 'N/D'
  const lista = cartera10(perfil)

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 en puntos
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Márgenes y helpers
  const M = 40
  let y = 800
  const line = (x1, y1, x2, y2, color = rgb(0.85, 0.85, 0.85)) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color, thickness: 1 })
  }
  const text = (t, x, yy, size = 11, bold = false, color = rgb(0, 0, 0)) => {
    page.drawText(sanitize(t), { x, y: yy, size, font: bold ? fontBold : font, color })
  }

  // Cabecera
  text('Informe de Cartera — CarterasAI', M, y, 16, true, rgb(0,0,0.6))
  y -= 18
  text(`Fecha: ${toDate(row.timestamp)}`, M, y, 10, false, rgb(0.25,0.25,0.25))
  y -= 14
  line(M, y, 595.28 - M, y); y -= 24

  // Datos usuario
  text('Datos del usuario', M, y, 12, true); y -= 18
  text(`Nombre: ${row.nombre || 'N/D'}`, M, y); y -= 14
  text(`Email: ${row.email || 'N/D'}`, M, y); y -= 14
  text(`Edad: ${row.edad || 'N/D'}`, M, y); y -= 14
  text(`Situación: ${row.situacion || 'N/D'}`, M, y); y -= 14
  text(`Ingresos: ${row.ingresos || 'N/D'} — Ahorro mensual: ${row.ahorroMensual || 'N/D'}`, M, y); y -= 14
  text(`Patrimonio: ${row.patrimonio || 'N/D'} — Moneda: ${row.moneda || 'N/D'}`, M, y); y -= 14

  y -= 10
  line(M, y, 595.28 - M, y); y -= 22

  // Perfil
  text('Perfil y parámetros', M, y, 12, true); y -= 18
  text(`Perfil: ${String(perfil).toUpperCase()}`, M, y, 12, true, rgb(0.05,0.25,0.65)); y -= 16
  text(`Score: ${row.score ?? 'N/D'}`, M, y); y -= 14
  text(`Volatilidad objetivo: ${sanitize(row.volObjetivo || 'N/D')}`, M, y); y -= 14
  text(`Horizonte: ${row.horizonte || 'N/D'} — Objetivo: ${row.objetivo || 'N/D'}`, M, y); y -= 14
  text(`Preferencia ESG: ${row.preferenciaESG || 'N/D'} — Fondos traspasables: ${row.fondosTraspasables || 'N/D'}`, M, y); y -= 14
  text(`Experiencia: ${row.experiencia || 'N/D'} — Conocimiento: ${row.conocimiento || 'N/D'}`, M, y); y -= 14
  text(`Reacción ante caídas: ${row.reaccion || 'N/D'}`, M, y); y -= 14

  y -= 10
  line(M, y, 595.28 - M, y); y -= 22

  // Cartera
  text('Cartera sugerida (10 posiciones)', M, y, 12, true); y -= 18
  lista.forEach((item, idx) => {
    text(`${(idx + 1).toString().padStart(2, '0')}. ${item}`, M, y)
    y -= 14
    if (y < 80) {
      // nueva página si nos quedamos sin espacio
      const p2 = pdfDoc.addPage([595.28, 841.89])
      y = 800
      page.drawText // linter
      p2.drawText('', { x: 0, y: 0 }) // no-op para evitar warning
    }
  })

  // Pie
  y -= 12
  line(M, y, 595.28 - M, y); y -= 16
  text(
    'Nota: Informe educativo. No constituye recomendación personalizada. Revisa riesgos y costes antes de invertir.',
    M, y, 9, false, rgb(0.25,0.25,0.25)
  )

  const pdfBytes = await pdfDoc.save()
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  return blob
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
      // Orden por fecha desc
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
