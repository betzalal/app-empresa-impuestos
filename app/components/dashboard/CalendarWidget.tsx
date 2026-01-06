'use client'

import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react'
import { getTaxEvents, TaxEvent } from '@/lib/tax-calendar'

export function CalendarWidget({ nit }: { nit?: string }) {
    const events = getTaxEvents(nit)

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Calendario Fiscal</h3>
                    <p className="text-xs text-gray-500">
                        {nit ? `NIT: ...${nit.slice(-3)}` : 'NIT no configurado'}
                    </p>
                </div>
                <div className="p-2 bg-blaze-orange/10 rounded-lg text-blaze-orange">
                    <CalendarIcon size={20} />
                </div>
            </div>

            {/* Event List */}
            <div className="space-y-4 relative z-10">
                {events.slice(0, 3).map((event, idx) => (
                    <div key={idx} className="flex gap-4 items-start group">
                        {/* Date Box */}
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-xl flex flex-col items-center justify-center border border-gray-100 group-hover:border-blaze-orange/30 transition-colors">
                            <span className="text-xs text-gray-500 uppercase">{event.date.toLocaleDateString('es-BO', { month: 'short' })}</span>
                            <span className="text-lg font-bold text-gray-900">{event.date.getDate()}</span>
                        </div>

                        {/* Info */}
                        <div>
                            <h4 className="font-semibold text-gray-800 text-sm group-hover:text-blaze-orange transition-colors">{event.title}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>

                            {/* Chip type */}
                            <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium 
                                ${event.type === 'annual' ? 'bg-purple-100 text-purple-600' :
                                    event.type === 'special' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-50 text-blue-600'}`}>
                                {event.type === 'annual' ? 'Anual' : event.type === 'special' ? 'Especial' : 'Mensual'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Fallback / Prompt if no NIT (Optional logic) */}
            {!nit && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-xl flex items-start text-xs text-yellow-700">
                    <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                    <span>Configura tu NIT en ajustes para ver tus fechas exactas. Mostrando fechas genéricas (Term. 0).</span>
                </div>
            )}
        </div>
    )
}
