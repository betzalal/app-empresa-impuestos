'use client'

import { useState } from 'react'
import { X, User, Lock, Activity, Save, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

// We will fetch these from a server action later, for now we mock or pass as props
interface UserProfileModalProps {
    isOpen: boolean
    onClose: () => void
    user?: {
        name: string
        email: string
        phone?: string
        image?: string
    }
}

export function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
    if (!isOpen) return null

    const [activeTab, setActiveTab] = useState<'details' | 'security' | 'logs'>('details')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Form States
    const [formData, setFormData] = useState({
        email: user?.email || '',
        phone: user?.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        previewImage: ''
    })

    const handleSubmitDetails = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        // TODO: Call Server Action
        await new Promise(resolve => setTimeout(resolve, 1000)) // Mock

        setMessage({ type: 'success', text: 'Detalles actualizados correctamente' })
        setIsLoading(false)
    }

    const handleSubmitPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' })
            return
        }

        setIsLoading(true)
        setMessage(null)

        // TODO: Call Server Action
        await new Promise(resolve => setTimeout(resolve, 1000)) // Mock

        setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' })
        setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
        setIsLoading(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-card w-full max-w-2xl h-[600px] flex overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">

                {/* Sidebar */}
                <div className="w-1/3 border-r border-slate-700/30 p-4 space-y-2 bg-[var(--bg-secondary)]">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 px-2">Mi Perfil</h3>

                    <button
                        onClick={() => setActiveTab('details')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'details'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <User size={18} /> Detalles
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'security'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <Lock size={18} /> Seguridad
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'logs'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <Activity size={18} /> Actividad
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 relative bg-[var(--bg-primary)] overflow-y-auto">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>

                    {message && (
                        <div className={`mb-6 p-3 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                            <AlertCircle size={16} />
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'details' && (
                        <form onSubmit={handleSubmitDetails} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">Información Personal</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={user?.name}
                                        disabled
                                        className="w-full p-2 rounded-lg bg-slate-900/50 border border-slate-700 text-slate-500 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-slate-600 mt-1">Contacte al administrador para cambiar su nombre.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full p-2 rounded-lg bg-transparent border border-slate-700 text-white focus:border-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Teléfono / Celular</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+591 ..."
                                        className="w-full p-2 rounded-lg bg-transparent border border-slate-700 text-white focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
                            </button>
                        </form>
                    )}

                    {activeTab === 'security' && (
                        <form onSubmit={handleSubmitPassword} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">Cambiar Contraseña</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Contraseña Actual</label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.currentPassword}
                                        onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                                        className="w-full p-2 rounded-lg bg-transparent border border-slate-700 text-white focus:border-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={formData.newPassword}
                                        onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                                        className="w-full p-2 rounded-lg bg-transparent border border-slate-700 text-white focus:border-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Confirmar Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full p-2 rounded-lg bg-transparent border border-slate-700 text-white focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Procesando...' : <><Save size={18} /> Actualizar Contraseña</>}
                            </button>
                        </form>
                    )}

                    {activeTab === 'logs' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">Última Actividad</h2>

                            <div className="space-y-3">
                                {/* MOCK LOGS */}
                                {[1, 2, 3].map((_, i) => (
                                    <div key={i} className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 flex items-start gap-3">
                                        <div className="mt-1 p-1.5 rounded-full bg-blue-500/20 text-blue-400">
                                            <Activity size={12} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-200">Inicio de sesión exitoso</p>
                                            <p className="text-xs text-slate-500">Hace {i * 2 + 1} horas • IP: 192.168.1.{10 + i}</p>
                                        </div>
                                    </div>
                                ))}
                                <p className="text-center text-xs text-slate-500 italic mt-4">Mostrando últimos 3 eventos</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
