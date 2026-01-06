'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, TrendingUp, ShoppingBag, PieChart, LogOut, Settings, Users, CreditCard, FileText, Network, UserPlus, ArrowLeft, Building2, FolderKanban, LineChart, ChevronDown, ChevronRight, X } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useDashboard } from '@/app/components/dashboard/DashboardContext'

const SettingsModal = dynamic(() => import('./dashboard/SettingsModal').then(mod => mod.SettingsModal), {
    ssr: false
})


const groups = [
    {
        title: 'Principal',
        items: [
            { name: 'Empresa', href: '/dashboard/company', icon: Building2 },
            { name: 'Proyectos', href: '/dashboard/projects', icon: FolderKanban },
        ]
    },
    {
        title: 'Personal',
        items: [
            { name: 'Dashboard', href: '/dashboard/personal', icon: Home },
            { name: 'Nóminas', href: '/dashboard/personal/payroll', icon: CreditCard },
            { name: 'Candidatos', href: '/dashboard/personal/candidatos', icon: UserPlus },
            { name: 'Organigrama', href: '/dashboard/personal/organigrama', icon: Network },
            { name: 'Flujogramas', href: '/dashboard/personal/flujogramas', icon: FileText },
        ]
    },
    {
        title: 'Impuestos',
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: Home },
            { name: 'Ventas', href: '/dashboard/sales', icon: TrendingUp },
            { name: 'Compras', href: '/dashboard/purchases', icon: ShoppingBag },
            { name: 'Resultados', href: '/dashboard/results', icon: PieChart },
            { name: 'Pagos', href: '/dashboard/pagos', icon: FileText },
        ]
    },
    {
        title: 'Análisis',
        items: [
            { name: 'Análisis', href: '/dashboard/analysis', icon: LineChart },
        ]
    },
]

export function Sidebar({ companyName = "SAWALIFE", logoUrl }: { companyName?: string, logoUrl?: string | null }) {
    const pathname = usePathname()
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const { isMobileMenuOpen, closeMobileMenu } = useDashboard()
    const [imageError, setImageError] = useState(false)

    // State to track expanded groups. Key is group title.
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [title]: !prev[title]
        }))
    }

    const sidebarClasses = `fixed left-0 top-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 border-r border-slate-800 transition-transform duration-300 ease-in-out flex flex-col md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`

    return (
        <>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={closeMobileMenu}
                />
            )}

            <aside className={sidebarClasses}>

                {/* Logo area */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800 bg-slate-950 flex-shrink-0">
                    {!imageError && logoUrl ? (
                        <div className="relative h-8 w-full max-w-[140px] flex items-center">
                            <img
                                src={logoUrl}
                                alt={companyName}
                                className="max-h-full max-w-full object-contain"
                                onError={() => setImageError(true)}
                            />
                        </div>
                    ) : (
                        <span className="text-xl font-bold tracking-tight text-white truncate" title={companyName}>
                            {companyName}
                        </span>
                    )}
                    <button onClick={closeMobileMenu} className="md:hidden text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2">

                    {groups.map((group) => {
                        const isExpanded = expandedGroups[group.title] || false

                        return (
                            <div key={group.title} className="mb-2">
                                <button
                                    onClick={() => toggleGroup(group.title)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
                                >
                                    {group.title}
                                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </button>

                                {isExpanded && (
                                    <div className="mt-1 space-y-1 animate-in slide-in-from-left-2 duration-200">
                                        {group.items.map((item) => {
                                            const isActive = pathname === item.href
                                            const Icon = item.icon

                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => closeMobileMenu()}
                                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                                        }`}
                                                >
                                                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                                                    {item.name}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Bottom Actions - Pinned to bottom using mt-auto if needed, but flex-col and flex-1 on container does it */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50 mt-auto">
                    <button
                        onClick={async () => await logout()}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors mb-1"
                    >
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Settings className="w-5 h-5" />
                        Configuración
                    </button>
                </div>
            </aside>
        </>
    )
}
