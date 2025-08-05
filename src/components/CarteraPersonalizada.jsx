// src/components/CarteraPersonalizada.jsx
import React from 'react'
import { useLocation } from 'react-router-dom'

const CarteraPersonalizada = () => {
  const location = useLocation()
  const datos = location.state || {}

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Tu Cartera Personalizada</h2>
      {Object.keys(datos).length === 0 ? (
        <p className="text-gray-500">No se han recibido datos.</p>
      ) : (
        <ul className="space-y-2">
          <li><strong>Edad:</strong> {datos.edad}</li>
          <li><strong>Experiencia:</strong> {datos.experiencia}</li>
          <li><strong>Formación:</strong> {datos.formacion}</li>
          <li><strong>Horizonte temporal:</strong> {datos.horizonte}</li>
          <li><strong>Objetivo:</strong> {datos.objetivo}</li>
          <li><strong>Riesgo:</strong> {datos.riesgo}</li>
        </ul>
      )}

      {/* En el futuro aquí se puede mostrar una cartera real según perfil */}
    </div>
  )
}

export default CarteraPersonalizada
