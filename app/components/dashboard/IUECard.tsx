'use client'

import { TrendingUp } from 'lucide-react'

interface IUEData {
    year: number
    netProfit: number
    iue: number
}

export function IUECard({ data }: { data: IUEData }) {
    return (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-white font-bold text-sm drop-shadow-sm">Provisión IUE {data.year}</h3>
                        <p className="text-xs text-white/80 font-medium mt-1">Acumulado anual</p>
                    </div>
                    <div className="p-2 bg-white/20 rounded-lg">
                        <TrendingUp size={20} className="text-white" />
                    </div>
                </div>

                <div className="font-bold text-3xl tracking-tight text-white drop-shadow-md">
                    {data.iue.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                </div>

                <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-sm">
                    <span className="text-white/90 font-medium">Utilidad Neta:</span>
                    <span className="font-bold text-white drop-shadow-sm">{data.netProfit.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</span>
                </div>
            </div>
        </div>
    )
}
