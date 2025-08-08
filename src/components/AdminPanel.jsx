
import React, { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { useAuth } from '../AuthContext'
import { Navigate, useNavigate } from 'react-router-dom'

const calcularPerfil = (respuestas) => {
  let score = 0

  const edad = parseInt(respuestas.edad)
  if (!isNaN(edad)) {
    if (edad < 40) score += 2
    else if (edad < 60) score += 1
  }

  const map = { nada: 0, poca: 1, mucha: 2 }
  score += map[respuestas.experiencia?.toLowerCase()] || 0
  score += map[respuestas.formacion?.toLowerCase()] || 0

  const horizonte = respuestas.horizonte?.toLowerCase() || ''
  if (horizonte.includes('corto')) score += 0
  else if (horizonte.includes('medio')) score += 1
  else if (horizonte.includes('largo')) score += 2

  const objetivo = respuestas.objetivo?.toLowerCase() || ''
  if (objetivo.includes('conservar')) score += 0
  else if (objetivo.includes('poco')) score += 1
  else if (objetivo.includes('mucho')) score += 2

  const riesgo = respuestas.riesgo?.toLowerCase() || ''
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
      'Amundi Cash EUR (AECE)',
    ],
    moderado: [
      'iShares MSCI World (IWRD)',
      'Vanguard Global Moderate Allocation (VMAA)',
      'Xtrackers ESG EUR Corp Bond (XDCB)',
    ],
    dinámico: [
      'ARK Innovation ETF (ARKK)',
      'iShares NASDAQ 100 (CNDX)',
      'Vanguard Emerging Markets (VFEM)',
    ],
  }
  return carteras[perfil] || []
}

const AdminPanel = () => {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [respuestas, setRespuestas] = useState([])

  useEffect(() => {
    async function fetchData() {
      const snapshot = await getDocs(collection(db, 'cuestionarios'))
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setRespuestas(data)
    }
    fetchData()
  }, [])

  if (!isAuthenticated) return <Navigate to="/admin" />

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 rounded-xl shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Respuestas del cuestionario
        </h2>
        <button
          onClick={() => {
            logout()
            navigate('/admin')
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Cerrar sesión
        </button>
      </div>

      {respuestas.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">No hay respuestas registradas aún.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800 text-left">
              <tr>
                <Th>Nombre</Th>
                <Th>Edad</Th>
                <Th>Experiencia</Th>
                <Th>Formación</Th>
                <Th>Horizonte</Th>
                <Th>Objetivo</Th>
                <Th>Riesgo</Th>
                <Th>Fecha</Th>
                <Th>Perfil</Th>
                <Th>Cartera sugerida</Th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
              {respuestas.map((r) => {
                const perfil = r.perfil || calcularPerfil(r)
                const cartera = obtenerCartera(perfil)
                return (
                  <tr key={r.id} className="border-t border-gray-200 dark:border-gray-800 align-top">
                    <Td>{r.nombre || '—'}</Td>
                    <Td>{r.edad || '—'}</Td>
                    <Td>{r.experiencia || '—'}</Td>
                    <Td>{r.formacion || '—'}</Td>
                    <Td>{r.horizonte || '—'}</Td>
                    <Td>{r.objetivo || '—'}</Td>
                    <Td>{r.riesgo || '—'}</Td>
                    <Td>{r.timestamp?.toDate?.().toLocaleString?.() || ''}</Td>
                    <Td className="font-semibold capitalize">{perfil}</Td>
                    <Td>
                      <ul className="list-disc ml-4">
                        {cartera.map((activo, idx) => (
                          <li key={idx}>{activo}</li>
                        ))}
                      </ul>
                    </Td>
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

function Th({ children }) {
  return (
    <th className="px-3 py-2 text-gray-700 dark:text-gray-200 font-semibold">
      {children}
    </th>
  )
}

function Td({ children, className = '' }) {
  return (
    <td className={`px-3 py-2 text-gray-800 dark:text-gray-100 ${className}`}>{children}</td>
  )
}

export default AdminPanel