import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom'
import Cuestionario from './components/Cuestionario'
import Contacto from './components/Contacto'
import Formacion from './components/Formacion'
import AdminLogin from './components/AdminLogin' // 
import AdminPanel from './components/AdminPanel' // 

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white text-gray-900">
        <header className="p-6 bg-blue-600 text-white text-center text-3xl font-bold">
          Bienvenido a CarterasIA
        </header>
        <nav className="bg-blue-100 p-4 flex justify-center gap-6">
          <Link to="/">Inicio</Link>
          <Link to="/formacion">Formación</Link>
          <Link to="/simulador">Simulador</Link>
          <Link to="/contacto">Contacto</Link>
        </nav>
        <main className="p-6">
          <Routes>
            <Route path="/" element={<p className="text-xl">Optimiza tu inversión con inteligencia artificial.</p>} />
            <Route path="/formacion" element={<Formacion />} />
            <Route path="/simulador" element={<Cuestionario />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/admin" element={<AdminLogin />} /> {/* ⬅️ NUEVO */}
            <Route path="/admin/panel" element={<AdminPanel />} /> {/* Ruta protegida */}
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
