'use client'

import React, { useMemo } from 'react'

interface AnnualData {
    month: number
    ivaToPay: number
    itToPay: number
    iueEstimated: number
}

interface Props {
    data2025: AnnualData[]
    data2026: AnnualData[]
}

export default function AnnualTaxSummary({ data2025, data2026 }: Props) {
    const total2025 = useMemo(() => {
        return data2025.reduce((acc, curr) => acc + curr.ivaToPay + curr.itToPay + (curr.iueEstimated || 0), 0)
    }, [data2025])

    const total2026 = useMemo(() => {
        return data2026.reduce((acc, curr) => acc + curr.ivaToPay + curr.itToPay + (curr.iueEstimated || 0), 0)
    }, [data2026])

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-10 -mt-10 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
                <h3 className="text-[var(--text-secondary)] text-sm font-medium uppercase tracking-wider relative z-10">Impuestos 2025 (Pagado/Deuda)</h3>
                <div className="mt-2 flex items-end justify-between relative z-10">
                    <span className="text-3xl font-bold text-[var(--text-primary)]">Bs {total2025.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full border border-indigo-500/20">Acumulado</span>
                </div>
            </div>

            <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-10 -mt-10 blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                <h3 className="text-[var(--text-secondary)] text-sm font-medium uppercase tracking-wider relative z-10">Impuestos 2026 (Proyectado)</h3>
                <div className="mt-2 flex items-end justify-between relative z-10">
                    <span className="text-3xl font-bold text-[var(--text-primary)]">Bs {total2026.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">En curso</span>
                </div>
            </div>
        </div>
    )
}
