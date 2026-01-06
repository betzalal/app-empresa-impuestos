'use client'

import { addSale, deleteSale, getSales, bulkAddSales } from '@/app/actions/sales'
import { useEffect, useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useTableList } from '@/app/hooks/useTableList'
import { Search, ChevronUp, ChevronDown, Filter } from 'lucide-react'

interface Sale {
    id: string
    date: Date
    amount: number
    clientName: string
    itemDescription: string
    quantity: number
    paymentType: string
    paymentMethod: string
    buyerNit?: string | null // Match null from Prisma
}

export default function SalesPage() {
    const [sales, setSales] = useState<Sale[]>([])
    const {
        filteredData,
        searchTerm,
        setSearchTerm,
        sortConfig,
        requestSort,
        filterDate,
        setFilterDate,
        availableMonths
    } = useTableList(sales)

    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    async function fetchSales() {
        const res = await getSales()
        if (res.success) {
            setSales(res.data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchSales()
    }, [])

    async function handleSubmit(formData: FormData) {
        const res = await addSale(formData)
        if (res.success) {
            alert(res.message)
            fetchSales()
        } else {
            alert(res.message)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de eliminar esta venta?')) return

        const res = await deleteSale(id)
        if (res.success) {
            fetchSales()
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

                // User Sales Mapping coverage
                for (let i = 1; i < data.length; i++) {
                    const row = data[i]
                    if (!row || row.length === 0) continue

                    const rawDate = row[1] // Col B
                    const invoiceNum = row[2] // Col C
                    const nitClient = row[4] // Col E
                    const clientName = row[6] // Col G
                    const amount = row[7] // Col H
                    const status = row[20] // Col U

                    // Filter Logic: Skip if "anulada"
                    if (status && String(status).toLowerCase().includes('anulada')) {
                        continue
                    }

                    if (!amount && !invoiceNum) continue;

                    let dateObj = new Date()
                    if (typeof rawDate === 'number') {
                        dateObj = new Date(Math.round((rawDate - 25569) * 86400 * 1000))
                    } else if (typeof rawDate === 'string') {
                        // Try parsing dd/mm/yyyy or dd-mm-yyyy which are common in Bolivia
                        const parts = rawDate.split(/[-/]/)
                        if (parts.length === 3) {
                            // Assume dd/mm/yyyy
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

                    // Check for invalid date
                    if (isNaN(dateObj.getTime())) {
                        console.warn(`Invalid date found in row ${i + 1}:`, rawDate)
                        // Fallback to today or skip? Let's fallback to today to prevent crash, but log it.
                        dateObj = new Date()
                    }

                    payload.push({
                        date: dateObj.toISOString(),
                        amount: Number(amount || 0),
                        clientName: String(clientName || 'Sin Nombre'),
                        buyerNit: String(nitClient || ''),
                        itemDescription: `Factura ${invoiceNum || '?'}`,
                        quantity: 1,
                        paymentType: 'Contado',
                        paymentMethod: 'Efectivo'
                    })
                }

                if (payload.length > 0) {
                    const res = await bulkAddSales(JSON.stringify(payload))
                    alert(res.message)
                    fetchSales()
                } else {
                    alert('No se encontraron filas válidas.')
                }
            } catch (err) {
                console.error(err)
                const msg = err instanceof Error ? err.message : String(err)
                alert('Error al procesar Excel: ' + msg)
            } finally {
                setUploading(false)
                if (fileInputRef.current) fileInputRef.current.value = ''
            }
        }
        reader.readAsBinaryString(file)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Ingreso de Ventas</h1>
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
                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
                    />
                </div>
            </div>

            <div className="glass-card p-6">
                <form action={handleSubmit} className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    {/* ... existing form fields ... */}
                    {/* Re-using previous form fields for brevity but keeping structure */}
                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">Fecha</label>
                        <input type="date" name="date" required className="mt-1 input-field" />
                    </div>
                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">Cliente</label>
                        <input type="text" name="clientName" required className="mt-1 input-field" />
                    </div>
                    <div className="sm:col-span-3"> {/* Added NIT input */}
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">NIT/CI</label>
                        <input type="text" name="buyerNit" className="mt-1 input-field" />
                    </div>
                    <div className="sm:col-span-4">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">Item Vendido (Descripción)</label>
                        <input type="text" name="itemDescription" required className="mt-1 input-field" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">Cantidad</label>
                        <input type="number" name="quantity" required min="1" className="mt-1 input-field" />
                    </div>
                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">Monto (Bs)</label>
                        <input type="number" name="amount" step="0.01" required className="mt-1 input-field" />
                    </div>
                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">Tipo de Pago</label>
                        <select name="paymentType" className="mt-1 input-field">
                            <option>Contado</option>
                            <option>Crédito</option>
                        </select>
                    </div>
                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">Método de Pago</label>
                        <select name="paymentMethod" className="mt-1 input-field">
                            <option>Efectivo</option>
                            <option>QR</option>
                            <option>Transferencia</option>
                            <option>Cheque</option>
                        </select>
                    </div>
                    <div className="sm:col-span-6">
                        <button type="submit" className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Registrar Venta
                        </button>
                    </div>
                </form>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-lg leading-6 font-medium text-[var(--text-primary)]">Historial de Ventas</h3>

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
                            <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-sm animate-in fade-in zoom-in duration-300">
                                <span className="mr-2">Total Filtrado:</span>
                                {filteredData.reduce((sum, item) => sum + item.amount, 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                            </div>
                        )}

                        {/* Date Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-400" />
                            <select
                                className="border border-gray-300 rounded-lg text-sm py-2 pl-2 pr-8 focus:ring-indigo-500 focus:border-indigo-500"
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
                <div className="border-t border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort('date')}
                                >
                                    <div className="flex items-center gap-1">
                                        Fecha
                                        {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort('clientName')}
                                >
                                    <div className="flex items-center gap-1">
                                        Cliente
                                        {sortConfig?.key === 'clientName' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort('buyerNit')}
                                >
                                    <div className="flex items-center gap-1">
                                        NIT/CI
                                        {sortConfig?.key === 'buyerNit' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort('itemDescription')}
                                >
                                    <div className="flex items-center gap-1">
                                        Item
                                        {sortConfig?.key === 'itemDescription' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort('amount')}
                                >
                                    <div className="flex items-center gap-1">
                                        Monto
                                        {sortConfig?.key === 'amount' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center">Cargando...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No se encontraron resultados</td></tr>
                            ) : filteredData.map((sale) => (
                                <tr key={sale.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sale.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.clientName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.buyerNit || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.itemDescription} ({sale.quantity})</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Bs {sale.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleDelete(sale.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
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
