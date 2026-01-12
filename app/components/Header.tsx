'use client'

import { Bell, Search, Menu } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { getSystemNotifications, SystemNotification } from '@/app/actions/notifications'
import { useDashboard } from '@/app/components/dashboard/DashboardContext'

const UserProfileModal = dynamic(() => import('./dashboard/UserProfileModal').then(mod => mod.UserProfileModal), {
    ssr: false
})

export function Header() {
    return <HeaderContent />
}


function HeaderContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const [searchTerm, setSearchTerm] = useState('')
    const [notifications, setNotifications] = useState<SystemNotification[]>([])
    const [showNotifs, setShowNotifs] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const { toggleMobileMenu, isSidebarCollapsed } = useDashboard()
    const [isProfileOpen, setIsProfileOpen] = useState(false)

    useEffect(() => {
        getSystemNotifications().then(setNotifications)
    }, [])

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const term = searchTerm.toLowerCase()
            const params = new URLSearchParams(searchParams.toString())
            // Simple logic for now
            const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
            const monthIndex = months.findIndex(m => term.includes(m))
            if (monthIndex !== -1) params.set('month', (monthIndex + 1).toString())

            router.replace(`${pathname}?${params.toString()}`)
        }
    }

    const unreadCount = notifications.length

    return (
        <>
            <UserProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                user={{
                    name: 'Dante Lorini', // Placeholder - should come from session
                    email: 'soporte@tuempresa.com',
                    phone: '777-77777',
                    image: '' // Use session image if available
                }}
            />

            <header className={`fixed top-0 right-0 left-0 transition-all duration-300 h-16 bg-[var(--glass-bg)] backdrop-blur-md border-b border-[var(--glass-border)] z-30 flex items-center justify-between md:justify-end px-6 ${isSidebarCollapsed ? 'md:left-20' : 'md:left-64'}`}>

                <button
                    onClick={toggleMobileMenu}
                    className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/10 rounded-lg"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative flex items-center">
                        {showSearch && (
                            <input
                                type="text"
                                autoFocus
                                className="absolute right-10 w-48 py-1 px-3 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-lg animate-in fade-in slide-in-from-right-4"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearch}
                                onBlur={() => !searchTerm && setShowSearch(false)}
                            />
                        )}
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--text-primary)]/10"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifs(!showNotifs)}
                            className="relative p-2 text-[var(--text-secondary)] hover:text-orange-500 transition-colors rounded-full hover:bg-[var(--text-primary)]/10"
                        >
                            {unreadCount > 0 && (
                                <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-[var(--bg-primary)]"></div>
                            )}
                            <Bell className="w-5 h-5" />
                        </button>

                        {/* Dropdown */}
                        {showNotifs && (
                            <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-card)] backdrop-blur-lg rounded-xl shadow-2xl border border-[var(--border-color)] overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                <div className="p-3 border-b border-[var(--border-color)] bg-[var(--text-primary)]/5 flex justify-between items-center">
                                    <span className="font-semibold text-sm text-[var(--text-primary)]">Notifications</span>
                                    {unreadCount > 0 && <span className="bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>}
                                </div>
                                <div className="max-h-[300px] overflow-y-auto text-[var(--text-primary)]">
                                    {notifications.length === 0 ? (
                                        <div className="p-6 text-center text-[var(--text-secondary)] text-sm">
                                            No new notifications.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-[var(--border-color)]">
                                            {notifications.map(notif => (
                                                <div key={notif.id} className={`p-4 hover:bg-[var(--text-primary)]/5 transition-colors ${notif.type === 'emergency' ? 'bg-red-500/10' : ''}`}>
                                                    <div className="flex gap-3">
                                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.type === 'emergency' ? 'bg-red-500' :
                                                            notif.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                                                            }`} />
                                                        <div>
                                                            <h4 className={`text-sm font-bold ${notif.type === 'emergency' ? 'text-red-600' : 'text-[var(--text-primary)]'}`}>
                                                                {notif.title}
                                                            </h4>
                                                            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                                                                {notif.message}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile */}
                    <div className="pl-4 border-l border-[var(--border-color)]">
                        <button
                            onClick={() => setIsProfileOpen(true)}
                            className="h-9 w-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 p-[2px] cursor-pointer hover:scale-105 transition-transform"
                        >
                            <div className="h-full w-full rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                                <span className="font-bold text-orange-600 dark:text-orange-400 text-xs">AD</span>
                            </div>
                        </button>
                    </div>

                </div>
            </header>
        </>
    )
}
