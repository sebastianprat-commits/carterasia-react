import React, { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebaseConfig'

const AdminPanel = () => {
  const [respuestas, setRespuestas] = useState([])

  useEffect(() => {
    async function fetchData() {
    try {
      const snapshot = await getDocs(collection(db, "cuestionarios"))
      const data = snapshot.docs.map((doc) => doc.data())
      console.log("Datos recibidos desde Firestore:", data) // <- Añadido
      setRespuestas(data)
    } catch (error) {
      console.error("Error al obtener datos de Firestore:", error) // <- Añadido
    }
  }
    fetchData()
  }, [])

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">Respuestas del cuestionario</h2>
      {respuestas.length === 0 ? (
        <p className="text-gray-500">No hay respuestas registradas aún.</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Edad</th>
              <th className="p-2">Experiencia</th>
              <th className="p-2">Formación</th>
              <th className="p-2">Horizonte</th>
              <th className="p-2">Objetivo</th>
              <th className="p-2">Riesgo</th>
              <th className="p-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {respuestas.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{r.edad}</td>
                <td className="p-2">{r.experiencia}</td>
                <td className="p-2">{r.formacion}</td>
                <td className="p-2">{r.horizonte}</td>
                <td className="p-2">{r.objetivo}</td>
                <td className="p-2">{r.riesgo}</td>
                <td className="p-2">
                  {r.timestamp?.toDate?.().toLocaleString?.() || ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default AdminPanel
