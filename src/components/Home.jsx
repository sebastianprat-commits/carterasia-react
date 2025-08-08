
import React from 'react'
import { Link } from 'react-router-dom'
import { SITE_NAME } from '../constants/brand'

export default function Home() {
  return (
    <div>
      {/* ... hero ... */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-800">
            ¿Por qué elegir {SITE_NAME}?
          </h2>
          {/* ... resto igual ... */}
        </div>
      </section>
    </div>
  )
}