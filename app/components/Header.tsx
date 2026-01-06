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
    const { toggleMobileMenu } = useDashboard()
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
                    email: 'dante@sawalife.com',
                    phone: '777-77777',
                    image: '' // Use session image if available
                }}
            />

            <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-white/60 dark:border-slate-800 z-30 flex items-center justify-between md:justify-end px-6 transition-all">

                <button
                    onClick={toggleMobileMenu}
                    className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
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
                                className="absolute right-10 w-48 py-1 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-lg animate-in fade-in slide-in-from-right-4"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearch}
                                onBlur={() => !searchTerm && setShowSearch(false)}
                            />
                        )}
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className="p-2 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifs(!showNotifs)}
                            className="relative p-2 text-slate-400 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            {unreadCount > 0 && (
                                <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900"></div>
                            )}
                            <Bell className="w-5 h-5" />
                        </button>

                        {/* Dropdown */}
                        {showNotifs && (
                            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                <div className="p-3 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">Notifications</span>
                                    {unreadCount > 0 && <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>}
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">
                                            No new notifications.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {notifications.map(notif => (
                                                <div key={notif.id} className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${notif.type === 'emergency' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                                    <div className="flex gap-3">
                                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.type === 'emergency' ? 'bg-red-500' :
                                                            notif.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                                                            }`} />
                                                        <div>
                                                            <h4 className={`text-sm font-bold ${notif.type === 'emergency' ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                                {notif.title}
                                                            </h4>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
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
                    <div className="pl-4 border-l border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setIsProfileOpen(true)}
                            className="h-9 w-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 p-[2px] cursor-pointer hover:scale-105 transition-transform"
                        >
                            <div className="h-full w-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                                <span className="font-bold text-orange-600 dark:text-orange-400 text-xs">AD</span>
                            </div>
                        </button>
                    </div>

                </div>
            </header>
        </>
    )
}
