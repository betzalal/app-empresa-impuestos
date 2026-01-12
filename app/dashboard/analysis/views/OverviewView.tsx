'use client'

import { useEffect, useState } from 'react'
import { getGeneralStats, getMultiYearAnalysis } from '@/app/actions/analysis'
import { MetricCard } from '../components/metric-card'
import { DollarSign, TrendingUp, TrendingDown, Users, Activity, Calendar } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'

export function OverviewView({ years, setYears }: { years: number[], setYears: (y: number[]) => void }) {
    const [stats, setStats] = useState<any>(null)
    const [analysisData, setAnalysisData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeMetric, setActiveMetric] = useState<'income' | 'expenses' | 'profit'>('income')

    useEffect(() => {
        let isMounted = true
        setLoading(true)

        const lastYear = years[years.length - 1]

        Promise.all([
            getGeneralStats(lastYear),
            getMultiYearAnalysis(years)
        ]).then(([statsRes, analysisRes]) => {
            if (isMounted) {
                if (statsRes.success) setStats(statsRes.data)
                if (analysisRes.success) setAnalysisData(analysisRes.data)
                setLoading(false)
            }
        })

        return () => { isMounted = false }
    }, [years])

    if (loading) {
        return <div className="p-12 flex justify-center"><Activity className="w-8 h-8 text-blue-500 animate-spin" /></div>
    }

    if (!stats) return null

    const metricColors: Record<string, string> = {
        income: "#3b82f6",
        expenses: "#f43f5e",
        profit: "#10b981"
    }

    const yearColors = ["#3b82f6", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#ec4899"]

    const getGrowth = (metric: 'income' | 'expenses' | 'profit') => {
        if (!analysisData || analysisData.results.length < 2) return 0
        const current = analysisData.results[analysisData.results.length - 1]
        const previous = analysisData.results[analysisData.results.length - 2]

        let currVal = 0, prevVal = 0
        if (metric === 'income') { currVal = current.totalIncome; prevVal = previous.totalIncome }
        else if (metric === 'expenses') { currVal = current.totalExpenses; prevVal = previous.totalExpenses }
        else {
            currVal = (current.totalIncome || 0) - (current.totalExpenses || 0)
            prevVal = (previous.totalIncome || 0) - (previous.totalExpenses || 0)
        }

        if (prevVal === 0) return 0
        return ((currVal - prevVal) / prevVal) * 100
    }

    const toggleYear = (y: number) => {
        if (years.includes(y)) {
            if (years.length > 1) {
                setYears(years.filter(year => year !== y))
            }
        } else {
            setYears([...years, y].sort())
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Ingreso Bruto"
                    value={`Bs ${stats.totalIncome.toLocaleString()}`}
                    icon={TrendingUp}
                    color="green"
                    change={getGrowth('income')}
                    subtitle={`vs ${years.length > 1 ? years[years.length - 2] : years[0] - 1}`}
                    onClick={() => setActiveMetric('income')}
                    isActive={activeMetric === 'income'}
                />
                <MetricCard
                    title="Gastos Totales"
                    value={`Bs ${stats.totalExpenses.toLocaleString()}`}
                    icon={TrendingDown}
                    color="red"
                    change={getGrowth('expenses')}
                    subtitle={`vs ${years.length > 1 ? years[years.length - 2] : years[0] - 1}`}
                    onClick={() => setActiveMetric('expenses')}
                    isActive={activeMetric === 'expenses'}
                />
                <MetricCard
                    title="Utilidad Neta"
                    value={`Bs ${stats.netProfit.toLocaleString()}`}
                    icon={DollarSign}
                    color="blue"
                    change={getGrowth('profit')}
                    subtitle={`vs ${years.length > 1 ? years[years.length - 2] : years[0] - 1}`}
                    onClick={() => setActiveMetric('profit')}
                    isActive={activeMetric === 'profit'}
                />
                <MetricCard
                    title="Equipo Activo"
                    value={stats.employeeCount.toString()}
                    icon={Users}
                    color="purple"
                    subtitle="Colaboradores"
                />
            </div>

            <div className="glass-card p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full -mr-48 -mt-48" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 relative z-10">
                    <div>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                            {activeMetric === 'income' ? 'Análisis de Ingresos' : activeMetric === 'expenses' ? 'Análisis de Gastos' : 'Análisis de Utilidad'}
                            <div className={`w-2 h-2 rounded-full animate-pulse`} style={{ backgroundColor: metricColors[activeMetric] }} />
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-2 font-medium">Comparativa histórica de rendimiento financiero</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                    <div className="flex lg:flex-col gap-3 p-2 bg-[var(--text-primary)]/5 rounded-2xl border border-[var(--border-color)] backdrop-blur-sm self-start min-w-[100px]">
                        <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase px-3 py-1 tracking-widest hidden lg:block">Años</p>
                        {[2023, 2024, 2025, 2026].map(y => (
                            <button
                                key={y}
                                onClick={() => toggleYear(y)}
                                className={`
                                    flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300
                                    ${years.includes(y)
                                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/10'}
                                `}
                            >
                                {y}
                                {years.includes(y) && <div className="w-1.5 h-1.5 rounded-full bg-white ml-2 shadow-[0_0_8px_white]" />}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 h-[450px] w-full min-h-[400px] bg-[var(--text-primary)]/5 rounded-2xl border border-[var(--border-color)] p-4">
                        {analysisData && analysisData.chartData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analysisData.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        stroke="var(--text-secondary)"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ dy: 10 }}
                                    />
                                    <YAxis
                                        stroke="var(--text-secondary)"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `Bs ${Math.abs(value) >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}
                                        cursor={{ stroke: 'var(--text-secondary)', strokeWidth: 1 }}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        iconType="circle"
                                        content={({ payload }) => (
                                            <div className="flex gap-4 justify-end mb-4">
                                                {payload?.map((entry: any, index: number) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                        <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{entry.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    />

                                    {years.map((y, idx) => (
                                        <Area
                                            key={y}
                                            type="monotone"
                                            dataKey={`${activeMetric}_${y}`}
                                            name={`${y}`}
                                            stroke={yearColors[idx % yearColors.length]}
                                            strokeWidth={idx === years.length - 1 ? 4 : 2}
                                            fillOpacity={0.1}
                                            fill={yearColors[idx % yearColors.length]}
                                            animationDuration={1500}
                                        />
                                    ))}
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-[var(--text-secondary)]">
                                <Activity className="w-6 h-6 animate-spin mr-3 text-blue-500" />
                                <p className="text-sm font-bold tracking-widest uppercase">Generando inteligencia...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}


