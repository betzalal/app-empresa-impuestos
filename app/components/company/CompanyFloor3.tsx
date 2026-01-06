'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, MessageCircle, FileText, Sparkles, Send, Settings, ArrowRight, CheckCircle2, RefreshCw, X, ExternalLink, Lock, Maximize2, Minimize2, Grid, Layout } from 'lucide-react'
import { getAuthUrl, getGmailMessages } from '@/app/actions/google' // Import actions

// Types for our integration Apps
type IntegrationApp = 'gmail' | 'whatsapp' | 'notion'

interface AppState {
    isConnected: boolean
    lastSync?: Date
    data?: any[]
    user?: string
}

export function CompanyFloor3() {
    // State to simulate connections settings
    const [apps, setApps] = useState<Record<IntegrationApp, AppState>>({
        gmail: { isConnected: false },
        whatsapp: { isConnected: false },
        notion: { isConnected: false }
    })

    // State for Gemini
    const [geminiInput, setGeminiInput] = useState('')

    // State for Login Modal
    const [connectingApp, setConnectingApp] = useState<IntegrationApp | null>(null)
    const [loginForm, setLoginForm] = useState({ user: '', password: '' })
    const [isLoggingIn, setIsLoggingIn] = useState(false)

    // State for "Windows" (Expanded Apps)
    const [openWindows, setOpenWindows] = useState<IntegrationApp[]>([])

    // Check Gmail Connection on Mount
    useEffect(() => {
        const checkGmail = async () => {
            const result = await getGmailMessages()
            if (result.success && result.messages) {
                setApps(prev => ({
                    ...prev,
                    gmail: {
                        isConnected: true,
                        lastSync: new Date(),
                        data: result.messages,
                        user: 'Sincronizado'
                    }
                }))
            }
        }
        checkGmail()
    }, [])

    const handleStartConnect = async (app: IntegrationApp) => {
        if (app === 'gmail') {
            // Real OAuth Flow
            const url = await getAuthUrl()
            window.location.href = url
            return
        }
        setConnectingApp(app)
        setLoginForm({ user: '', password: '' })
    }

    const handleConfirmConnect = async () => {
        if (!connectingApp) return

        setIsLoggingIn(true)
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        const newApps = { ...apps }
        // Only apply mock logic for non-Gmail apps
        if (connectingApp !== 'gmail') {
            newApps[connectingApp] = {
                isConnected: true,
                lastSync: new Date(),
                data: [1, 2, 3], // Mock data items
                user: loginForm.user || 'usuario@empresa.com'
            }
        }
        setApps(newApps)
        setConnectingApp(null)
        setIsLoggingIn(false)

        // Auto-open window on connect? Maybe let user choose.
    }

    const handleOpenExternal = (app: IntegrationApp) => {
        const urls = {
            gmail: 'https://mail.google.com',
            whatsapp: 'https://web.whatsapp.com',
            notion: 'https://notion.so'
        }
        window.open(urls[app], '_blank')
    }

    const toggleWindow = (app: IntegrationApp) => {
        if (openWindows.includes(app)) {
            setOpenWindows(openWindows.filter(w => w !== app))
        } else {
            setOpenWindows([...openWindows, app])
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 relative min-h-[600px]">

            {/* Header Floor 3 - Hide when windows are open to save space if needed, or keep for context */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Centro de Comando Digital</h2>
                    <p className="text-slate-400">Todo tu trabajo en un solo lugar</p>
                </div>
                {/* View Toggles (Visual indication only for now) */}
                <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                    <button className={`p-2 rounded ${openWindows.length === 0 ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}><Grid size={18} /></button>
                    <button className={`p-2 rounded ${openWindows.length > 0 ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}><Layout size={18} /></button>
                </div>
            </div>

            {/* MAIN CONTENT AREA: SPLIT BETWEEN GRID AND WINDOWS */}
            <div className="relative">

                {/* 1. THE LAUNCHER GRID (Always visible, but maybe pushed down or overlayed?) 
                     Lets keep it visible but maybe opacity reduced if windows override? 
                     Actually user wants to expand them FROM this.
                */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-500 ${openWindows.length > 0 ? 'opacity-40 blur-[2px] pointer-events-none' : 'opacity-100'}`}>

                    {/* GMAIL CARD */}
                    <AppCard
                        title="Gmail"
                        icon={<Mail className="text-red-500" size={24} />}
                        description={apps.gmail.isConnected ? "Sincronizado" : "Conectar cuenta"}
                        isConnected={apps.gmail.isConnected}
                        onConnect={() => handleStartConnect('gmail')}
                        onOpenExternal={() => handleOpenExternal('gmail')}
                        onExpand={() => toggleWindow('gmail')}
                        color="from-red-500/20 to-orange-500/20"
                        borderColor="hover:border-red-500/50"
                    />

                    {/* WHATSAPP CARD */}
                    <AppCard
                        title="WhatsApp"
                        icon={<MessageCircle className="text-green-500" size={24} />}
                        description="Mensajería directa"
                        isConnected={apps.whatsapp.isConnected}
                        onConnect={() => handleStartConnect('whatsapp')}
                        onOpenExternal={() => handleOpenExternal('whatsapp')}
                        onExpand={() => toggleWindow('whatsapp')}
                        color="from-green-500/20 to-emerald-500/20"
                        borderColor="hover:border-green-500/50"
                    />

                    {/* NOTION CARD */}
                    <AppCard
                        title="Notion"
                        icon={<FileText className="text-slate-200" size={24} />}
                        description="Wiki & Tareas"
                        isConnected={apps.notion.isConnected}
                        onConnect={() => handleStartConnect('notion')}
                        onOpenExternal={() => handleOpenExternal('notion')}
                        onExpand={() => toggleWindow('notion')}
                        color="from-slate-500/20 to-gray-500/20"
                        borderColor="hover:border-slate-400/50"
                    />
                </div>

                {/* 2. THE WINDOWS LAYER (Absolute Overlay) */}
                {openWindows.length > 0 && (
                    <div className="absolute inset-0 z-20 flex gap-4 overflow-x-auto pb-4 h-[600px]">
                        <AnimatePresence>
                            {openWindows.map((app) => (
                                <AppWindow
                                    key={app}
                                    app={app}
                                    onClose={() => toggleWindow(app)}
                                    url={
                                        app === 'gmail' ? 'https://mail.google.com/tasks/canvas' : // Mobile/Embed firendly-ish URLs
                                            app === 'whatsapp' ? 'https://web.whatsapp.com' :
                                                'https://www.notion.so'
                                    }
                                    data={apps[app].data}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* GEMINI AI INTERFACE (Always at bottom) */}
            <div className={`relative group transition-all duration-500 ${openWindows.length > 0 ? 'translate-y-4' : ''}`}>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-1 overflow-hidden">
                    <div className="px-6 py-4 flex items-center gap-3 border-b border-slate-800/50 bg-slate-900/30">
                        <Sparkles className="text-blue-400 animate-pulse" size={20} />
                        <div>
                            <h3 className="text-sm font-bold text-white">Google Gemini Enterprise</h3>
                            <p className="text-xs text-slate-400">Asistente conectado</p>
                        </div>
                    </div>
                    <div className="p-2">
                        <div className="relative flex items-center">
                            <textarea
                                value={geminiInput}
                                onChange={(e) => setGeminiInput(e.target.value)}
                                placeholder="Escribe tu comando..."
                                className="w-full bg-slate-900/50 text-slate-200 placeholder-slate-500 rounded-xl py-4 pl-4 pr-16 border-0 focus:ring-0 resize-none h-14 min-h-[56px] focus:bg-slate-900 transition-colors"
                            />
                            <div className="absolute right-2 flex gap-2">
                                <button className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all"><Send size={18} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* LOGIN / CONNECT MODAL */}
            <AnimatePresence>
                {connectingApp && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !isLoggingIn && setConnectingApp(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden relative"
                        >
                            <div className="bg-slate-950 p-6 flex flex-col items-center border-b border-slate-800/50">
                                <h3 className="text-lg font-bold text-white">Conectar {connectingApp.charAt(0).toUpperCase() + connectingApp.slice(1)}</h3>
                                {connectingApp === 'whatsapp' ? (
                                    <p className="text-xs text-slate-400 text-center mt-1">Escanea el código QR para vincular</p>
                                ) : (
                                    <p className="text-xs text-slate-400 text-center mt-1">Ingresa tus credenciales para sincronizar.</p>
                                )}
                            </div>

                            <div className="p-6 space-y-4 flex flex-col items-center">
                                {connectingApp === 'whatsapp' ? (
                                    <div className="space-y-4 w-full text-center">
                                        <div className="p-4 bg-slate-900/50 rounded-xl border border-dashed border-slate-700 aspect-square flex flex-col items-center justify-center gap-4">
                                            <div className="p-4 bg-white rounded-xl">
                                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SawalifeMock" alt="QR Code" className="w-32 h-32 opacity-80" />
                                            </div>
                                            <p className="text-[10px] text-slate-500">Escanea para iniciar simulación</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            value={loginForm.user}
                                            onChange={(e) => setLoginForm({ ...loginForm, user: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 text-sm"
                                            placeholder="Usuario / Email"
                                        />
                                        <input
                                            type="password"
                                            value={loginForm.password}
                                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 text-sm"
                                            placeholder="••••••••••••"
                                        />
                                    </>
                                )}

                                <button
                                    onClick={handleConfirmConnect}
                                    disabled={(connectingApp !== 'whatsapp' && !loginForm.user) || isLoggingIn}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-4 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                                >
                                    {isLoggingIn ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Conectar Seguramente'}
                                </button>
                            </div>
                            <button onClick={() => setConnectingApp(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    )
}

function AppCard({ title, icon, description, isConnected, onConnect, onOpenExternal, onExpand, color, borderColor }: any) {
    return (
        <div className={`glass-card relative overflow-hidden group border border-slate-800 ${borderColor} transition-colors duration-300 h-48 flex flex-col`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

            <div className="p-6 h-full flex flex-col relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 shadow-sm">{icon}</div>
                    {/* Corner Actions for Connected State */}
                    {isConnected && (
                        <div className="flex gap-2">
                            <button onClick={onExpand} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded" title="Agrandar vista">
                                <Maximize2 size={16} />
                            </button>
                            <button onClick={onOpenExternal} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded" title="Abrir externo">
                                <ExternalLink size={16} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
                    <p className="text-xs text-slate-400 mb-4">{description}</p>

                    {!isConnected && (
                        <button
                            onClick={onConnect}
                            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 w-full transition-colors"
                        >
                            <RefreshCw size={14} /> Conectar
                        </button>
                    )}
                </div>

                {isConnected && (
                    <div className="mt-auto flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] text-green-400">Sincronizado</span>
                    </div>
                )}
            </div>
        </div>
    )
}

function AppWindow({ app, onClose, url, data }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="flex-1 min-w-[300px] max-w-[800px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        >
            {/* Window Header */}
            <div className="h-10 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    {app === 'gmail' && <Mail size={14} className="text-red-500" />}
                    {app === 'whatsapp' && <MessageCircle size={14} className="text-green-500" />}
                    {app === 'notion' && <FileText size={14} className="text-slate-200" />}
                    <span className="text-xs font-bold text-slate-300 capitalize">{app}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="hover:bg-slate-800 p-1 rounded text-slate-400 hover:text-white">
                        <Minimize2 size={14} />
                    </button>
                    <button onClick={onClose} className="hover:bg-red-900/50 p-1 rounded text-slate-400 hover:text-red-400">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Window Content (Iframe simulation) */}
            <div className="flex-1 bg-white relative overflow-y-auto">
                {app === 'gmail' && data && Array.isArray(data) ? (
                    <div className="bg-slate-50 h-full">
                        {/* Render Gmail Data */}
                        {data.map((msg: any) => (
                            <div key={msg.id} className="p-3 border-b border-slate-200 hover:bg-blue-50 cursor-pointer group">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-slate-700 text-sm">{msg.from?.replace(/<.*>/, '')}</span>
                                    <span className="text-[10px] text-slate-400">{new Date(msg.date).toLocaleDateString()}</span>
                                </div>
                                <div className="text-xs font-medium text-slate-800 mb-1">{msg.subject}</div>
                                <div className="text-xs text-slate-500 line-clamp-2">{msg.snippet}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-500 p-6 text-center">
                            <p className="font-bold mb-2">Vista Previa de {app.toUpperCase()}</p>
                            <p className="text-xs mb-4 max-w-xs">
                                {app === 'gmail' ? 'Cargando correos...' : 'Para ver la app real aquí, se requiere integración API avanzada o extensión de navegador debido a restricciones de seguridad (X-Frame-Options).'}
                            </p>
                            <a href={url} target="_blank" rel="noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-500 transition-colors">
                                Abrir {app} en pestaña completa
                            </a>
                        </div>
                        {app !== 'gmail' && (
                            <iframe
                                src={url}
                                className="w-full h-full opacity-10 pointer-events-none"
                                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                            />
                        )}
                    </>
                )}
            </div>
        </motion.div>
    )
}
