import React, { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { useAuth } from '../AuthContext'
import { Navigate } from 'react-router-dom'

const calcularPerfil = (respuestas) => {
  let score = 0

  const edad = parseInt(respuestas.edad)
  if (edad < 40) score += 2
  else if (edad < 60) score += 1

  const map = { nada: 0, poca: 1, mucha: 2 }
  score += map[respuestas.experiencia?.toLowerCase()] || 0
  score += map[respuestas.formacion?.toLowerCase()] || 0

  const horizonte = respuestas.horizonte?.toLowerCase()
  if (horizonte.includes("corto")) score += 0
  else if (horizonte.includes("medio")) score += 1
  else if (horizonte.includes("largo")) score += 2

  const objetivo = respuestas.objetivo?.toLowerCase()
  if (objetivo.includes("conservar")) score += 0
  else if (objetivo.includes("poco")) score += 1
  else if (objetivo.includes("mucho")) score += 2

  const riesgo = respuestas.riesgo?.toLowerCase()
  if (riesgo.includes("ninguno")) score += 0
  else if (riesgo.includes("poco")) score += 1
  else if (riesgo.includes("mucho")) score += 2

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

const AdminPanel = () => {
  const { isAuthenticated } = useAuth()
  const [respuestas, setRespuestas] = useState([])

  useEffect(() => {
    async function fetchData() {
      const snapshot = await getDocs(collection(db, 'cuestionarios'))
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      setRespuestas(data)
    }
    fetchData()
  }, [])

  if (!isAuthenticated) return <Navigate to="/admin" />

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">Respuestas del cuestionario</h2>
      {respuestas.length === 0 ? (
        <p className="text-gray-500">No hay respuestas registradas aún.</p>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
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
            {respuestas.map((r, i) => {
              const perfil = calcularPerfil(r)
              const cartera = obtenerCartera(perfil)
              return (
                <tr key={i} className="border-t align-top">
                  <td className="p-2">{r.edad}</td>
                  <td className="p-2">{r.experiencia}</td>
                  <td className="p-2">{r.formacion}</td>
                  <td className="p-2">{r.horizonte}</td>
                  <td className="p-2">{r.objetivo}</td>
                  <td className="p-2">{r.riesgo}</td>
                  <td className="p-2">
                    {r.timestamp?.toDate?.().toLocaleString?.() || ''}
                  </td>
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
      )}
    </div>
  )
}

export default AdminPanel

