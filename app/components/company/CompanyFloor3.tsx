'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { Mail, MessageCircle, FileText, Send, Settings, ArrowRight, CheckCircle2, RefreshCw, X, ExternalLink, Lock, Maximize2, Minimize2, Grid, Layout, AlertCircle, GripHorizontal, ChevronLeft, User, List } from 'lucide-react'
import { sendGmailAction, getGmailMessagesAction, saveGmailCredentialsAction } from '@/app/actions/google' // Import actions
import { getWhatsAppConnectionStatus, initializeWhatsAppAction, logoutWhatsAppAction, getWhatsAppChatsAction, getWhatsAppMessagesAction, sendWhatsAppMessageAction } from '@/app/actions/whatsapp'

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

    // State for Login Modal
    const [connectingApp, setConnectingApp] = useState<IntegrationApp | null>(null)
    const [loginForm, setLoginForm] = useState({ user: '', password: '' })
    const [isLoggingIn, setIsLoggingIn] = useState(false)
    const [whatsappQR, setWhatsappQR] = useState<string | null>(null)
    const [whatsappStatus, setWhatsappStatus] = useState<string>('DISCONNECTED')

    // State for "Windows" (Expanded Apps)
    const [openWindows, setOpenWindows] = useState<IntegrationApp[]>([])
    const [activeApp, setActiveApp] = useState<IntegrationApp | null>(null)
    const [windowStates, setWindowStates] = useState<Record<IntegrationApp, { x: number, y: number, width: number, height: number }>>({
        gmail: { x: 300, y: 100, width: 600, height: 550 },
        whatsapp: { x: 350, y: 150, width: 600, height: 550 },
        notion: { x: 400, y: 200, width: 600, height: 500 }
    })

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    // Simplified Gmail connection for Nodemailer
    useEffect(() => {
        setApps(prev => ({
            ...prev,
            gmail: {
                isConnected: true,
                user: 'admin@tuempresa.com'
            }
        }))
    }, [])

    // Poll WhatsApp Status
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const checkStatus = async () => {
            const result = await getWhatsAppConnectionStatus();
            if (result.success && 'status' in result) {
                setWhatsappStatus(result.status || 'DISCONNECTED');
                setWhatsappQR(result.qrCode || null);

                if (result.status === 'READY') {
                    setApps(prev => ({
                        ...prev,
                        whatsapp: {
                            isConnected: true,
                            lastSync: new Date(),
                            user: 'Conectado'
                        }
                    }));
                } else if (result.status === 'DISCONNECTED') {
                    setApps(prev => ({
                        ...prev,
                        whatsapp: { isConnected: false }
                    }));
                }
            }
        };

        if (connectingApp === 'whatsapp' || apps.whatsapp.isConnected || whatsappStatus !== 'DISCONNECTED') {
            checkStatus();
            interval = setInterval(checkStatus, 3000);
        }

        return () => clearInterval(interval);
    }, [connectingApp, apps.whatsapp.isConnected, whatsappStatus]);

    const handleStartConnect = async (app: IntegrationApp) => {
        if (app === 'gmail') {
            // Gmail is now always "connected" via Nodemailer
            toggleWindow('gmail')
            return
        }
        if (app === 'whatsapp') {
            setIsLoggingIn(true);
            const result = await initializeWhatsAppAction();
            setIsLoggingIn(false);
            if (!result.success) {
                console.error('Failed to init WhatsApp', result.error);
                return;
            }
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
            if (activeApp === app) setActiveApp(null)
        } else {
            setOpenWindows([...openWindows, app])
            setActiveApp(app)

            // Auto-launch Notion popup immediately on user click
            if (app === 'notion') {
                window.open('https://www.notion.so/login', 'NotionApp', 'width=1280,height=800,menubar=no,toolbar=no,location=no,status=no')
            }
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
                {/* View Toggles */}
                <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Grid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded transition-all ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Layout size={18} />
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA: SPLIT BETWEEN GRID AND WINDOWS */}
            <div className="relative">

                {/* 1. THE LAUNCHER GRID (Always visible, but maybe pushed down or overlayed?) 
                     Lets keep it visible but maybe opacity reduced if windows override? 
                     Actually user wants to expand them FROM this.
                */}
                <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-3' : 'flex flex-col'} gap-6 transition-all duration-500 ${openWindows.length > 0 ? 'opacity-90' : 'opacity-100'}`}>

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
                        viewMode={viewMode}
                    />

                    <AppCard
                        title="WhatsApp"
                        icon={<MessageCircle className="text-green-500" size={24} />}
                        description={whatsappStatus === 'READY' ? "Personal conectado" : (whatsappStatus === 'QR_READY' ? "Esperando escaneo..." : "Mensajería directa")}
                        isConnected={apps.whatsapp.isConnected}
                        onConnect={() => handleStartConnect('whatsapp')}
                        onOpenExternal={() => handleOpenExternal('whatsapp')}
                        onExpand={() => toggleWindow('whatsapp')}
                        color="from-green-500/20 to-emerald-500/20"
                        borderColor="hover:border-green-500/50"
                        statusLabel={whatsappStatus === 'QR_READY' ? 'Pendiente' : undefined}
                        viewMode={viewMode}
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
                        viewMode={viewMode}
                    />
                </div>

                {/* 2. THE WINDOWS LAYER (Global Full-Screen) */}
                {openWindows.length > 0 && (
                    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
                        <AnimatePresence>
                            {openWindows.map((app) => (
                                <AppWindow
                                    key={app}
                                    app={app}
                                    onClose={() => toggleWindow(app)}
                                    url={
                                        app === 'gmail' ? 'https://mail.google.com/tasks/canvas' :
                                            app === 'whatsapp' ? 'https://web.whatsapp.com' :
                                                'https://www.notion.so'
                                    }
                                    data={apps[app].data}
                                    state={windowStates[app]}
                                    active={activeApp === app}
                                    onFocus={() => setActiveApp(app)}
                                    onUpdateState={(newState: any) => setWindowStates(prev => ({ ...prev, [app]: { ...prev[app], ...newState } }))}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <div className="p-2" />

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
                                            {whatsappQR ? (
                                                <div className="p-4 bg-white rounded-xl">
                                                    <img src={whatsappQR} alt="WhatsApp QR Code" className="w-48 h-48" />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    {whatsappStatus === 'READY' ? (
                                                        <CheckCircle2 size={48} className="text-green-500" />
                                                    ) : (
                                                        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                                    )}
                                                    <p className="text-sm text-slate-400">
                                                        {whatsappStatus === 'CONNECTING' ? 'Iniciando cliente...' :
                                                            whatsappStatus === 'READY' ? '¡Conectado!' : 'Generando QR...'}
                                                    </p>
                                                </div>
                                            )}
                                            {whatsappQR && <p className="text-[10px] text-slate-500">Escanea con tu WhatsApp para vincular</p>}
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

                                {whatsappStatus === 'READY' ? (
                                    <button
                                        onClick={() => setConnectingApp(null)}
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg mt-4 transition-all"
                                    >
                                        Cerrar
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleConfirmConnect}
                                        disabled={(connectingApp !== 'whatsapp' && !loginForm.user) || isLoggingIn || (connectingApp === 'whatsapp' && !whatsappQR)}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-4 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                                    >
                                        {isLoggingIn ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Conectar Seguramente'}
                                    </button>
                                )}
                            </div>
                            <button onClick={() => setConnectingApp(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    )
}

function AppCard({ title, icon, description, isConnected, onConnect, onOpenExternal, onExpand, color, borderColor, statusLabel, viewMode }: any) {
    const isList = viewMode === 'list'

    return (
        <div className={`glass-card relative overflow-hidden group border border-slate-800 ${borderColor} transition-all duration-300 ${isList ? 'h-24' : 'h-48'} flex`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

            <div className={`p-6 h-full w-full flex ${isList ? 'flex-row items-center gap-6' : 'flex-col'} relative z-10`}>
                <div className={`flex justify-between items-start ${isList ? 'mb-0' : 'mb-4'}`}>
                    <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 shadow-sm">{icon}</div>
                    {/* Corner Actions for Connected State - GRID ONLY */}
                    {isConnected && !isList && (
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

                <div className={`flex-1 flex ${isList ? 'flex-row items-center gap-6 justify-between' : 'flex-col justify-center'}`}>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
                        <p className="text-xs text-slate-400">{description}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {!isConnected && (
                            <button
                                onClick={onConnect}
                                className={`bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${isList ? 'w-auto' : 'w-full mt-4'}`}
                            >
                                <RefreshCw size={14} /> Conectar
                            </button>
                        )}

                        {isConnected && isList && (
                            <div className="flex gap-2">
                                <button onClick={onExpand} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2 bg-slate-800/50 border border-slate-700" title="Agrandar vista">
                                    <Maximize2 size={16} /> <span className="text-[10px] font-bold">Expandir</span>
                                </button>
                                <button onClick={onOpenExternal} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg flex items-center gap-2 bg-slate-800/50 border border-slate-700" title="Abrir externo">
                                    <ExternalLink size={16} /> <span className="text-[10px] font-bold">Abrir App</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`${isList ? 'absolute right-6 top-3' : 'mt-auto'}`}>
                    {isConnected ? (
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] text-green-400">Sincronizado</span>
                        </div>
                    ) : statusLabel ? (
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                            <span className="text-[10px] text-yellow-400">{statusLabel}</span>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

function AppWindow({ app, onClose, url, data, state, onUpdateState, active, onFocus }: any) {
    const isWhatsApp = app === 'whatsapp';
    const dragControls = useDragControls();

    return (
        <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            onPointerDown={onFocus}
            initial={{ opacity: 0, scale: 0.9, x: state.x, y: state.y }}
            animate={{
                opacity: 1,
                scale: active ? 1.01 : 1,
                x: state.x,
                y: state.y
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.5 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onDragEnd={(_, info) => onUpdateState({ x: state.x + info.offset.x, y: state.y + info.offset.y })}
            style={{
                width: state.width,
                height: state.height,
                zIndex: active ? 100 : 50
            }}
            className={`absolute pointer-events-auto backdrop-blur-sm border rounded-xl shadow-2xl overflow-hidden flex flex-col transition-[border-color,box-shadow,background-color] duration-200 ${active ? 'border-blue-500/50 shadow-blue-500/30' : 'border-slate-800/50 shadow-black/40'
                } ${isWhatsApp ? 'bg-slate-900/70' : 'bg-slate-900/90'}`}
        >
            {/* Window Header */}
            <div
                onPointerDown={(e) => dragControls.start(e)}
                className="h-10 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 cursor-grab active:cursor-grabbing group select-none"
            >
                <div className="flex items-center gap-2">
                    <GripHorizontal size={14} className="text-slate-600 mr-1" />
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

            {/* Window Content */}
            <div className="flex-1 bg-white relative overflow-hidden flex flex-col">
                {app === 'whatsapp' ? (
                    <WhatsAppChatView />
                ) : app === 'gmail' ? (
                    <GmailView />
                ) : app === 'notion' ? (
                    <div className="flex flex-col items-center justify-center h-full bg-white p-8 text-center">
                        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
                            <CheckCircle2 size={40} className="text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Notion Abierto</h3>
                        <p className="text-slate-500 mb-6 text-sm max-w-xs">
                            Hemos abierto Notion en una ventana emergente.
                        </p>
                        <button
                            onClick={() => window.open('https://www.notion.so/login', 'NotionApp', 'width=1280,height=800,menubar=no,toolbar=no,location=no,status=no')}
                            className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
                        >
                            <RefreshCw size={14} />
                            ¿No aparece? Abrir de nuevo
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-500 p-6 text-center">
                            <p className="font-bold mb-2">Vista Previa de {app.toUpperCase()}</p>
                            <p className="text-xs mb-4 max-w-xs">
                                {app === 'gmail' ? 'Cargando correos...' : 'Si ves esto, la app no se está cargando correctamente.'}
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

            {/* Resize Handle */}
            <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-slate-800/50 hover:bg-blue-500 transition-colors rounded-tl-lg flex items-center justify-center"
                onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startWidth = state.width;
                    const startHeight = state.height;

                    const onMouseMove = (e: MouseEvent) => {
                        onUpdateState({
                            width: Math.max(300, startWidth + (e.clientX - startX)),
                            height: Math.max(200, startHeight + (e.clientY - startY))
                        });
                    };

                    const onMouseUp = () => {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                    };

                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                }}
            >
                <div className="w-1 h-1 bg-white/20 rounded-full" />
            </div>
        </motion.div>
    )
}

function WhatsAppChatView() {
    const [chats, setChats] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Fetch for Chats
    useEffect(() => {
        const fetchChats = async () => {
            setLoading(true);
            const result = await getWhatsAppChatsAction();
            if (result.success) {
                setChats(result.chats || []);
            }
            setLoading(false);
        };
        fetchChats();

        // Poll Chats every 10s
        const interval = setInterval(async () => {
            const result = await getWhatsAppChatsAction();
            if (result.success) {
                setChats(result.chats || []);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    // Fetch Messages & Start Polling
    useEffect(() => {
        if (!selectedChat) return;

        const fetchMessages = async (showLoading = false) => {
            if (showLoading) setLoading(true);
            const result = await getWhatsAppMessagesAction(selectedChat.id);
            if (result.success) {
                // Only update if message count changed or last message timestamp is newer
                setMessages(prev => {
                    const newMsgs = result.messages || [];
                    if (JSON.stringify(prev) !== JSON.stringify(newMsgs)) {
                        return newMsgs;
                    }
                    return prev;
                });
            }
            if (showLoading) setLoading(false);
        };

        fetchMessages(true);

        // Poll Messages every 5s
        const interval = setInterval(() => fetchMessages(false), 5000);

        return () => clearInterval(interval);
    }, [selectedChat]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSelectChat = async (chat: any) => {
        setSelectedChat(chat);
        setMessages([]);
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedChat || sending) return;

        setSending(true);
        const result = await sendWhatsAppMessageAction(selectedChat.id, messageInput);
        if (result.success && result.message) {
            setMessages([...messages, {
                id: result.message.id,
                body: result.message.body,
                timestamp: result.message.timestamp,
                fromMe: true,
                type: 'chat'
            }]);
            setMessageInput('');
        } else {
            alert('Error al enviar mensaje: ' + (result.error || 'Mensaje no retornado'));
        }
        setSending(false);
    };

    if (selectedChat) {
        return (
            <div className="flex flex-col h-full bg-slate-50 text-slate-800">
                <div className="bg-white border-b border-slate-200 p-3 flex items-center gap-3">
                    <button onClick={() => setSelectedChat(null)} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <User size={20} />
                        </div>
                        <div>
                            <div className="text-sm font-bold">{selectedChat.name}</div>
                            <div className="text-[10px] text-green-500">En línea</div>
                        </div>
                    </div>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#e5ddd5] scroll-smooth">
                    {loading && messages.length === 0 ? (
                        <div className="flex justify-center py-4"><RefreshCw size={24} className="animate-spin text-slate-400" /></div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-2 rounded-lg text-sm shadow-sm ${msg.fromMe ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                                    <div>{msg.body}</div>
                                    <div className="text-[9px] text-slate-400 text-right mt-1">
                                        {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="bg-white p-3 flex gap-2 border-t border-slate-200">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Escribe un mensaje..."
                        disabled={sending}
                        className="flex-1 bg-slate-100 border-0 rounded-full py-2 px-4 shadow-inner text-sm focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={sending || !messageInput.trim()}
                        className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-full transition-colors disabled:opacity-50"
                    >
                        {sending ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white text-slate-800">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h4 className="font-bold flex items-center gap-2"><List size={18} /> Chats Recientes</h4>
                <button onClick={() => { }} className="p-1 hover:bg-slate-200 rounded text-slate-500"><Settings size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center py-8"><RefreshCw size={24} className="animate-spin text-slate-400" /></div>
                ) : (
                    chats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => handleSelectChat(chat)}
                            className="p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer flex gap-3 transition-colors group"
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                                <User size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm">{chat.name}</span>
                                    <span className="text-[10px] text-slate-400">
                                        {chat.lastMessage ? new Date(chat.lastMessage.timestamp * 1000).toLocaleDateString() : ''}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 line-clamp-1">
                                    {chat.lastMessage?.body || 'Sin mensajes'}
                                </div>
                            </div>
                            {chat.unreadCount > 0 && (
                                <div className="bg-green-500 text-white text-[10px] h-5 w-5 rounded-full flex items-center justify-center font-bold">
                                    {chat.unreadCount}
                                </div>
                            )}
                        </div>
                    ))
                )}
                {chats.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                        <MessageCircle size={48} className="mb-4 opacity-20" />
                        <p className="text-sm">No se encontraron chats recientes.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function GmailView() {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [view, setView] = useState<'list' | 'compose' | 'config'>('list');
    const [emails, setEmails] = useState<any[]>([]);
    const [fetching, setFetching] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    // Config state
    const [config, setConfig] = useState({ user: '', pass: '' });
    const [savingConfig, setSavingConfig] = useState(false);

    const fetchEmails = async () => {
        setFetching(true);
        setStatus(null);
        try {
            const result = await getGmailMessagesAction();
            if (result.success) {
                setEmails(result.messages || []);
                setView('list');
            } else if (result.notConfigured) {
                setView('config');
            } else {
                setStatus({ type: 'error', msg: result.error || 'Error al conectar' });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchEmails();
    }, []);

    const handleSaveConfig = async () => {
        if (!config.user || !config.pass) {
            setStatus({ type: 'error', msg: 'Completa ambos campos' });
            return;
        }
        setSavingConfig(true);
        const result = await saveGmailCredentialsAction(config.user, config.pass);
        setSavingConfig(false);
        if (result.success) {
            setStatus({ type: 'success', msg: 'Configuración guardada' });
            fetchEmails();
        } else {
            setStatus({ type: 'error', msg: result.error || 'Error al guardar' });
        }
    };

    const handleSend = async () => {
        if (!to || !subject || !message) {
            setStatus({ type: 'error', msg: 'Por favor completa todos los campos' });
            return;
        }

        setSending(true);
        setStatus(null);

        try {
            const result = await sendGmailAction(to, subject, message);
            if (result.success) {
                setStatus({ type: 'success', msg: '¡Correo enviado con éxito!' });
                setSubject('');
                setMessage('');
                setTo('');
                setView('list');
                fetchEmails(); // Refresh list
            } else {
                setStatus({ type: 'error', msg: result.error || 'Error al enviar' });
            }
        } catch (error) {
            setStatus({ type: 'error', msg: 'Error de conexión' });
        } finally {
            setSending(false);
        }
    };

    if (view === 'config') {
        return (
            <div className="flex flex-col h-full bg-slate-50 text-slate-800 p-8 space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail size={32} />
                    </div>
                    <h3 className="text-xl font-bold">Configurar Gmail</h3>
                    <p className="text-sm text-slate-500 mt-2">Introduce tu correo y tu Contraseña de Aplicación de 16 dígitos.</p>
                </div>

                {status && (
                    <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        {status.msg}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Correo Gmail</label>
                        <input
                            type="email"
                            value={config.user}
                            onChange={(e) => setConfig({ ...config, user: e.target.value })}
                            placeholder="tu-correo@gmail.com"
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-red-500/20 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Contraseña de Aplicación (16 letras)</label>
                        <input
                            type="password"
                            value={config.pass}
                            onChange={(e) => setConfig({ ...config, pass: e.target.value })}
                            placeholder="xxxx xxxx xxxx xxxx"
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-red-500/20 outline-none"
                        />
                    </div>
                    <button
                        onClick={handleSaveConfig}
                        disabled={savingConfig}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
                    >
                        {savingConfig ? 'Guardando...' : 'Guardar y Continuar'}
                    </button>
                    <p className="text-[10px] text-slate-400 text-center">
                        Para obtener tu clave de 16 letras, activa la Verificación en 2 pasos en Gmail y crea una "Contraseña de Aplicación".
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 text-slate-800">
            <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center">
                <h4 className="font-bold flex items-center gap-2 text-red-600">
                    <Mail size={18} /> {view === 'list' ? 'Bandeja de Entrada' : 'Redactar Correo'}
                </h4>
                <div className="flex gap-2">
                    <button
                        onClick={() => setView(view === 'list' ? 'compose' : 'list')}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all"
                    >
                        {view === 'list' ? 'Redactar' : 'Ver Recibidos'}
                    </button>
                    <button onClick={() => setView('config')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="Configuración">
                        <Settings size={16} />
                    </button>
                    <button onClick={fetchEmails} className={`p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 ${fetching ? 'animate-spin' : ''}`}>
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {status && (
                    <div className="p-4">
                        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${status.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                            }`}>
                            {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            {status.msg}
                        </div>
                    </div>
                )}

                {view === 'list' ? (
                    <div className="divide-y divide-slate-100">
                        {fetching && emails.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                                <RefreshCw size={32} className="animate-spin mb-4 opacity-20" />
                                <p className="text-sm">Sincronizando correos...</p>
                            </div>
                        ) : emails.length > 0 ? (
                            emails.map((email) => (
                                <div key={email.id} className="p-4 hover:bg-white transition-colors cursor-pointer group">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-sm text-slate-900 line-clamp-1">{email.from}</span>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(email.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-xs font-medium text-slate-700 mb-1 line-clamp-1 group-hover:text-red-600 transition-colors">{email.subject}</div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                                <Mail size={48} className="mb-4 opacity-10" />
                                <p className="text-sm">No hay correos recientes</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-6 space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Para</label>
                            <input
                                type="email"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                placeholder="destino@gmail.com"
                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Asunto</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Asunto del correo"
                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Mensaje</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Escribe tu mensaje aquí..."
                                className="w-full h-48 bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none resize-none"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={handleSend}
                                disabled={sending}
                                className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50"
                            >
                                {sending ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                                {sending ? 'Enviando...' : 'Enviar Correo'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

