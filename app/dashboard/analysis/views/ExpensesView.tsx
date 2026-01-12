'use client'

import { useEffect, useState } from 'react'
import { getExpenseAnalytics } from '@/app/actions/analysis'
import { Activity } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const CATEGORY_COLORS = [
    "#4f46e5", // indigo
    "#0ea5e9", // sky
    "#10b981", // emerald
    "#ef4444", // red
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#64748b", // slate
]

export function ExpensesView({ year }: { year: number }) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true
        setLoading(true)
        getExpenseAnalytics(year).then(res => {
            if (isMounted && res.success) {
                setData(res.data)
            }
            if (isMounted) setLoading(false)
        })
        return () => { isMounted = false }
    }, [year])

    if (loading) return <div className="p-12 flex justify-center"><Activity className="w-8 h-8 text-rose-500 animate-spin" /></div>
    if (!data) return null

    const chartData = data.chartData.map((item: any, idx: number) => ({
        ...item,
        name: MONTHS[idx]
    }))

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Main Grouped Bar Chart */}
                <div className="lg:col-span-3 glass-card p-8 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Evolución de Egresos</h3>
                            <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">Comparativa mensual por categorías operativas</p>
                        </div>
                        <div className="px-4 py-2 bg-[var(--text-primary)]/5 rounded-2xl border border-[var(--border-color)]">
                            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">{year}</span>
                        </div>
                    </div>

                    <div className="h-[450px] w-full min-h-[400px]">
                        <ResponsiveContainer width="100%" height="100%" minHeight={400}>
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--text-secondary)"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ dy: 10, fontWeight: 700 }}
                                />
                                <YAxis
                                    stroke="var(--text-secondary)"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `Bs ${(value / 1000).toFixed(0)}k`}
                                    tick={{ fontWeight: 700 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'var(--text-primary)', opacity: 0.05 }}
                                    contentStyle={{
                                        backgroundColor: 'var(--tooltip-bg)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '20px',
                                        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                                        padding: '16px'
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', padding: '4px 0', color: 'var(--text-primary)' }}
                                    labelStyle={{ color: 'var(--text-secondary)', fontSize: '10px', marginBottom: '8px', fontWeight: '900', textTransform: 'uppercase' }}
                                    formatter={(value: any) => [`Bs ${Number(value || 0).toLocaleString()}`, ""]}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    align="left"
                                    iconType="circle"
                                    wrapperStyle={{ paddingTop: '40px' }}
                                    content={({ payload }) => (
                                        <div className="flex flex-wrap gap-x-8 gap-y-3 px-2">
                                            {payload?.map((entry: any, index: number) => (
                                                <div key={index} className="flex items-center gap-2.5">
                                                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                                                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{entry.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                />

                                {data.allCategories.map((cat: string, idx: number) => (
                                    <Bar
                                        key={cat}
                                        dataKey={cat}
                                        fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                                        radius={[6, 6, 0, 0]}
                                        barSize={10}
                                        animationDuration={1500}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="glass-card p-6">
                        <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-6">Resumen de Categorías</h4>
                        <div className="space-y-6">
                            {data.allCategories.map((cat: string, idx: number) => {
                                const amount = data.byCategory[cat]
                                const total = Object.values(data.byCategory).reduce((a: any, b: any) => a + b, 0) as number
                                const percentage = total > 0 ? Math.round((amount / total) * 100) : 0

                                return (
                                    <div key={cat} className="group">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                                                <span className="text-xs font-bold text-[var(--text-secondary)] tracking-tight">{cat}</span>
                                            </div>
                                            <span className="text-xs font-black text-[var(--text-primary)]">Bs {amount.toLocaleString()}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-[var(--border-color)]/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000"
                                                style={{
                                                    width: `${percentage}%`,
                                                    backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-rose-600 to-orange-600 rounded-3xl p-8 flex flex-col justify-between shadow-2xl shadow-rose-900/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <Activity className="w-24 h-24" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">Total Acumulado</p>
                            <h3 className="text-4xl font-black text-white mt-1 tracking-tighter">
                                Bs {(Object.values(data.byCategory).reduce((a: any, b: any) => a + b, 0) as number).toLocaleString()}
                            </h3>
                        </div>
                        <div className="mt-8 relative z-10">
                            <div className="inline-flex items-center px-3 py-1 bg-white/10 rounded-full border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest">
                                Análisis {year}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
