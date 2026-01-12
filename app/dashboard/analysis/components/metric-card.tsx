import { ArrowDown, ArrowUp, Minus } from "lucide-react"

interface MetricCardProps {
    title: string
    value: string
    change?: number | string | null // Percentage change or numeric string
    icon: React.ElementType
    color?: "blue" | "green" | "red" | "purple" | "orange"
    subtitle?: string
    onClick?: () => void
    isActive?: boolean
}

export function MetricCard({ title, value, change, icon: Icon, color = "blue", subtitle, onClick, isActive }: MetricCardProps) {
    const colors = {
        blue: "from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/20",
        green: "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20",
        red: "from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/20",
        purple: "from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/20",
        orange: "from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/20",
    }

    const iconColors = {
        blue: "bg-blue-500/20 text-blue-400",
        green: "bg-emerald-500/20 text-emerald-400",
        red: "bg-rose-500/20 text-rose-400",
        purple: "bg-purple-500/20 text-purple-400",
        orange: "bg-amber-500/20 text-amber-400",
    }

    return (
        <div
            onClick={onClick}
            className={`
                relative overflow-hidden rounded-2xl border backdrop-blur-sm bg-gradient-to-br ${colors[color]} p-6 transition-all duration-300 cursor-pointer
                ${isActive ? 'ring-2 ring-white/20 shadow-xl scale-105 z-10' : 'hover:shadow-lg hover:shadow-blue-900/10 hover:-translate-y-1 opacity-70 hover:opacity-100'}
            `}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-semibold text-[var(--text-secondary)]">{title}</p>
                    <h3 className="mt-2 text-3xl font-black text-[var(--text-primary)] tracking-tight">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${iconColors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
                {change !== undefined && change !== null && (
                    <>
                        {Number(change) > 0 ? (
                            <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded-full">
                                <ArrowUp className="w-3 h-3" />
                                {Number(change).toFixed(1)}%
                            </div>
                        ) : Number(change) < 0 ? (
                            <div className="flex items-center gap-1 text-rose-400 text-xs font-bold bg-rose-400/10 px-2 py-1 rounded-full">
                                <ArrowDown className="w-3 h-3" />
                                {Math.abs(Number(change)).toFixed(1)}%
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-slate-400 text-xs font-bold bg-slate-400/10 px-2 py-1 rounded-full">
                                <Minus className="w-3 h-3" />
                                0%
                            </div>
                        )}
                    </>
                )}
                <span className="text-xs text-slate-500">{subtitle || "vs. last month"}</span>
            </div>

            {/* Decorator */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl" />
        </div>
    )
}
