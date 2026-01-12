'use client'

import { useState, useEffect } from 'react'
import { LayoutDashboard, Wallet, ShoppingCart, Users, Receipt, Calendar, ArrowRightLeft } from 'lucide-react'
import { MetricCard } from './metric-card'
import { OverviewView } from '@/app/dashboard/analysis/views/OverviewView'
import { SalesView } from '@/app/dashboard/analysis/views/SalesView'
import { ExpensesView } from '@/app/dashboard/analysis/views/ExpensesView'
import { HRView } from '@/app/dashboard/analysis/views/HRView'
import { PurchasesView } from '@/app/dashboard/analysis/views/PurchasesView'
import { TaxView } from '@/app/dashboard/analysis/views/TaxView'
import { Reorder } from 'framer-motion'

const DEFAULT_TABS = [
    { id: 'overview', label: 'General', icon: LayoutDashboard },
    { id: 'sales', label: 'Ventas', icon: Wallet },
    { id: 'expenses', label: 'Gastos', icon: ShoppingCart },
    { id: 'purchases', label: 'Compras', icon: ShoppingCart },
    { id: 'hr', label: 'RRHH', icon: Users },
    { id: 'taxes', label: 'Impuestos', icon: Receipt },
]

export function AnalysisLayout({ initialData }: { initialData?: any }) {
    const [activeTab, setActiveTab] = useState('overview')
    const [years, setYears] = useState([2024, 2025])
    const [tabs, setTabs] = useState(DEFAULT_TABS)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load saved order on mount
    useEffect(() => {
        const savedOrder = localStorage.getItem('base_analysis_tabs_order')
        if (savedOrder) {
            try {
                const parsedOrder = JSON.parse(savedOrder) as string[]
                // Sort DEFAULT_TABS based on saved IDs
                const sortedTabs = []
                const remainingTabs = [...DEFAULT_TABS]

                for (const id of parsedOrder) {
                    const index = remainingTabs.findIndex(t => t.id === id)
                    if (index !== -1) {
                        sortedTabs.push(remainingTabs[index])
                        remainingTabs.splice(index, 1)
                    }
                }
                // Append any new tabs that weren't in the saved order
                setTabs([...sortedTabs, ...remainingTabs])
            } catch (e) {
                console.error("Failed to parse saved tabs", e)
            }
        }
        setIsLoaded(true)
    }, [])

    const handleReorder = (newTabs: typeof DEFAULT_TABS) => {
        setTabs(newTabs)
        localStorage.setItem('base_analysis_tabs_order', JSON.stringify(newTabs.map(t => t.id)))
    }

    if (!isLoaded) return null // Prevent hydration mismatch

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                        Centro de Análisis
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">Visualización de datos estratégicos</p>
                </div>
            </div>

            {/* Navigation Tabs (Reorderable) */}
            <div className="p-1 bg-[var(--bg-card)] backdrop-blur-sm rounded-2xl border border-[var(--border-color)] w-fit overflow-x-auto">
                <Reorder.Group
                    axis="x"
                    values={tabs}
                    onReorder={handleReorder}
                    className="flex flex-wrap gap-2"
                >
                    {tabs.map(tab => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <Reorder.Item key={tab.id} value={tab}>
                                <button
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 select-none
                                        ${isActive
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5'
                                        }
                                    `}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            </Reorder.Item>
                        )
                    })}
                </Reorder.Group>
                <div className="mt-2 text-xs text-[var(--text-secondary)] text-center flex items-center justify-center gap-1 italic">
                    <ArrowRightLeft className="w-3 h-3" /> Arrastra para reordenar
                </div>
            </div>

            {/* Content Area - Min Height to prevent flickering */}
            <div className="min-h-[500px]">
                {activeTab === 'overview' && <OverviewView years={years} setYears={setYears} />}
                {activeTab === 'expenses' && <ExpensesView year={years[years.length - 1]} />}
                {activeTab === 'purchases' && <PurchasesView year={years[years.length - 1]} />}
                {activeTab === 'sales' && <SalesView year={years[years.length - 1]} />}
                {activeTab === 'hr' && <HRView year={years[years.length - 1]} />}
                {activeTab === 'taxes' && <TaxView year={years[years.length - 1]} />}
            </div>
        </div>
    )
}
