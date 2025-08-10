// src/components/ChartLongTerm.jsx
import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'

// Serie simulada pero coherente históricamente (base 100 en 1990)
const data = [
  { year: 1990, acciones: 100, bonos: 100, efectivo: 100 },
  { year: 1995, acciones: 170, bonos: 120, efectivo: 105 },
  { year: 2000, acciones: 280, bonos: 135, efectivo: 110 },
  { year: 2005, acciones: 230, bonos: 165, efectivo: 115 },
  { year: 2010, acciones: 260, bonos: 200, efectivo: 118 },
  { year: 2015, acciones: 350, bonos: 230, efectivo: 120 },
  { year: 2020, acciones: 520, bonos: 260, efectivo: 121 },
  { year: 2024, acciones: 600, bonos: 280, efectivo: 123 },
]

const currencyFormatter = (v) => `Índice ${Math.round(v)}`

export default function ChartLongTerm() {
  // Colores adaptativos en modo claro/oscuro
  const strokeAcc = '#2563eb'  // azul brand-600
  const strokeBon = '#10b981'  // verde accent
  const strokeEfe = '#6b7280'  // gray-500

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-4">
      <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">
        Evolución comparada (1990 = 100)
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Simulación educativa: las acciones (renta variable global) tienden a superar a bonos y efectivo en horizontes largos, 
        aunque con más volatilidad intermedia.
      </p>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
            <XAxis
              dataKey="year"
              tick={{ fill: 'currentColor' }}
              stroke="currentColor"
            />
            <YAxis
              tick={{ fill: 'currentColor' }}
              stroke="currentColor"
              tickFormatter={currencyFormatter}
            />
            <Tooltip
              formatter={(value, name) => [Math.round(value), name]}
              labelFormatter={(label) => `Año ${label}`}
              contentStyle={{ background: '#111827', color: '#F9FAFB', border: 'none' }}
              itemStyle={{ color: '#F9FAFB' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="acciones"
              name="Acciones globales"
              stroke={strokeAcc}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="bonos"
              name="Bonos globales"
              stroke={strokeBon}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="efectivo"
              name="Efectivo (0%)"
              stroke={strokeEfe}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        Nota: datos simulados con fines educativos, no representan resultados reales ni garantizan rendimientos futuros.
      </p>
    </div>
  )
}