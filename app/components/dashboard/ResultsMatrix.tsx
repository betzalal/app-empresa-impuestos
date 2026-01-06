'use client'

interface MonthlyData {
    month: number
    sales: number
    purchases: number
}

const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function ResultsMatrix({ data }: { data: MonthlyData[] }) {
    // Determine year from first data point or default current if empty
    // Better to pass year as prop, but implicit is fine for now
    const displayYear = data.length > 0 ? 'del Año' : ''

    return (
        <div className="glass-card p-6 h-full">
            <h3 className="text-lg font-bold text-orange-500 mb-6">Resumen Mensual {displayYear}</h3>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-medium">
                        <tr>
                            <th className="px-4 py-3 rounded-l-lg">Mes</th>
                            <th className="px-4 py-3">Ventas</th>
                            <th className="px-4 py-3">Compras</th>
                            <th className="px-4 py-3 rounded-r-lg">Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {data.map((row) => (
                            <tr key={row.month} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{months[row.month - 1]}</td>
                                <td className="px-4 py-3 text-[var(--text-secondary)]">{row.sales.toLocaleString()}</td>
                                <td className="px-4 py-3 text-[var(--text-secondary)]">{row.purchases.toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex-1 h-1.5 bg-gray-700/30 rounded-full max-w-[80px]">
                                            <div
                                                className={`h-1.5 rounded-full ${row.sales > row.purchases ? 'bg-green-500' : 'bg-red-500'}`}
                                                style={{ width: `${Math.min((Math.abs(row.sales - row.purchases) / (row.sales || 1)) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                                    No hay datos registrados este año.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
