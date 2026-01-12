'use client'

import { useDashboard } from './DashboardContext'
import { ReactNode } from 'react'

export function MainContent({ children }: { children: ReactNode }) {
    const { isSidebarCollapsed } = useDashboard()

    return (
        <main className={`pt-24 pb-8 px-4 sm:px-8 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </main>
    )
}
