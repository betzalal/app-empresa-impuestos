'use client'

import { login } from '@/app/actions/auth'
import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { ArrowRight, Lock, User } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all transform hover:scale-[1.02]"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Verificando...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          Ingresar <ArrowRight size={18} />
        </span>
      )}
    </button>
  )
}

export default function LoginPage() {
  const [message, setMessage] = useState('')
  const [isLanding, setIsLanding] = useState(true)

  async function handleSubmit(formData: FormData) {
    setMessage('')
    const res = await login(formData)
    if (res?.message) setMessage(res.message)
  }

  // --- LANDING VIEW ---
  if (isLanding) {
    return (
      <div
        onClick={() => setIsLanding(false)}
        className="min-h-screen relative flex items-center justify-center bg-slate-950 overflow-hidden cursor-pointer"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl animate-in fade-in zoom-in-95 duration-1000">
          {/* Logo Placeholder - If company exists, show company logo. If not, show Sawalife. */}
          <div className="mx-auto mb-8 w-32 h-32 relative">
            {/* We use a SVG Water Drop for Sawalife branding matching the uploaded image concept */}
            <svg viewBox="0 0 100 100" className="w-full h-full fill-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <path d="M50 0 C50 0 10 40 10 65 C10 85 30 100 50 100 C70 100 90 85 90 65 C90 40 50 0 50 0 Z M50 90 C35 90 20 80 20 65 C20 50 45 20 50 15 C55 20 80 50 80 65 C80 80 65 90 50 90 Z" opacity="0.9" />
              <circle cx="35" cy="65" r="5" fill="white" opacity="0.6" />
              <circle cx="65" cy="55" r="8" fill="white" opacity="0.4" />
              <circle cx="50" cy="75" r="4" fill="white" opacity="0.5" />
            </svg>
          </div>

          <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white mb-6 drop-shadow-2xl">
            SAWALIFE
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 font-light leading-relaxed max-w-3xl mx-auto drop-shadow-md">
            "La plataforma integral para el control de proyectos y finanzas corporativas. Desde la gestión de personal hasta el análisis de gastos detallados, simplificamos toda tu operación operativa y tributaria en una sola fuente de verdad"
          </p>

          <div className="mt-16 text-slate-400 text-sm animate-bounce">
            Click para ingresar
          </div>
        </div>
      </div>
    )
  }

  // --- SPLIT LOGIN VIEW ---
  return (
    <div className="min-h-screen flex bg-slate-900 animate-in fade-in duration-500">

      {/* Left Side - Visual / Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-950 items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 z-10" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative z-20 flex flex-col items-center text-center text-white">
          <div className="w-24 h-24 mb-6 text-blue-500">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
              <path d="M50 0 C50 0 10 40 10 65 C10 85 30 100 50 100 C70 100 90 85 90 65 C90 40 50 0 50 0 Z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-4 text-white">
            SAWALIFE
          </h1>
          <p className="text-slate-400 max-w-md">
            Gestión inteligente. Resultados reales.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-6 sm:px-10 lg:px-16 bg-slate-900 relative">
        <button
          onClick={() => setIsLanding(true)}
          className="absolute top-8 left-8 text-slate-500 hover:text-white transition-colors"
        >
          ← Volver
        </button>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
              SAWALIFE
            </h2>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 shadow-2xl rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                Bienvenido a su nuevo manejo de su empresa para proyectos y futuros proyectos
              </h2>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mt-4">
                <p className="text-blue-200 text-sm">
                  Para poder iniciar puede ingresar como:
                </p>
                <p className="font-mono text-white font-bold mt-1">Usuario: admin</p>
                <p className="font-mono text-white font-bold">Pass: admin</p>
                <p className="text-xs text-blue-300 mt-2">
                  * Una vez dentro llene los datos de su empresa, suba un logo y cambie su usuario y contraseña.
                </p>
              </div>
            </div>

            <form action={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                  Usuario
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-900/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-900 transition-all sm:text-sm"
                    placeholder="Tu nombre de usuario"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-900/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-900 transition-all sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {message && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-medium animate-in fade-in slide-in-from-top-1">
                  {message}
                </div>
              )}

              <div className="pt-2">
                <SubmitButton />
              </div>
            </form>
          </div>

          <p className="mt-8 text-center text-xs text-slate-500">
            © 2026 Sawalife Tax System. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}

