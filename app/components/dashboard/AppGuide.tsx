'use client'

import { useState } from 'react'
import { BookOpen, Check, X } from 'lucide-react'

export function AppGuide() {
    const [isOpen, setIsOpen] = useState(false)

    const steps = [
        { title: 'Dashboard', desc: 'Vista general de tus impuestos, saldos en vivo y pagos recientes.' },
        { title: 'Ventas y Compras', desc: 'Registra tus facturas diariamente. El sistema calculará tu IVA e IT automáticamente.' },
        { title: 'Resultados', desc: 'Genera tu liquidación mensual (Form 200/400) y cierra el mes para guardar saldos.' },
        { title: 'Calendario', desc: 'Revisa tus fechas de vencimiento según tu NIT para evitar multas.' },
        { title: 'IUE', desc: 'Monitorea tu provisión anual del 25% sobre la utilidad neta.' }
    ]

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
            >
                Ver Guía de Uso
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-gradient-to-r from-blaze-orange to-blaze-blue p-6 text-white flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <BookOpen size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Guía Rápida</h3>
                                    <p className="text-white/80 text-sm">Sawalife Taxes</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {steps.map((step, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{step.title}</h4>
                                        <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-gray-50 text-right">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="bg-gray-900 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
