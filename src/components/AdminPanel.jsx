import React, { useEffect, useMemo, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { useAuth } from '../AuthContext'
import { Navigate, useNavigate } from 'react-router-dom'

function toDate(ts) {
  return ts?.toDate?.().toLocaleString?.() || ''
}

export default function AdminPanel() {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')

  useEffect(() => {
    async function fetchData() {
      const snap = await getDocs(collection(db, 'cuestionarios'))
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // Ordenar por fecha desc
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
      r.perfil, r.volObjetivo, r.score
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
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr className="text-left">
              <Th>Fecha</Th>
              <Th>Nombre</Th>
              <Th>Email</Th>
              <Th>Edad</Th>
              <Th>Perfil</Th>
              <Th>Vol. objetivo</Th>
              <Th>Horizonte</Th>
              <Th>Objetivo</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="p-4 text-gray-500">Sin resultados</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="border-t dark:border-gray-700 align-top">
                <Td>{toDate(r.timestamp)}</Td>
                <Td>{r.nombre}</Td>
                <Td>{r.email}</Td>
                <Td>{r.edad}</Td>
                <Td className="capitalize font-medium">{r.perfil}</Td>
                <Td>{r.volObjetivo}</Td>
                <Td>{r.horizonte}</Td>
                <Td>{r.objetivo}</Td>
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
