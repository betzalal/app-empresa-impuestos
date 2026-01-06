'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface DashboardContextType {
    isMobileMenuOpen: boolean
    toggleMobileMenu: () => void
    closeMobileMenu: () => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev)
    const closeMobileMenu = () => setIsMobileMenuOpen(false)

    return (
        <DashboardContext.Provider value={{ isMobileMenuOpen, toggleMobileMenu, closeMobileMenu }}>
            {children}
        </DashboardContext.Provider>
    )
}

export function useDashboard() {
    const context = useContext(DashboardContext)
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider')
    }
    return context
}
