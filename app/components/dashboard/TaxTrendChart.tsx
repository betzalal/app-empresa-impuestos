'use client'

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps
} from 'recharts'

interface Props {
    data: any[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[var(--tooltip-bg)] text-[var(--text-primary)] p-3 rounded-xl border border-[var(--border-color)] shadow-xl backdrop-blur-md text-xs">
                <p className="font-bold mb-2 text-[var(--text-secondary)] tracking-widest uppercase text-[10px]">{label}</p>
                {payload.map((entry: any) => (
                    <div key={entry.name} className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="capitalize text-[var(--text-secondary)]">{entry.name}:</span>
                        <span className="font-bold">Bs {entry.value?.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

export default function TaxTrendChart({ data }: Props) {
    return (
        <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-gradient-to-b from-blue-500 via-orange-500 to-yellow-500 rounded-full"></span>
                Evolución de Impuestos (IVA, IT, IUE)
            </h3>
            <div className="h-[300px] w-full min-w-0">
                <ResponsiveContainer width="99%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorIVA" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorIT" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorIUE" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}
                            tickFormatter={(value) => `Bs ${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="ivaToPay"
                            name="IVA"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorIVA)"
                        />
                        <Area
                            type="monotone"
                            dataKey="itToPay"
                            name="IT"
                            stroke="#F97316"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorIT)"
                        />
                        <Area
                            type="monotone"
                            dataKey="iueEstimated"
                            name="IUE (Est)"
                            stroke="#EAB308"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorIUE)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
