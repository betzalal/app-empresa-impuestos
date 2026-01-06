'use client'

interface Purchase {
    id: string
    description: string
    amount: number
    percentage: string
}

export function TopPurchases({ purchases }: { purchases: Purchase[] }) {
    return (
        <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Mayores Gastos (12 Meses)</h3>
            <div className="space-y-5">
                {purchases.length === 0 ? (
                    <p className="text-gray-400 text-sm">No hay registros de compras.</p>
                ) : (
                    purchases.map((p) => (
                        <div key={p.id}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-[var(--text-secondary)] truncate w-32">{p.description}</span>
                                <span className="font-bold text-[var(--text-primary)]">{p.amount.toLocaleString()} Bs</span>
                            </div>
                            <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2">
                                <div
                                    className="bg-blaze-orange h-2 rounded-full"
                                    style={{ width: `${p.percentage}%` }}
                                ></div>
                            </div>
                            <span className="text-xs text-[var(--text-secondary)] mt-1 block">{p.percentage}% del total</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
