import { useState } from 'react'

function Cuestionario() {
  const [respuestas, setRespuestas] = useState({})
  const preguntas = [
    { id: 'edad', texto: '¿Cuál es tu edad?' },
    { id: 'experiencia', texto: '¿Tienes experiencia previa invirtiendo?' },
    { id: 'patrimonio', texto: '¿Cuál es tu patrimonio aproximado?' },
    { id: 'disponible', texto: '¿Cuánto dinero tienes disponible para invertir?' },
    { id: 'riesgo', texto: '¿Qué nivel de riesgo estás dispuesto a asumir?' },
  ]

  const manejarCambio = (id, valor) => {
    setRespuestas({ ...respuestas, [id]: valor })
  }

  const manejarEnvio = (e) => {
    e.preventDefault()
    alert('Gracias por tus respuestas. Generaremos tu cartera personalizada pronto.')
  }

  return (
    <form onSubmit={manejarEnvio} className="space-y-4">
      {preguntas.map((pregunta) => (
        <div key={pregunta.id}>
          <label className="block font-semibold">{pregunta.texto}</label>
          <input
            type="text"
            className="border border-gray-300 rounded p-2 w-full"
            onChange={(e) => manejarCambio(pregunta.id, e.target.value)}
          />
        </div>
      ))}
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Enviar
      </button>
    </form>
  )
}

export default Cuestionario
