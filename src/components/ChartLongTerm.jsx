
// src/components/ChartLongTerm.jsx
import React, { useMemo, useState } from 'react'
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

// Serie simulada y coherente (base 100 en 1990). Puedes afinarla más adelante.
const baseData = [
  { year: 1990, acciones: 100, bonos: 100, efectivo: 100 },
  { year: 1991, acciones: 109, bonos: 104, efectivo: 100.5 },
  { year: 1992, acciones: 116, bonos: 106, efectivo: 101 },
  { year: 1993, acciones: 131, bonos: 108, efectivo: 101.5 },
  { year: 1994, acciones: 128, bonos: 106, efectivo: 102 },
  { year: 1995, acciones: 170, bonos: 120, efectivo: 103 },
  { year: 1996, acciones: 200, bonos: 125, efectivo: 104 },
  { year: 1997, acciones: 240, bonos: 130, efectivo: 104.5 },
  { year: 1998, acciones: 250, bonos: 138, efectivo: 105 },
  { year: 1999, acciones: 270, bonos: 135, efectivo: 107 },
  { year: 2000, acciones: 280, bonos: 135, efectivo: 109 },
  { year: 2001, acciones: 250, bonos: 142, efectivo: 110 },
  { year: 2002, acciones: 220, bonos: 155, efectivo: 111 },
  { year: 2003, acciones: 260, bonos: 160, efectivo: 111.5 },
  { year: 2004, acciones: 280, bonos: 163, efectivo: 112 },
  { year: 2005, acciones: 230, bonos: 165, efectivo: 113 },
  { year: 2006, acciones: 270, bonos: 170, efectivo: 114 },
  { year: 2007, acciones: 290, bonos: 178, efectivo: 115 },
  { year: 2008, acciones: 190, bonos: 195, efectivo: 116 },
  { year: 2009, acciones: 240, bonos: 205, efectivo: 117 },
  { year: 2010, acciones: 260, bonos: 200, efectivo: 118 },
  { year: 2011, acciones: 255, bonos: 205, efectivo: 118.3 },
  { year: 2012, acciones: 285, bonos: 213, efectivo: 118.6 },
  { year: 2013, acciones: 335, bonos: 210, efectivo: 118.9 },
  { year: 2014, acciones: 340, bonos: 220, efectivo: 119.2 },
  { year: 2015, acciones: 350, bonos: 230, efectivo: 119.5 },
  { year: 2016, acciones: 375, bonos: 235, efectivo: 119.8 },
  { year: 2017, acciones: 430, bonos: 242, efectivo: 120.1 },
  { year: 2018, acciones: 410, bonos: 240, efectivo: 120.4 },
  { year: 2019, acciones: 470, bonos: 255, efectivo: 120.7 },
  { year: 2020, acciones: 520, bonos: 260, efectivo: 121 },
  { year: 2021, acciones: 570, bonos: 265, efectivo: 121.3 },
  { year: 2022, acciones: 510, bonos: 240, efectivo: 121.6 },
  { year: 2023, acciones: 580, bonos: 270, efectivo: 122.3 },
  { year: 2024, acciones: 600, bonos: 280, efectivo: 123 },
]

// Utilidades
const formatIndex = (v) => `Índice ${Math.round(v)}`
const pow10 = (x) => Math.pow(10, x)

// Filtrar por periodo
function filterByPeriod(data, period) {
  const ranges = {
    '1990-2024': 1990,
    '2000-2024': 2000,
    '2010-2024': 2010,
  }
  const start = ranges[period] ?? 1990
  return data.filter(d => d.year >= start)
}

export default function ChartLongTerm() {
  const [period, setPeriod] = useState('1990-2024')
  const [logScale, setLogScale] = useState(false)

  // Datos filtrados por periodo seleccionado
  const filtered = useMemo(() => filterByPeriod(baseData, period), [period])

  // Si logScale, graficamos log10(valor) pero mostramos valores originales en tooltip/eje
  const plotted = useMemo(() => {
    if (!logScale) return filtered
    return filtered.map(d => ({
      year: d.year,
      acciones: Math.log10(d.acciones),
      bonos: Math.log10(d.bonos),
      efectivo: Math.log10(d.efectivo),
      // guardamos también para el tooltip
      _raw: d,
    }))
  }, [filtered, logScale])

  const strokeAcc = '#2563eb'  // azul brand-600
  const strokeBon = '#10b981'  // verde accent
  const strokeEfe = '#6b7280'  // gray-500

  const yTickFormatter = (v) => {
    if (!logScale) return formatIndex(v)
    // v es log10(valor); mostramos aprox el valor
    const raw = pow10(v)
    return formatIndex(raw)
  }

  const tooltipFormatter = (value, name, context) => {
    if (!logScale) return [Math.round(value), name]
    // value es log10(valor); devolvemos valor original
    const raw = Math.round(pow10(value))
    return [raw, name]
  }

  const tooltipLabel = (label) => `Año ${label}`

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">
          Evolución comparada (base 100)
        </h3>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            Periodo:
          </label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1"
          >
            <option value="1990-2024">1990–2024</option>
            <option value="2000-2024">2000–2024</option>
            <option value="2010-2024">2010–2024</option>
          </select>

          <button
            onClick={() => setLogScale(s => !s)}
            className="text-sm bg-brand-600 text-white rounded px-2 py-1 hover:bg-brand-700"
            title="Alternar escala logarítmica"
          >
            {logScale ? 'Escala: Log' : 'Escala: Lineal'}
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Las acciones tienden a superar a bonos y efectivo a largo plazo, aunque con mayor volatilidad. 
        Cambia el periodo o usa escala logarítmica para apreciar el crecimiento compuesto.
      </p>

      <div style={{ width: '100%', height: 340 }}>
        <ResponsiveContainer>
          <LineChart data={plotted} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
            <XAxis dataKey="year" tick={{ fill: 'currentColor' }} stroke="currentColor" />
            <YAxis
              tick={{ fill: 'currentColor' }}
              stroke="currentColor"
              tickFormatter={yTickFormatter}
            />
            <Tooltip
              formatter={tooltipFormatter}
              labelFormatter={tooltipLabel}
              contentStyle={{ background: '#111827', color: '#F9FAFB', border: 'none' }}
              itemStyle={{ color: '#F9FAFB' }}
            />
            <Legend />
            <Line type="monotone" dataKey={logScale ? 'acciones' : 'acciones'} name="Acciones globales" stroke={strokeAcc} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey={logScale ? 'bonos' : 'bonos'} name="Bonos globales" stroke={strokeBon} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey={logScale ? 'efectivo' : 'efectivo'} name="Efectivo (0%)" stroke={strokeEfe} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        Nota: datos simulados con fines educativos. No representan resultados reales ni garantizan rendimientos futuros.
      </p>
    </div>
  )
}