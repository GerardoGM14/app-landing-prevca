import { useState } from 'react'

function App() {
  const [cartCount, setCartCount] = useState(0)

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <span className="text-xl font-bold tracking-tight text-purple-600">PREVCA SHOP</span>
              <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-500">
                <a href="#" className="hover:text-gray-900 transition-colors">Hombre</a>
                <a href="#" className="hover:text-gray-900 transition-colors">Mujer</a>
                <a href="#" className="hover:text-gray-900 transition-colors">Accesorios</a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-purple-600 rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
              Calidad que <br />
              <span className="text-purple-600">puedes sentir</span>.
            </h1>
            <p className="text-lg text-gray-500 max-w-lg">
              Descubre nuestra nueva colección de temporada. Diseños exclusivos pensados para tu comodidad y estilo.
            </p>
            <div className="flex gap-4">
              <button className="px-8 py-4 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-lg">
                Ver Colección
              </button>
            </div>
          </div>
          <div className="relative group">
            <div className="aspect-[4/5] bg-gray-100 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent"></div>
              {/* Image Placeholder with Generator Tool later if needed */}
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Products */}
        <section className="mt-24">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-bold">Productos Destacados</h2>
            <a href="#" className="text-purple-600 font-semibold hover:underline">Ver todos &rarr;</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((id) => (
              <div key={id} className="group">
                <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-4 relative drop-shadow-sm">
                   <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400">
                      Imagen
                   </div>
                   <button 
                    onClick={() => setCartCount(c => c + 1)}
                    className="absolute bottom-4 right-4 p-3 bg-white text-gray-900 rounded-full shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:bg-purple-600 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                   </button>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">Producto de Ejemplo {id}</h3>
                <p className="text-gray-500 text-sm">$49.99 USD</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
