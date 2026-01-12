'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Calendar, CheckCircle, ChevronDown, ChevronUp, FileText,
    Upload, X, Trash2, Plus, Loader2, DollarSign, Image as ImageIcon
} from 'lucide-react'
import { upsertExpense, deleteExpense, uploadExpenseReceipt } from '@/app/actions/expenses'

interface Expense {
    id: string
    category: string
    amount: number
    description: string | null
    month: number
    year: number
    proofUrl: string | null
    createdAt: Date
}

interface StoreManagerProps {
    store: {
        id: string
        name: string
    }
    expenses: Expense[]
}

const CATEGORIES = [
    "Alquileres",
    "Servicios Básicos",
    "Mantenimiento",
    "Publicidad y Marketing",
    "Seguros"
]

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

const YEARS = [2024, 2025, 2026, 2027]

export function StoreManager({ store, expenses }: StoreManagerProps) {
    const router = useRouter()
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1 // 1-indexed for logic

    const [selectedYear, setSelectedYear] = useState(currentYear)
    const [selectedMonth, setSelectedMonth] = useState(currentMonth)

    // Derived state
    const filteredExpenses = expenses.filter(e => e.year === selectedYear)
    const monthExpenses = filteredExpenses.filter(e => e.month === selectedMonth)

    // Calculate totals
    const totalYear = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0)
    const totalMonth = monthExpenses.reduce((acc, curr) => acc + curr.amount, 0)

    // Form State (per category or global? per category makes sense for the accordion)
    // We'll manage an "Adding/Editing" state
    const [openCategory, setOpenCategory] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        file: null as File | null
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const toggleCategory = (category: string) => {
        if (openCategory === category) {
            setOpenCategory(null)
        } else {
            setOpenCategory(category)
            setFormData({ amount: '', description: '', file: null })
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, file: e.target.files![0] }))
        }
    }

    const handleSubmit = async (category: string) => {
        if (!formData.amount) return

        setIsSubmitting(true)
        try {
            let proofUrl = undefined

            // Upload file first if exists
            if (formData.file) {
                const uploadData = new FormData()
                uploadData.append('file', formData.file)
                uploadData.append('storeId', store.id)
                uploadData.append('year', selectedYear.toString())
                uploadData.append('month', selectedMonth.toString())

                const uploadRes = await uploadExpenseReceipt(uploadData)
                if (uploadRes.success) {
                    proofUrl = uploadRes.path
                } else {
                    alert('Error al subir comprobante')
                    setIsSubmitting(false)
                    return
                }
            }

            // Save Expense
            const res = await upsertExpense({
                storeId: store.id,
                category,
                amount: parseFloat(formData.amount),
                description: formData.description,
                month: selectedMonth,
                year: selectedYear,
                proofUrl
            })

            if (res.success) {
                setFormData({ amount: '', description: '', file: null })
                // Maybe close accordion? Or keep open? Keep open to see result.
                router.refresh()
            } else {
                alert('Error al guardar gasto')
            }
        } catch (error) {
            console.error(error)
            alert('Error inesperado')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar gasto?')) return
        await deleteExpense(id, store.id)
        router.refresh()
    }

    return (
        <div className="space-y-6">

            <div className="flex flex-col xl:flex-row gap-4 w-full justify-between">
                {/* Year Selector */}
                <div className="min-w-[100px]">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-slate-800 text-white rounded-lg px-3 py-2 border border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold w-full"
                    >
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                {/* Desktop Month Selector (Grid/Flex) */}
                <div className="flex flex-wrap gap-2 justify-center xl:justify-end flex-1">
                    {MONTHS.map((m, idx) => {
                        const monthNum = idx + 1
                        const isActive = selectedMonth === monthNum
                        return (
                            <button
                                key={m}
                                onClick={() => setSelectedMonth(monthNum)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 transform scale-105'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                {m}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                    <p className="text-xs text-slate-400">Total Anual ({selectedYear})</p>
                    <p className="text-2xl font-bold text-white flex items-center gap-1">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        {totalYear.toLocaleString('es-BO')}
                    </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                    <p className="text-xs text-slate-400">Total {MONTHS[selectedMonth - 1]}</p>
                    <p className="text-2xl font-bold text-white flex items-center gap-1">
                        <DollarSign className="w-5 h-5 text-blue-500" />
                        {totalMonth.toLocaleString('es-BO')}
                    </p>
                </div>
            </div>

            {/* Categories Accordion */}
            <div className="space-y-3">
                {CATEGORIES.map((category) => {
                    const isOpen = openCategory === category
                    const catExpenses = monthExpenses.filter(e => e.category === category)
                    const catTotal = catExpenses.reduce((acc, curr) => acc + curr.amount, 0)

                    return (
                        <div key={category} className={`border rounded-xl transition-all duration-300 ${isOpen ? 'bg-slate-800/30 border-blue-500/30 shadow-lg' : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'}`}>

                            <button
                                onClick={() => toggleCategory(category)}
                                className="w-full flex items-center justify-between p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-10 rounded-full transition-colors ${isOpen ? 'bg-blue-500' : 'bg-slate-700'}`} />
                                    <div className="text-left">
                                        <h3 className={`font-semibold transition-colors ${isOpen ? 'text-white' : 'text-slate-300'}`}>{category}</h3>
                                        <p className="text-xs text-slate-500">
                                            {catExpenses.length} registro(s) this month
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {catTotal > 0 && (
                                        <span className="text-sm font-mono font-medium text-slate-300 bg-slate-900/50 px-3 py-1 rounded-md">
                                            Bs {catTotal.toLocaleString()}
                                        </span>
                                    )}
                                    {isOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                                </div>
                            </button>

                            {/* Content */}
                            {isOpen && (
                                <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                                    <div className="border-t border-slate-700/50 my-2"></div>

                                    {/* Existing Items List */}
                                    {catExpenses.length > 0 && (
                                        <div className="space-y-2 mb-4">
                                            {catExpenses.map(expense => (
                                                <div key={expense.id} className="flex items-center justify-between bg-black/20 p-3 rounded-lg group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-sm">
                                                            <p className="font-bold text-white">Bs {expense.amount}</p>
                                                            {expense.description && <p className="text-xs text-slate-400">{expense.description}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {expense.proofUrl ? (
                                                            <a
                                                                href={expense.proofUrl}
                                                                target="_blank"
                                                                className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                                                                title="Ver comprobante"
                                                            >
                                                                <FileText className="w-4 h-4" />
                                                            </a>
                                                        ) : <span className="text-xs text-slate-600 italic">Sin archivo</span>}

                                                        <button
                                                            onClick={() => handleDelete(expense.id)}
                                                            className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add New Form */}
                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Agregar Nuevo Gasto</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">

                                            <div className="md:col-span-3">
                                                <label className="text-xs text-slate-400 mb-1 block">Monto (Bs)</label>
                                                <input
                                                    type="number"
                                                    value={formData.amount}
                                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                    placeholder="0.00"
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>

                                            <div className="md:col-span-5">
                                                <label className="text-xs text-slate-400 mb-1 block">Descripción / Detalle</label>
                                                <input
                                                    type="text"
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    placeholder="Ej. Pago alquiler oficina central"
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>

                                            <div className="md:col-span-3">
                                                <label className="block w-full cursor-pointer group">
                                                    <span className="text-xs text-slate-400 mb-1 block group-hover:text-white transition-colors">Comprobante</span>
                                                    <div className={`flex items-center justify-center gap-2 w-full px-3 py-2 border border-dashed rounded-lg bg-slate-950 transition-colors ${formData.file ? 'border-green-500 text-green-500' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'}`}>
                                                        {formData.file ? <CheckCircle className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                                                        <span className="text-xs truncate max-w-[100px]">{formData.file ? 'Archivo listo' : 'Subir archivo'}</span>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={handleFileChange}
                                                        accept="image/*,application/pdf"
                                                    />
                                                </label>
                                            </div>

                                            <div className="md:col-span-1">
                                                <button
                                                    onClick={() => handleSubmit(category)}
                                                    disabled={isSubmitting || !formData.amount}
                                                    className="w-full h-[38px] flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    title="Guardar"
                                                >
                                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                                                </button>
                                            </div>

                                            {/* Copy from previous month option */}
                                            <div className="md:col-span-12 flex justify-end">
                                                <button
                                                    onClick={() => {
                                                        // Calculate previous month
                                                        let prevMonth = selectedMonth - 1
                                                        let prevYear = selectedYear
                                                        if (prevMonth === 0) {
                                                            prevMonth = 12
                                                            prevYear = selectedYear - 1
                                                        }

                                                        // Find expense
                                                        const prevExpense = expenses.find(e =>
                                                            e.category === category &&
                                                            e.month === prevMonth &&
                                                            e.year === prevYear
                                                        )

                                                        if (prevExpense) {
                                                            // Smart Description Update: Replace prev month name with current month name
                                                            let newDesc = prevExpense.description || ''
                                                            const prevMonthName = MONTHS[prevMonth - 1].toLowerCase()
                                                            const currMonthName = MONTHS[selectedMonth - 1].toLowerCase()

                                                            // Simple case-insensitive replace
                                                            if (newDesc.toLowerCase().includes(prevMonthName)) {
                                                                const regex = new RegExp(prevMonthName, 'gi')
                                                                newDesc = newDesc.replace(regex, currMonthName)
                                                            }

                                                            setFormData({
                                                                amount: prevExpense.amount.toString(),
                                                                description: newDesc,
                                                                file: null
                                                            })
                                                        } else {
                                                            alert(`No se encontró registro para ${MONTHS[prevMonth - 1]}`)
                                                        }
                                                    }}
                                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2"
                                                >
                                                    <FileText className="w-3 h-3" />
                                                    Copiar del mes anterior
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
            {/* Yearly Summary Table */}
            <div className="mt-8 bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        Resumen Anual - Gestión {selectedYear}
                    </h3>
                    <div className="text-sm text-slate-400">
                        Total: <span className="text-white font-bold ml-1">Bs {totalYear.toLocaleString('es-BO')}</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700 text-xs text-slate-400 uppercase tracking-wider">
                                <th className="p-3">Mes</th>
                                <th className="p-3">Categoría</th>
                                <th className="p-3">Descripción</th>
                                <th className="p-3 text-right">Monto</th>
                                <th className="p-3 text-center">Comprobante</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-800">
                            {filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500 italic">
                                        No hay gastos registrados para el año {selectedYear}
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses
                                    .sort((a, b) => b.month - a.month || b.createdAt.getTime() - a.createdAt.getTime())
                                    .map((expense) => (
                                        <tr key={expense.id} className="group hover:bg-slate-800/30 transition-colors">
                                            <td className="p-3 text-slate-300 font-medium">
                                                {MONTHS[expense.month - 1]}
                                            </td>
                                            <td className="p-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-800/50">
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td className="p-3 text-slate-400 max-w-[200px] truncate" title={expense.description || ''}>
                                                {expense.description || '-'}
                                            </td>
                                            <td className="p-3 text-right font-bold text-slate-200">
                                                Bs {expense.amount.toLocaleString('es-BO')}
                                            </td>
                                            <td className="p-3 flex justify-center">
                                                {expense.proofUrl ? (
                                                    <a
                                                        href={expense.proofUrl}
                                                        target="_blank"
                                                        className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                                                        title="Ver comprobante"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-700">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
