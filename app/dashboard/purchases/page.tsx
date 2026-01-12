'use client'

import { addPurchase, bulkAddPurchases, deletePurchase, getPurchases } from '@/app/actions/purchases'
import { useEffect, useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useTableList } from '@/app/hooks/useTableList'
import { Search, ChevronUp, ChevronDown, Filter } from 'lucide-react'

interface Purchase {
    id: string
    date: Date
    amount: number
    description: string
    nitProvider?: string | null
    importBaseCF: number
}

export default function PurchasesPage() {
    const [purchases, setPurchases] = useState<Purchase[]>([])
    const {
        filteredData,
        searchTerm,
        setSearchTerm,
        sortConfig,
        requestSort,
        filterDate,
        setFilterDate,
        availableMonths
    } = useTableList(purchases)

    const [loading, setLoading] = useState(true)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)

    async function fetchPurchases() {
        const res = await getPurchases()
        if (res.success) {
            setPurchases(res.data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchPurchases()
    }, [])

    async function handleSubmit(formData: FormData) {
        const res = await addPurchase(formData)
        if (res.success) {
            alert(res.message)
            fetchPurchases()
        } else {
            alert(res.message)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de eliminar esta compra?')) return
        const res = await deletePurchase(id)
        if (res.success) {
            fetchPurchases()
        } else {
            alert(res.message)
        }
    }

    function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const reader = new FileReader()
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]

                const payload: any[] = []

                for (let i = 1; i < data.length; i++) {
                    const row = data[i]
                    if (!row || row.length === 0) continue

                    // User Mapping:
                    // B (1) = NIT Provider
                    // C (2) = Provider Name
                    // E (4) = Invoice Number
                    // G (6) = Date
                    // H (7) = Total Amount
                    // T (19) = Credit Fiscal (13%) -> We can derive Base or read S (18)

                    const rawDate = row[6] // Col G
                    const nit = row[1] // Col B
                    const providerName = row[2] // Col C
                    const invoiceNum = row[4] // Col E

                    const totalAmount = row[7] // Col H
                    const taxCredit = row[19] // Col T

                    // Base CF: Try to deduce or use taxCredit/0.13
                    // If T is present, Base = T / 0.13
                    let baseCF = 0
                    if (taxCredit) {
                        baseCF = Number(taxCredit) / 0.13
                    } else if (row[18]) { // Col S if T is missing
                        baseCF = Number(row[18])
                    } else {
                        baseCF = Number(totalAmount || 0) // Fallback
                    }

                    if (!totalAmount && !invoiceNum) continue;

                    let dateObj = new Date()
                    if (typeof rawDate === 'number') {
                        // Excel date (days since 1900-01-01)
                        dateObj = new Date(Math.round((rawDate - 25569) * 86400 * 1000))
                    } else if (typeof rawDate === 'string') {
                        // Try parsing dd/mm/yyyy
                        const parts = rawDate.split(/[-/]/)
                        if (parts.length === 3) {
                            const day = parseInt(parts[0], 10)
                            const month = parseInt(parts[1], 10) - 1
                            const year = parseInt(parts[2], 10)
                            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                                dateObj = new Date(year, month, day)
                            } else {
                                dateObj = new Date(rawDate)
                            }
                        } else {
                            dateObj = new Date(rawDate)
                        }
                    } else if (rawDate instanceof Date) {
                        dateObj = rawDate
                    }

                    if (isNaN(dateObj.getTime())) {
                        dateObj = new Date() // Fallback
                    }

                    // Format description
                    const description = `F${invoiceNum || '?'} - ${providerName || 'Sin Nombre'}`

                    payload.push({
                        date: dateObj.toISOString(),
                        amount: String(totalAmount || 0),
                        description: description,
                        nitProvider: String(nit || ''),
                        importBaseCF: String(baseCF)
                    })
                }

                if (payload.length > 0) {
                    const res = await bulkAddPurchases(JSON.stringify(payload))
                    alert(res.message)
                    fetchPurchases()
                } else {
                    alert('No se encontraron filas válidas en el Excel.')
                }
            } catch (err) {
                console.error(err)
                const msg = err instanceof Error ? err.message : String(err)
                alert('Error al procesar el archivo Excel: ' + msg)
            } finally {
                setUploading(false)
                if (fileInputRef.current) fileInputRef.current.value = ''
            }
        }
        reader.onerror = () => {
            alert('Error al leer el archivo.')
            setUploading(false)
        }
        reader.readAsBinaryString(file)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Ingreso de Compras</h1>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-[var(--text-secondary)]">
                        {uploading ? 'Subiendo...' : 'Subir Excel:'}
                    </span>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600/10 file:text-indigo-600 hover:file:bg-indigo-600/20 disabled:opacity-50"
                    />
                </div>
            </div>

            <div className="glass-card p-6">
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">Registro Manual</h3>
                <form action={handleSubmit} className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    {/* ... existing form ... */}
                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">Fecha</label>
                        <input type="date" name="date" required className="mt-1 input-field" />
                    </div>
                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">NIT Proveedor</label>
                        <input type="text" name="nitProvider" required className="mt-1 input-field" />
                    </div>
                    <div className="sm:col-span-4">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">Descripción / Razón Social</label>
                        <input type="text" name="description" required className="mt-1 input-field" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">Monto Total</label>
                        <input type="number" name="amount" step="0.01" required className="mt-1 input-field" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">Importe Base CF (Col S)</label>
                        <input type="number" name="importBaseCF" step="0.01" className="mt-1 input-field" placeholder="Opcional" />
                    </div>
                    <div className="sm:col-span-6">
                        <button type="submit" className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Registrar Compra
                        </button>
                    </div>
                </form>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-lg leading-6 font-medium text-[var(--text-primary)]">Historial de Compras</h3>

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        {/* Search */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {/* Total Display (Dynamic) */}
                        {searchTerm && (
                            <div className="bg-emerald-600/10 border border-emerald-600/20 text-emerald-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-sm animate-in fade-in zoom-in duration-300">
                                <span className="mr-2">Total Filtrado:</span>
                                {filteredData.reduce((sum, item) => sum + item.amount, 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                            </div>
                        )}

                        {/* Date Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-[var(--text-secondary)]" />
                            <select
                                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg text-sm py-2 pl-2 pr-8 focus:ring-indigo-500 focus:border-indigo-500"
                                value={filterDate === 'ALL' ? 'ALL' : `${filterDate.month}-${filterDate.year}`}
                                onChange={(e) => {
                                    if (e.target.value === 'ALL') setFilterDate('ALL')
                                    else {
                                        const [m, y] = e.target.value.split('-').map(Number)
                                        setFilterDate({ month: m, year: y })
                                    }
                                }}
                            >
                                <option value="ALL">Todo el historial</option>
                                {availableMonths.map((d) => (
                                    <option key={`${d.month}-${d.year}`} value={`${d.month}-${d.year}`}>
                                        {new Date(d.year, d.month - 1).toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="border-t border-[var(--border-color)]">
                    <table className="min-w-full divide-y divide-[var(--border-color)]">
                        <thead className="bg-[var(--text-primary)]/5">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-black text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:bg-[var(--text-primary)]/10"
                                    onClick={() => requestSort('date')}
                                >
                                    <div className="flex items-center gap-1">
                                        Fecha
                                        {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-black text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:bg-[var(--text-primary)]/10"
                                    onClick={() => requestSort('nitProvider')}
                                >
                                    <div className="flex items-center gap-1">
                                        NIT
                                        {sortConfig?.key === 'nitProvider' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-black text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:bg-[var(--text-primary)]/10"
                                    onClick={() => requestSort('description')}
                                >
                                    <div className="flex items-center gap-1">
                                        Descripción
                                        {sortConfig?.key === 'description' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-black text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:bg-[var(--text-primary)]/10"
                                    onClick={() => requestSort('amount')}
                                >
                                    <div className="flex items-center gap-1">
                                        Monto
                                        {sortConfig?.key === 'amount' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-black text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:bg-[var(--text-primary)]/10"
                                    onClick={() => requestSort('importBaseCF')}
                                >
                                    <div className="flex items-center gap-1">
                                        Base CF
                                        {sortConfig?.key === 'importBaseCF' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-black text-[var(--text-secondary)] uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-[var(--border-color)]">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center">Cargando...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No se encontraron resultados</td></tr>
                            ) : filteredData.map((purchase) => (
                                <tr key={purchase.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">{new Date(purchase.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)] font-semibold">{purchase.nitProvider || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">{purchase.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-[var(--text-primary)]">{purchase.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">{purchase.importBaseCF.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleDelete(purchase.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
