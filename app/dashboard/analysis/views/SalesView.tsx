'use client'

import { useEffect, useState } from 'react'
import { getSalesAnalytics } from '@/app/actions/analysis'
import { Activity } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export function SalesView({ year }: { year: number }) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true
        setLoading(true)
        console.log(`Fetching sales for year ${year}...`)

        getSalesAnalytics(year).then(res => {
            console.log('Sales response:', res)
            if (isMounted) {
                if (res.success) {
                    setData(res.data)
                } else {
                    console.error('Sales fetch failed:', res.error)
                }
                setLoading(false)
            }
        }).catch(err => {
            console.error("Critical error fetching sales:", err)
            if (isMounted) setLoading(false)
        })
        return () => { isMounted = false }
    }, [year])

    if (loading) return <div className="p-12 flex justify-center"><Activity className="w-8 h-8 text-purple-500 animate-spin" /></div>

    if (!data) return (
        <div className="p-12 text-center bg-[var(--bg-card)] rounded-xl border border-dashed border-[var(--border-color)]">
            <p className="text-[var(--text-secondary)]">No se pudieron cargar los datos de ventas.</p>
            <p className="text-xs text-[var(--text-secondary)] mt-2 italic">Revise la consola para más detalles.</p>
        </div>
    )

    // Transform data for Recharts
    const chartData = data.monthlySales.map((amount: number, index: number) => ({
        name: MONTHS[index],
        ventas: amount
    }))

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Chart */}
                <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Comportamiento de Ventas</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-6">Ingresos mensuales brutos</p>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
                                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Bs ${value / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                    cursor={{ fill: 'var(--text-primary)', opacity: 0.1 }}
                                />
                                <Bar dataKey="ventas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Methods Breakdown */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Métodos de Pago</h3>
                    <div className="space-y-4">
                        {Object.entries(data.byMethod).map(([method, amount]: [string, any]) => {
                            const total = Object.values(data.byMethod).reduce((a: any, b: any) => a + b, 0) as number
                            const percentage = Math.round((amount / total) * 100)

                            return (
                                <div key={method} className="group">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-[var(--text-secondary)]">{method}</span>
                                        <span className="text-sm font-bold text-[var(--text-primary)]">Bs {amount.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2 overflow-hidden border border-[var(--border-color)]">
                                        <div
                                            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1 text-right italic">{percentage}% del total</p>
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>
        </div>
    )
}
