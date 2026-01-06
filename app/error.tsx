'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 text-white">
            <h2 className="text-2xl font-bold mb-4">¡Ups! Algo salió mal.</h2>
            <p className="text-slate-400 mb-8 max-w-md text-center">
                Hemos detectado un error en la aplicación. Por favor, intente recargar la página.
            </p>
            <button
                onClick={() => reset()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-all"
            >
                Reintentar
            </button>
        </div>
    )
}
