'use client'

import { useEffect, useState } from 'react'
import { getPurchaseAnalytics } from '@/app/actions/analysis'
import { Activity } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts'

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export function PurchasesView({ year }: { year: number }) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true
        setLoading(true)
        getPurchaseAnalytics(year).then(res => {
            if (isMounted && res.success) {
                setData(res.data)
            }
            if (isMounted) setLoading(false)
        })
        return () => { isMounted = false }
    }, [year])

    if (loading) return <div className="p-12 flex justify-center"><Activity className="w-8 h-8 text-cyan-500 animate-spin" /></div>
    if (!data) return null

    // Transform data for Recharts
    const chartData = data.monthlyPurchases.map((amount: number, index: number) => ({
        name: MONTHS[index],
        compras: amount
    }))

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Chart */}
                <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Evolución de Compras</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-6">Gastos en insumos y materia prima</p>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorCompras" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
                                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Bs ${value / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                    cursor={{ stroke: '#06b6d4', strokeWidth: 2 }}
                                />
                                <Area type="monotone" dataKey="compras" stroke="#06b6d4" fillOpacity={1} fill="url(#colorCompras)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Providers / Concepts */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Mayores Conceptos</h3>
                    <div className="space-y-4">
                        {data.topProviders.map((item: any, index: number) => {
                            const max = data.topProviders[0]?.amount || 1
                            const percentage = Math.round((item.amount / max) * 100)

                            return (
                                <div key={index} className="group">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-[var(--text-secondary)] truncate w-2/3">{item.name}</span>
                                        <span className="text-sm font-bold text-[var(--text-primary)]">Bs {item.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2 overflow-hidden border border-[var(--border-color)]">
                                        <div
                                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                        {data.topProviders.length === 0 && (
                            <div className="text-center text-slate-500 py-8 italic">No hay registros de compras</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
