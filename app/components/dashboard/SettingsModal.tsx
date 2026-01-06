'use client'

import { useState, useEffect } from 'react'
import { X, UserPlus, Moon, Sun, Clock, Globe, Phone, Mail } from 'lucide-react'
import { useTheme } from '../ThemeProvider'

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null

    const { theme, setTheme } = useTheme()
    const [activeTab, setActiveTab] = useState<'users' | 'theme' | 'info' | 'danger'>('users')
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [companies, setCompanies] = useState<any[]>([])
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)

    // Session Info State
    const [currentTime, setCurrentTime] = useState<Date | null>(null)
    const [ipAddress, setIpAddress] = useState<string>('Cargando...')

    useEffect(() => {
        // Initialize time only on client to avoid hydration mismatch
        setCurrentTime(new Date())

        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        // Fetch IP
        fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => setIpAddress(data.ip))
            .catch(() => setIpAddress('No disponible'))

        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        if (activeTab === 'danger' && isOpen) {
            import('@/app/actions/delete-company').then(mod => {
                mod.getCompaniesAdminAction().then(data => setCompanies(data))
            })
        }
    }, [activeTab, isOpen])

    // Format helpers
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-ES')
    }

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault()
        alert('Funcionalidad de Crear Usuario: Pendiente de Backend')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-card w-full max-w-4xl h-[600px] flex overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Sidebar Navigation */}
                <div className="w-64 border-r border-slate-700/30 p-6 flex flex-col justify-between" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div>
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                            Configuración
                        </h2>
                        <nav className="space-y-2">
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                            >
                                <UserPlus size={18} /> Crear Usuario
                            </button>
                            <button
                                onClick={() => setActiveTab('theme')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'theme' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                            >
                                <Sun size={18} /> Tema
                            </button>
                            {/* 
                            <button
                                onClick={() => setActiveTab('danger')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'danger' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-red-400'}`}
                            >
                                <X size={18} /> Zona Peligrosa
                            </button>
                            */}
                        </nav>
                    </div>

                    {/* Session Info Footer */}
                    <div className="pt-4 border-t border-slate-700/30 text-xs text-slate-500 space-y-2">
                        <div className="flex items-center gap-2">
                            <Clock size={12} />
                            <span>
                                {currentTime ? formatTime(currentTime) : '--:--:--'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe size={12} />
                            <span>{ipAddress}</span>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 relative overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="max-w-2xl mx-auto">

                        {activeTab === 'users' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-2xl font-bold mb-2">Nuevo Usuario</h3>
                                <p className="text-slate-400 mb-6">Registra usuarios nuevos y asígnales una empresa.</p>

                                <form onSubmit={handleCreateUser} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Nombre de Usuario</label>
                                        <input type="text" className="input-field" placeholder="user123" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
                                        <input type="password" className="input-field" placeholder="••••••" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Asignar a Empresa (NIT)</label>
                                        <select className="input-field">
                                            <option>Sawalife S.R.L. (Principal)</option>
                                            {/* Logic for additional companies would go here */}
                                        </select>
                                    </div>
                                    <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors">
                                        Registrar Usuario
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'theme' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-2xl font-bold mb-2">Apariencia</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={`border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-blue-500 bg-slate-900/50 text-white shadow-lg shadow-blue-900/20' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}`}
                                    >
                                        <Moon size={32} className={theme === 'dark' ? 'text-blue-400' : ''} />
                                        <span className="font-medium">Modo Oscuro</span>
                                        {theme === 'dark' && <span className="text-xs text-blue-400">(Activo)</span>}
                                    </button>
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-blue-500 bg-white text-gray-900 shadow-lg' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}`}
                                    >
                                        <Sun size={32} className={theme === 'light' ? 'text-orange-500' : ''} />
                                        <span className="font-medium">Modo Claro</span>
                                        {theme === 'light' && <span className="text-xs text-blue-500 font-bold">(Activo)</span>}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'danger' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-3 text-red-500 mb-2">
                                    <X size={32} />
                                    <h3 className="text-2xl font-bold">Zona Peligrosa</h3>
                                </div>

                                {!selectedCompanyId ? (
                                    <div className="space-y-4">
                                        <p className="text-sm text-slate-400">
                                            Selecciona una empresa para eliminar todos sus datos permanentemente.
                                        </p>
                                        <div className="grid gap-3">
                                            {companies.length === 0 ? (
                                                <p className="text-slate-500 italic">No hay empresas registradas.</p>
                                            ) : (
                                                companies.map(company => (
                                                    <div key={company.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-red-500/30 transition-all group">
                                                        <div>
                                                            <h4 className="font-bold text-slate-200">{company.name}</h4>
                                                            <p className="text-xs text-slate-500 font-mono">NIT: {company.nit}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setSelectedCompanyId(company.id)}
                                                            className="px-4 py-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-lg text-sm font-bold transition-all"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 border-2 border-red-500/30 rounded-2xl bg-red-500/5 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-lg font-bold text-red-400">Confirmar Eliminación</h4>
                                            <button
                                                onClick={() => { setSelectedCompanyId(null); setError(null); }}
                                                className="text-xs text-slate-400 hover:text-white underline"
                                            >
                                                Volver a la lista
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            Estás a punto de borrar a: <span className="text-white font-bold">{companies.find(c => c.id === selectedCompanyId)?.name}</span>.
                                            Esta acción no se puede deshacer.
                                        </p>

                                        <form action={async (formData) => {
                                            if (confirm('¿Estás COMPLETAMENTE seguro de eliminar esta empresa?')) {
                                                setIsDeleting(true)
                                                setError(null)
                                                try {
                                                    const { deleteCompanyAction } = await import('@/app/actions/delete-company')
                                                    const result = await deleteCompanyAction(formData, selectedCompanyId)
                                                    if (result.success) {
                                                        if (result.redirect) {
                                                            window.location.href = result.redirect
                                                        } else {
                                                            // Refresh list
                                                            const { getCompaniesAdminAction } = await import('@/app/actions/delete-company')
                                                            const updated = await getCompaniesAdminAction()
                                                            setCompanies(updated)
                                                            setSelectedCompanyId(null)
                                                            setIsDeleting(false)
                                                            alert(result.message)
                                                        }
                                                    } else {
                                                        setError(result.message || 'Error desconocido')
                                                        setIsDeleting(false)
                                                    }
                                                } catch (err: any) {
                                                    setError(err.message || 'Error de conexión')
                                                    setIsDeleting(false)
                                                }
                                            }
                                        }} className="space-y-4 pt-2">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Usuario Autorización</label>
                                                    <input name="authUsername" type="text" required className="input-field" placeholder="betzalal" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Contraseña</label>
                                                    <input name="authPassword" type="password" required className="input-field" placeholder="••••••••" />
                                                </div>
                                            </div>

                                            {error && (
                                                <p className="text-xs text-red-500 font-medium bg-red-500/10 p-2 rounded border border-red-500/20">
                                                    {error}
                                                </p>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={isDeleting}
                                                className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                                            >
                                                {isDeleting ? 'Borrando...' : 'ELIMINAR EMPRESA Y DATOS'}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Contact Info Section - Always visible at bottom or as a separate block? 
                            User asked for "Log in datos" and contact numbers. 
                            I'll add a section below the main tabs content for Contact Info since it's global.
                        */}
                        <div className="mt-12 pt-8 border-t border-slate-700/50 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                            <h4 className="text-lg font-semibold mb-4 text-slate-200">Información de Sesión y Soporte</h4>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                                    <div className="flex items-center gap-3 mb-2 text-blue-400">
                                        <Clock size={20} />
                                        <span className="font-semibold">Sesión Actual</span>
                                    </div>
                                    <div className="text-sm text-slate-300">
                                        <p>{currentTime ? formatDate(currentTime) : 'Cargando fecha...'}</p>
                                        <p className="font-mono text-slate-400 text-xs mt-1">IP: {ipAddress}</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                                    <div className="flex items-center gap-3 mb-2 text-green-400">
                                        <Phone size={20} />
                                        <span className="font-semibold">Contacto Soporte</span>
                                    </div>
                                    <div className="text-sm text-slate-300 space-y-1">
                                        <p className="flex items-center gap-2">
                                            <Phone size={14} className="text-slate-500" /> 74952354
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Mail size={14} className="text-slate-500" /> dev@tuapp.com
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
