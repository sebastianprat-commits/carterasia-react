import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">
        Optimiza tu inversión con inteligencia artificial
      </h1>
      <p className="text-lg text-gray-700 mb-6">
        CarterasIA analiza tu perfil inversor y te recomienda una cartera personalizada con fondos, ETFs y acciones diversificadas. 
        Empieza a invertir de forma más inteligente y eficiente.
      </p>

      <div className="flex justify-center gap-4">
        <Link
          to="/simulador"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
        >
          Probar el simulador
        </Link>
        <Link
          to="/formacion"
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-200"
        >
          Ver formación
        </Link>
      </div>
    </div>
  )
}

export default Home
