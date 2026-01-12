'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, TrendingUp, ShoppingBag, PieChart, LogOut, Settings, Users, CreditCard, FileText, Network, UserPlus, ArrowLeft, Building2, FolderKanban, LineChart, ChevronDown, ChevronRight, X, ChevronLeft } from 'lucide-react'
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
            { name: 'Gastos Operativos', href: '/dashboard/expenses', icon: CreditCard },
            { name: 'Análisis', href: '/dashboard/analysis', icon: PieChart },
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
            { name: 'IUE', href: '/dashboard/iue', icon: FileText },
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
    {
        title: 'Central',
        items: [
            { name: 'Usuarios', href: '/dashboard/surveys', icon: Users },
        ]
    },
]

export function Sidebar({ companyName = "Empresa", logoUrl }: { companyName?: string, logoUrl?: string | null }) {
    const pathname = usePathname()
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const { isMobileMenuOpen, closeMobileMenu, isSidebarCollapsed, toggleSidebar } = useDashboard()
    const [imageError, setImageError] = useState(false)

    // State to track expanded groups. Key is group title.
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [title]: !prev[title]
        }))
    }

    const sidebarClasses = `fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out bg-[var(--sidebar-bg)] text-[var(--text-primary)] border-r border-[var(--sidebar-border)] flex flex-col ${isSidebarCollapsed ? 'w-20' : 'w-64'} ${isMobileMenuOpen ? 'translate-x-0' : 'md:translate-x-0 -translate-x-full'}`

    return (
        <>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} companyName={companyName} />

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={closeMobileMenu}
                />
            )}

            <aside className={sidebarClasses}>

                {/* Logo area */}
                <div className={`flex items-center justify-between h-16 border-b border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] flex-shrink-0 transition-all ${isSidebarCollapsed ? 'px-4 justify-center' : 'px-6'}`}>
                    {!isSidebarCollapsed && (
                        <>
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
                                <span className="text-xl font-bold tracking-tight text-[var(--text-primary)] truncate" title={companyName}>
                                    {companyName}
                                </span>
                            )}
                        </>
                    )}
                    {isSidebarCollapsed && (
                        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">
                            {companyName.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                    <button onClick={closeMobileMenu} className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <X className="w-5 h-5" />
                    </button>
                    {!isMobileMenuOpen && (
                        <button
                            onClick={toggleSidebar}
                            className={`hidden md:flex p-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--sidebar-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all transform ${isSidebarCollapsed ? 'rotate-180 translate-x-0' : 'translate-x-2'}`}
                            title={isSidebarCollapsed ? "Expandir" : "Contraer"}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2">

                    {groups.map((group) => {
                        const isExpanded = expandedGroups[group.title] || false

                        return (
                            <div key={group.title} className="mb-2">
                                <button
                                    onClick={() => !isSidebarCollapsed ? toggleGroup(group.title) : toggleSidebar()}
                                    className={`w-full flex items-center justify-between py-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'}`}
                                >
                                    {!isSidebarCollapsed ? group.title : group.title.substring(0, 1)}
                                    {!isSidebarCollapsed && (isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)}
                                </button>

                                {(!isSidebarCollapsed && isExpanded) && (
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
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                                                        }`}
                                                >
                                                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`} />
                                                    {item.name}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                                {(isSidebarCollapsed) && (
                                    <div className="mt-2 space-y-4 flex flex-col items-center">
                                        {group.items.map((item) => {
                                            const isActive = pathname === item.href
                                            const Icon = item.icon

                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    title={item.name}
                                                    className={`p-2.5 rounded-xl transition-all ${isActive
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-110'
                                                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                                                        }`}
                                                >
                                                    <Icon className="w-5 h-5" />
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
                <div className={`p-4 border-t border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] mt-auto flex flex-col items-center gap-2`}>
                    <button
                        onClick={async () => await logout()}
                        className={`flex items-center gap-3 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors ${isSidebarCollapsed ? 'w-10 h-10 p-0 justify-center' : 'w-full'}`}
                        title="Cerrar Sesión"
                    >
                        <LogOut className="w-5 h-5" />
                        {!isSidebarCollapsed && "Cerrar Sesión"}
                    </button>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className={`flex items-center gap-3 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors ${isSidebarCollapsed ? 'w-10 h-10 p-0 justify-center' : 'w-full'}`}
                        title="Configuración"
                    >
                        <Settings className="w-5 h-5" />
                        {!isSidebarCollapsed && "Configuración"}
                    </button>
                </div>
            </aside>
        </>
    )
}
