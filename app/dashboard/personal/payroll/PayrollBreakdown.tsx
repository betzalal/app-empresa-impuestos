'use client'

import { useState } from 'react'
import { Info, X } from 'lucide-react'

// Using a simple specialized Modal/Popover to avoid complex shadcn dependencies if not present,
// or we could use standard HTML dialog if preferred. 
// For this stack, a custom floating div with state is safest and fastest to implement strictly as requested.

interface PayrollBreakdownProps {
    baseSalary: number
    bonuses: number
    socialSecurity: number
    healthInsurance: number
    laborMinistry: number
    otherDeductions: number
    otherReason: string | null
    totalContributions: number
}

export default function PayrollBreakdown({
    baseSalary,
    bonuses,
    socialSecurity, // stored as decimal e.g. 0.19 or 19 depending on legacy, handled by parent/caller usually, but we receive raw
    healthInsurance,
    laborMinistry,
    otherDeductions,
    otherReason,
    totalContributions
}: PayrollBreakdownProps) {
    const [isOpen, setIsOpen] = useState(false)

    // Normalize percentages for display
    const ssPercent = socialSecurity > 1 ? socialSecurity : socialSecurity * 100
    const hiPercent = healthInsurance > 1 ? healthInsurance : healthInsurance * 100

    const ssAmount = baseSalary * (ssPercent / 100)
    const hiAmount = baseSalary * (hiPercent / 100)

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group flex flex-col items-end text-right hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 -mr-1.5 rounded-lg transition-colors cursor-pointer"
            >
                <div className="font-mono text-slate-700 dark:text-slate-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2 decoration-dotted">
                    Bs {totalContributions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-orange-500">
                    Social & Labor <Info className="w-3 h-3" />
                </div>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Popover Content */}
                    <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Contribution Details</h4>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <div>
                                    <span className="text-slate-600 dark:text-slate-400">Social Security</span>
                                    <span className="text-xs text-slate-400 ml-1">({ssPercent}%)</span>
                                </div>
                                <span className="font-mono text-slate-900 dark:text-white">Bs {ssAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <div>
                                    <span className="text-slate-600 dark:text-slate-400">Health Insurance</span>
                                    <span className="text-xs text-slate-400 ml-1">({hiPercent}%)</span>
                                </div>
                                <span className="font-mono text-slate-900 dark:text-white">Bs {hiAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Labor Ministry</span>
                                <span className="font-mono text-slate-900 dark:text-white">Bs {laborMinistry.toFixed(2)}</span>
                            </div>
                            {otherDeductions > 0 && (
                                <div className="flex justify-between text-sm pt-2 border-t border-dashed border-slate-100 dark:border-slate-800">
                                    <div>
                                        <span className="text-amber-600 dark:text-amber-500">Other <span className="text-xs text-slate-400">({otherReason})</span></span>
                                    </div>
                                    <span className="font-mono text-amber-600 dark:text-amber-500">+ Bs {otherDeductions.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-bold pt-3 border-t border-slate-100 dark:border-slate-700">
                                <span className="text-slate-900 dark:text-white">Total Contributions</span>
                                <span className="font-mono text-indigo-600 dark:text-indigo-400">Bs {totalContributions.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
