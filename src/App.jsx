import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom'
import Home from './components/Home'
import Cuestionario from './components/Cuestionario'
import Contacto from './components/Contacto'
import Formacion from './components/Formacion'
import AdminLogin from './components/AdminLogin'
import AdminPanel from './components/AdminPanel'
import CarteraPersonalizada from './components/CarteraPersonalizada'

// 📌 Importa el logo
import logo from './assets/logo-carterasai.png' // Asegúrate de guardar el PNG en src/assets

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white text-gray-900">
        
        {/* HEADER */}
        <header className="p-4 bg-blue-600 text-white flex items-center justify-center gap-4">
          <img src={logo} alt="CarterasAI Logo" className="h-12 w-auto" />
          <h1 className="text-3xl font-bold tracking-wide">CarterasAI</h1>
        </header>

        {/* NAV */}
        <nav className="bg-blue-100 p-4 flex justify-center gap-6 text-lg font-medium">
          <Link to="/">Inicio</Link>
          <Link to="/formacion">Formación</Link>
          <Link to="/simulador">Simulador</Link>
          <Link to="/contacto">Contacto</Link>
          <Link to="/admin">Admin</Link>
        </nav>

        {/* MAIN */}
        <main className="p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/formacion" element={<Formacion />} />
            <Route path="/simulador" element={<Cuestionario />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/panel" element={<AdminPanel />} />
            <Route path="/cartera" element={<CarteraPersonalizada />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
