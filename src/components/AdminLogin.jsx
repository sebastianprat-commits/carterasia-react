import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

function AdminLogin() {
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password === 'carteras2025') {
      login()
      navigate('/admin/panel')
    } else {
      alert('Contraseña incorrecta')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-semibold mb-4 text-center">Acceso Administrador</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          className="w-full border border-gray-300 p-2 rounded mb-4"
          placeholder="Introduce la contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Entrar
        </button>
      </form>
    </div>
  )
}

export default AdminLogin

