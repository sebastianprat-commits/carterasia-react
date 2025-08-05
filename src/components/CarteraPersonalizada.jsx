import { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'

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

const CarteraPersonalizada = () => {
  const location = useLocation()
  const [perfil, setPerfil] = useState(null)

  useEffect(() => {
    const perfilEnState = location.state?.perfil
    if (perfilEnState) {
      setPerfil(perfilEnState)
      localStorage.setItem('perfilUsuario', perfilEnState) // guarda
    } else {
      const perfilGuardado = localStorage.getItem('perfilUsuario')
      if (perfilGuardado) {
        setPerfil(perfilGuardado)
      }
    }
  }, [location.state])

  if (!perfil) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-4 bg-white shadow rounded text-center">
        <h2 className="text-xl font-bold mb-4">No se ha podido determinar tu perfil</h2>
        <p className="mb-4">Por favor, rellena el cuestionario para recibir tu cartera sugerida.</p>
        <Link to="/simulador" className="text-blue-600 underline">
          Volver al simulador
        </Link>
      </div>
    )
  }

  const cartera = obtenerCartera(perfil)

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Tu perfil inversor es: <span className="capitalize text-blue-600">{perfil}</span></h2>

      <h3 className="text-lg font-semibold mb-2">Cartera sugerida:</h3>
      <ul className="list-disc ml-6 text-gray-800">
        {cartera.map((activo, i) => (
          <li key={i}>{activo}</li>
        ))}
      </ul>

      <div className="mt-6">
        <Link to="/" className="text-blue-600 underline">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

export default CarteraPersonalizada

