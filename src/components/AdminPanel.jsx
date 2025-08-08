
import React, { useEffect, useState, useMemo } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { useAuth } from '../AuthContext'
import { Navigate, useNavigate } from 'react-router-dom'

const calcularPerfil = (r) => {
  let score = 0
  const edad = parseInt(r.edad)
  if (!isNaN(edad)) {
    if (edad < 40) score += 2
    else if (edad < 60) score += 1
  }
  const map = { nada: 0, poca: 1, mucha: 2 }
  score += map[r.experiencia?.toLowerCase?.()] || 0
  score += map[r.formacion?.toLowerCase?.()] || 0

  const horizonte = r.horizonte?.toLowerCase?.() || ''
  if (horizonte.includes('corto')) score += 0
  else if (horizonte.includes('medio')) score += 1
  else if (horizonte.includes('largo')) score += 2

  const objetivo = r.objetivo?.toLowerCase?.() || ''
  if (objetivo.includes('conservar')) score += 0
  else if (objetivo.includes('poco')) score += 1
  else if (objetivo.includes('mucho')) score += 2

  const riesgo = r.riesgo?.toLowerCase?.() || ''
  if (riesgo.includes('ninguno')) score += 0
  else if (riesgo.includes('poco')) score += 1
  else if (riesgo.includes('mucho')) score += 2

  if (score <= 4) return 'conservador'
  if (score <= 8) return 'moderado'
  return 'dinámico'
}

const obtenerCartera = (perfil) => {
  const carteras = {
    conservador: [
      'iShares Euro Government Bond 1-3yr (IBGL)',
      'Vanguard Global Aggregate Bond (VAGF)',
      'Amundi Cash EUR (AECE)'
    ],
    moderado: [
      'iShares MSCI World (IWRD)',
      'Vanguard Global Moderate Allocation (VMAA)',
      'Xtrackers ESG EUR Corp Bond (XDCB)'
    ],
    dinámico: [
      'ARK Innovation ETF (ARKK)',
      'iShares NASDAQ 100 (CNDX)',
      'Vanguard Emerging Markets (VFEM)'
    ]
  }
  return carteras[perfil] || []
}

export default function AdminPanel() {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [respuestas, setRespuestas] = useState([])
  const [q, setQ] = useState('')

  useEffect(() => {
    async function fetchData() {
      const snapshot = await getDocs(collection(db, 'cuestionarios'))
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setRespuestas(data)
    }
    fetchData()
  }, [])

  const filtradas = useMemo(() => {
    const term = q.toLowerCase()
    if (!term) return respuestas
    return respuestas.filter(r =>
      (r.nombre || '').toLowerCase().includes(term) ||
      (r.email || '').toLowerCase().includes(term) ||
      (r.objetivo || '').toLowerCase().includes(term)
    )
  }, [q, respuestas])

  const exportCSV = () => {
    const headers = ['id','nombre','email','edad','experiencia','formacion','horizonte','objetivo','riesgo','perfil','timestamp']
    const rows = filtradas.map(r => {
      const perfil = r.perfil || calcularPerfil(r)
      const ts = r.timestamp?.toDate?.().toISOString?.() || ''
      return [
        r.id,
        r.nombre || '',
        r.email || '',
        r.edad || '',
        r.experiencia || '',
        r.formacion || '',
        r.horizonte || '',
        r.objetivo || '',
        r.riesgo || '',
        perfil,
        ts
      ]
    })
    const csv = [headers, ...rows].map(row =>
      row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cuestionarios.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isAuthenticated) return <Navigate to="/admin" />

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-xl shadow">
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
        <h2 className="text-2xl font-bold flex-1">Respuestas del cuestionario</h2>
        <input
          type="text"
          placeholder="Buscar por nombre, email u objetivo..."
          className="border rounded px-3 py-2 w-full sm:w-72"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          onClick={exportCSV}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Exportar CSV
        </button>
        <button
          onClick={() => { logout(); navigate('/admin') }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Cerrar sesión
        </button>
      </div>

      {filtradas.length === 0 ? (
        <p className="text-gray-500">No hay respuestas registradas aún.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">Nombre</th>
                <th className="p-2">Email</th>
                <th className="p-2">Edad</th>
                <th className="p-2">Experiencia</th>
                <th className="p-2">Formación</th>
                <th className="p-2">Horizonte</th>
                <th className="p-2">Objetivo</th>
                <th className="p-2">Riesgo</th>
                <th className="p-2">Fecha</th>
                <th className="p-2">Perfil</th>
                <th className="p-2">Cartera sugerida</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((r, i) => {
                const perfil = r.perfil || calcularPerfil(r)
                const cartera = obtenerCartera(perfil)
                return (
                  <tr key={i} className="border-t align-top">
                    <td className="p-2">{r.nombre || ''}</td>
                    <td className="p-2">{r.email || ''}</td>
                    <td className="p-2">{r.edad}</td>
                    <td className="p-2">{r.experiencia}</td>
                    <td className="p-2">{r.formacion}</td>
                    <td className="p-2">{r.horizonte}</td>
                    <td className="p-2">{r.objetivo}</td>
                    <td className="p-2">{r.riesgo}</td>
                    <td className="p-2">{r.timestamp?.toDate?.().toLocaleString?.() || ''}</td>
                    <td className="p-2 font-semibold capitalize">{perfil}</td>
                    <td className="p-2">
                      <ul className="list-disc ml-4">
                        {cartera.map((activo, idx) => (
                          <li key={idx}>{activo}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
