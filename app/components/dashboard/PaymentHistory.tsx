'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, Clock } from 'lucide-react'

// Mock Data Type
interface Payment {
    month: string
    amount: number
    status: string
}

export function PaymentHistory({ payments }: { payments: Payment[] }) {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Historial de Pagos</h3>
            <div className="space-y-3">
                {payments.map((p, idx) => (
                    <div key={idx} className="border border-[var(--border-color)] rounded-xl overflow-hidden">
                        <button
                            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                            className="w-full flex items-center justify-between p-4 bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-full ${p.status === 'Pagado' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                    {p.status === 'Pagado' ? <CheckCircle size={16} /> : <Clock size={16} />}
                                </div>
                                <span className="font-semibold text-[var(--text-primary)]">{p.month}</span>
                            </div>
                            {openIndex === idx ? <ChevronUp size={16} className="text-[var(--text-secondary)]" /> : <ChevronDown size={16} className="text-[var(--text-secondary)]" />}
                        </button>

                        {openIndex === idx && (
                            <div className="p-4 bg-[var(--bg-primary)] border-t border-[var(--border-color)]">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[var(--text-secondary)]">Monto Total:</span>
                                    <span className="font-bold text-[var(--text-primary)]">{p.amount.toFixed(2)} Bs</span>
                                </div>
                                <div className="flex justify-between items-center text-sm mt-2">
                                    <span className="text-[var(--text-secondary)]">Estado:</span>
                                    <span className={`font-medium ${p.status === 'Pagado' ? 'text-green-500' : 'text-yellow-500'}`}>{p.status}</span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
