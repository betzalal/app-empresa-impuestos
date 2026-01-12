'use client'

import { useEffect, useState } from 'react'
import { getTaxAnalytics } from '@/app/actions/analysis'
import { Activity } from 'lucide-react'
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export function TaxView({ year }: { year: number }) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true
        setLoading(true)
        getTaxAnalytics(year).then(res => {
            if (isMounted && res.success) {
                setData(res.data)
            }
            if (isMounted) setLoading(false)
        })
        return () => { isMounted = false }
    }, [year])

    if (loading) return <div className="p-12 flex justify-center"><Activity className="w-8 h-8 text-emerald-500 animate-spin" /></div>
    if (!data) return null

    // Transform data for Recharts
    const chartData = data.monthlyData.map((d: any, index: number) => ({
        name: MONTHS[index],
        debito: d.debit,
        credito: d.credit,
        pagar: d.payable
    }))

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-rose-500/20 shadow-sm">
                    <p className="text-[var(--text-secondary)] text-sm">Débito Fiscal Anual (13% Ventas)</p>
                    <p className="text-2xl font-bold text-rose-500">Bs {data.totalDebit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-emerald-500/20 shadow-sm">
                    <p className="text-[var(--text-secondary)] text-sm">Crédito Fiscal Anual (13% Compras)</p>
                    <p className="text-2xl font-bold text-emerald-500">Bs {data.totalCredit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-yellow-500/20 shadow-sm">
                    <p className="text-[var(--text-secondary)] text-sm">Impuesto Estimado (IVA)</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">Bs {data.totalPayable.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
            </div>

            {/* Main Chart */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm backdrop-blur-sm">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Balance Fiscal (IVA)</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6">Comparativa de Débito vs Crédito Fiscal</p>

                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
                            <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Bs ${value}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                            />
                            <Legend wrapperStyle={{ color: 'var(--text-primary)' }} />
                            <Bar dataKey="debito" name="Débito Fiscal" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            <Bar dataKey="credito" name="Crédito Fiscal" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            <Line type="monotone" dataKey="pagar" name="A Pagar (Est.)" stroke="#eab308" strokeWidth={3} dot={{ r: 4 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
