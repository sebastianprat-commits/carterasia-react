import React from 'react'
import { useNavigate, Link } from 'react-router-dom'

const Confirmacion = ({ perfil, cartera, email, nombre }) => {
  const navigate = useNavigate()

  const handleEnviarEmail = async () => {
    // Aquí deberías llamar a la función que envía el email (enviarEmail)
    try {
      await enviarEmail(perfil, cartera, email, nombre)
      alert('Email enviado correctamente.')
      navigate('/')  // Redirige al inicio después de enviar el email
    } catch (error) {
      console.error("Error al enviar el email:", error)
      alert("Hubo un error al enviar el correo.")
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Confirmación de tu Perfil y Cartera</h2>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Perfil Inversor</h3>
        <ul className="list-disc ml-6 text-gray-800">
          <li><strong>Nombre:</strong> {nombre}</li>
          <li><strong>Perfil:</strong> {perfil}</li>
          <li><strong>Email:</strong> {email}</li>
        </ul>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Cartera Sugerida</h3>
        <ul className="list-disc ml-6 text-gray-800">
          {cartera.map((activo, i) => (
            <li key={i}>{activo}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex gap-4 justify-center">
        <button
          onClick={handleEnviarEmail}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Enviar por email
        </button>

        <Link
          to="/simulador"
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Editar datos
        </Link>
      </div>
    </div>
  )
}

export default Confirmacion
