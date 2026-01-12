'use client'

import { useEffect, useState } from 'react'
import { getPayrollAnalytics } from '@/app/actions/analysis'
import { Activity } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export function HRView({ year }: { year: number }) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true
        setLoading(true)
        getPayrollAnalytics(year).then(res => {
            if (isMounted && res.success) {
                setData(res.data)
            }
            if (isMounted) setLoading(false)
        })
        return () => { isMounted = false }
    }, [year])

    if (loading) return <div className="p-12 flex justify-center"><Activity className="w-8 h-8 text-blue-500 animate-spin" /></div>
    if (!data) return null

    // Transform data for Recharts
    const chartData = data.monthlyPayroll.map((amount: number, index: number) => ({
        name: MONTHS[index],
        nomina: amount
    }))

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm backdrop-blur-sm">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Costo de Nómina</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Total pagado en salarios y bonos mensuales</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-[var(--text-secondary)] uppercase tracking-widest">Total Anual</p>
                        <p className="text-3xl font-bold text-[var(--text-primary)]">
                            Bs {data.monthlyPayroll.reduce((a: number, b: number) => a + b, 0).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
                            <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Bs ${value / 1000}k`} />
                            <Tooltip
                                cursor={{ fill: 'var(--text-primary)', opacity: 0.1 }}
                                contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                            />
                            <Bar dataKey="nomina" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
