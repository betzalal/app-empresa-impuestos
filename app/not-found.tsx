import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 text-white">
            <h2 className="text-4xl font-black mb-4">404</h2>
            <p className="text-xl font-bold mb-4">Página no encontrada</p>
            <p className="text-slate-400 mb-8 max-w-md text-center">
                Lo sentimos, la página que buscas no existe o ha sido movida.
            </p>
            <Link
                href="/"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-all"
            >
                Volver al Inicio
            </Link>
        </div>
    )
}
