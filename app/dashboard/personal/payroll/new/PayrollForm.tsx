'use client'

import { useState, useEffect } from 'react'
import { createPayroll } from '@/app/actions/hr'
import { User, Calendar, Calculator, Building2, Heart, Briefcase } from 'lucide-react'

interface Employee {
    id: string
    firstName: string
    lastName: string
    jobTitle: string
}

interface PayrollData {
    employeeId: string
    month: number
    year: number
    baseSalary: number
    bonuses: number
    socialSecurity: number
    healthInsurance: number
    laborMinistry: number
    otherDeductions: number
    otherReason: string | null
}

interface PayrollFormProps {
    employees: Employee[]
    initialData?: PayrollData | null
}

export default function PayrollForm({ employees, initialData }: PayrollFormProps) {
    // Smart Defaults: If copying, increment month. If Dec, increment year + Jan.
    const defaultMonth = initialData
        ? (initialData.month === 12 ? 1 : initialData.month + 1)
        : new Date().getMonth() + 1

    const defaultYear = initialData
        ? (initialData.month === 12 ? initialData.year + 1 : initialData.year)
        : new Date().getFullYear()

    const [baseSalary, setBaseSalary] = useState<number>(initialData?.baseSalary || 0)
    const [bonuses, setBonuses] = useState<number>(initialData?.bonuses || 0)
    const [socialSecurityDetails, setSocialSecurityDetails] = useState({
        percent: initialData ? (initialData.socialSecurity > 1 ? initialData.socialSecurity : initialData.socialSecurity * 100) : 19,
        amount: 0
    })
    const [healthInsuranceDetails, setHealthInsuranceDetails] = useState({
        percent: initialData ? (initialData.healthInsurance > 1 ? initialData.healthInsurance : initialData.healthInsurance * 100) : 10,
        amount: 0
    })
    const [laborMinistry, setLaborMinistry] = useState<number>(initialData?.laborMinistry || 70)
    const [otherDeductions, setOtherDeductions] = useState<number>(initialData?.otherDeductions || 0)

    // Derived calculations
    const socialSecurityAmount = baseSalary * (socialSecurityDetails.percent / 100)
    const healthInsuranceAmount = baseSalary * (healthInsuranceDetails.percent / 100)

    // Total Company Cost
    const totalMonthlyCost = baseSalary + bonuses + socialSecurityAmount + healthInsuranceAmount + laborMinistry + otherDeductions

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
                <form action={createPayroll} className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 space-y-8 shadow-sm">

                    {/* Employee & Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 col-span-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <User className="w-4 h-4 text-orange-500" /> Employee *
                            </label>
                            <select
                                name="employeeId"
                                required
                                defaultValue={initialData?.employeeId || ""}
                                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                            >
                                <option value="">Select an employee...</option>
                                {employees.map(e => (
                                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} - {e.jobTitle}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" /> Month
                            </label>
                            <select name="month" defaultValue={defaultMonth} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('es-ES', { month: 'long' })}</option>
                                ))}
                                <option value="13" className="font-bold text-orange-500">★ Aguinaldo (Payment 13)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" /> Year
                            </label>
                            <input name="year" type="number" defaultValue={defaultYear} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
                        </div>
                    </div>

                    {/* Salary Info */}
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-emerald-500" /> Salary Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Base Salary (Bs) *</label>
                                <input
                                    name="baseSalary"
                                    required
                                    type="number"
                                    step="0.01"
                                    value={baseSalary || ''}
                                    onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)}
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Bonuses (Bs)</label>
                                <input
                                    name="bonuses"
                                    type="number"
                                    step="0.01"
                                    value={bonuses || ''}
                                    onChange={(e) => setBonuses(parseFloat(e.target.value) || 0)}
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Configurable Charges */}
                    <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-blue-500" /> Contributions Config
                        </h3>
                        <p className="text-sm text-slate-500">Customize the percentage rates for this payroll entry.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Social Security %</label>
                                <div className="relative">
                                    <input
                                        name="socialSecurity"
                                        type="number"
                                        step="0.01"
                                        value={socialSecurityDetails.percent}
                                        onChange={(e) => setSocialSecurityDetails({ ...socialSecurityDetails, percent: parseFloat(e.target.value) || 0 })}
                                        className="w-full p-2 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-right font-mono"
                                    />
                                    <span className="absolute right-3 top-2 text-slate-400 font-mono">%</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Health Ins. %</label>
                                <div className="relative">
                                    <input
                                        name="healthInsurance"
                                        type="number"
                                        step="0.01"
                                        value={healthInsuranceDetails.percent}
                                        onChange={(e) => setHealthInsuranceDetails({ ...healthInsuranceDetails, percent: parseFloat(e.target.value) || 0 })}
                                        className="w-full p-2 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-right font-mono"
                                    />
                                    <span className="absolute right-3 top-2 text-slate-400 font-mono">%</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Labor Ministry</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400 font-mono">Bs</span>
                                    <input
                                        name="laborMinistry"
                                        type="number"
                                        step="0.01"
                                        value={laborMinistry}
                                        onChange={(e) => setLaborMinistry(parseFloat(e.target.value) || 0)}
                                        className="w-full p-2 pl-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-right font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Other Deductions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Other Additions (Bs)</label>
                                <input
                                    name="otherDeductions"
                                    type="number"
                                    step="0.01"
                                    value={otherDeductions}
                                    onChange={(e) => setOtherDeductions(parseFloat(e.target.value) || 0)}
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                                <p className="text-xs text-slate-500">Misc expenses added to company cost</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Reason</label>
                                <input
                                    name="otherReason"
                                    type="text"
                                    defaultValue={initialData?.otherReason || ''}
                                    placeholder="e.g. Equipment"
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6">
                        <button type="submit" className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 font-bold shadow-lg shadow-orange-500/20 transform transition hover:scale-105">
                            Generate Payroll Entry
                        </button>
                    </div>
                </form>
            </div>

            {/* Breakdown Card */}
            <div className="lg:col-span-1">
                <div className="sticky top-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="p-6 bg-slate-900 text-white">
                        <h2 className="text-xl font-bold">Current Month Breakdown</h2>
                        <p className="text-slate-400 text-sm mt-1">Estimated company cost</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Base Salary */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Base Salary</span>
                                <span className="text-sm font-mono text-slate-900 dark:text-white">Bs {baseSalary.toFixed(2)}</span>
                            </div>
                            {bonuses > 0 && (
                                <div className="flex justify-between items-baseline">
                                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Bonuses</span>
                                    <span className="text-sm font-mono text-emerald-600 dark:text-emerald-400">+ Bs {bonuses.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                        </div>


                        {/* Contributions */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Social Security</p>
                                    <p className="text-xs text-slate-500">({socialSecurityDetails.percent}%)</p>
                                </div>
                                <span className="font-mono text-slate-900 dark:text-white">Bs {socialSecurityAmount.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Health Insurance</p>
                                    <p className="text-xs text-slate-500">({healthInsuranceDetails.percent}%)</p>
                                </div>
                                <span className="font-mono text-slate-900 dark:text-white">Bs {healthInsuranceAmount.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Labor Ministry</p>
                                <span className="font-mono text-slate-900 dark:text-white">Bs {laborMinistry.toFixed(2)}</span>
                            </div>

                            {otherDeductions > 0 && (
                                <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                                    <p className="text-sm font-medium">Other</p>
                                    <span className="font-mono">+ Bs {otherDeductions.toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        {/* Total */}
                        <div className="pt-6 border-t-2 border-dashed border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-end">
                                <span className="text-lg font-bold text-slate-900 dark:text-white">Total Monthly Cost</span>
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    Bs {totalMonthlyCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
