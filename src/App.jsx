import { BrowserRouter as Router, Route, Routes, NavLink } from 'react-router-dom'
import Home from './components/Home'
import Cuestionario from './components/Cuestionario'
import Contacto from './components/Contacto'
import Formacion from './components/Formacion'
import AdminLogin from './components/AdminLogin'
import AdminPanel from './components/AdminPanel'
import CarteraPersonalizada from './components/CarteraPersonalizada'
import AvisoLegal from './components/AvisoLegal'
import PoliticaPrivacidad from './components/PoliticaPrivacidad'
import Footer from './components/Footer'

// Logo
import logo from './assets/logo-carterasai.png'

// helper para clases condicionales
function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white text-gray-900 flex flex-col">
        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-blue-600 text-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <img src={logo} alt="CarterasAI" className="h-10 w-auto" />
            <h1 className="text-2xl font-bold tracking-wide">CarterasAI</h1>
          </div>

          {/* NAV */}
          <nav aria-label="primary" className="bg-blue-700/20 border-t border-blue-500/20">
            <div className="max-w-6xl mx-auto px-4">
              <ul className="flex flex-wrap items-center gap-2 sm:gap-4 py-2">
                <li>
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                      cx(
                        "px-3 py-2 rounded-lg text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                        isActive ? "bg-white text-blue-700" : "text-white/90 hover:bg-white/10 hover:text-white"
                      )
                    }
                  >
                    Inicio
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/formacion"
                    className={({ isActive }) =>
                      cx(
                        "px-3 py-2 rounded-lg text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                        isActive ? "bg-white text-blue-700" : "text-white/90 hover:bg-white/10 hover:text-white"
                      )
                    }
                  >
                    Formación
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/simulador"
                    className={({ isActive }) =>
                      cx(
                        "px-3 py-2 rounded-lg text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                        isActive ? "bg-white text-blue-700" : "text-white/90 hover:bg-white/10 hover:text-white"
                      )
                    }
                  >
                    Simulador
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/contacto"
                    className={({ isActive }) =>
                      cx(
                        "px-3 py-2 rounded-lg text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                        isActive ? "bg-white text-blue-700" : "text-white/90 hover:bg-white/10 hover:text-white"
                      )
                    }
                  >
                    Contacto
                  </NavLink>
                </li>
                <li className="ml-auto">
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      cx(
                        "px-3 py-2 rounded-lg text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                        isActive ? "bg-white text-blue-700" : "text-white bg-white/10 hover:bg-white/20"
                      )
                    }
                  >
                    Admin
                  </NavLink>
                </li>
              </ul>
            </div>
          </nav>
        </header>

        {/* MAIN */}
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/formacion" element={<Formacion />} />
            <Route path="/simulador" element={<Cuestionario />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/panel" element={<AdminPanel />} />
            <Route path="/cartera" element={<CarteraPersonalizada />} />
            <Route path="/aviso-legal" element={<AvisoLegal />} />
            <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  )
}

export default App