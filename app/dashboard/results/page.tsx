'use client'

import { getMonthlyTotals, getTaxParameters, getPreviousMonthEndingBalances, saveTaxParameters } from '@/app/actions/tax-data'
import { calculateTaxes, TaxResult } from '@/lib/tax-engine'
import { useEffect, useState } from 'react'

export default function ResultsPage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<TaxResult | null>(null)

    // Inputs
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())
    const [ufvStart, setUfvStart] = useState(2.0)
    const [ufvEnd, setUfvEnd] = useState(2.0)
    const [prevBalanceCF, setPrevBalanceCF] = useState(0)
    const [prevBalanceIUE, setPrevBalanceIUE] = useState(0)

    // Log status for user
    const [statusMessage, setStatusMessage] = useState('')

    // Fetched Data
    const [totals, setTotals] = useState({ sales: 0, purchases: 0 })

    // Auto-load parameters when month/year changes
    useEffect(() => {
        async function loadParameters() {
            setLoading(true)
            setStatusMessage('Cargando parámetros...')

            // 1. Try to load saved parameters for THIS month
            const paramsRes = await getTaxParameters(month, year)
            if (paramsRes.success && paramsRes.data) {
                setUfvStart(paramsRes.data.ufvStart)
                setUfvEnd(paramsRes.data.ufvEnd)
                setPrevBalanceCF(paramsRes.data.previousBalanceCF)
                setPrevBalanceIUE(paramsRes.data.previousBalanceIUE)
                setStatusMessage('Datos cargados.')
            } else {
                // 2. If no saved params, try to load PREVIOUS month ending balances
                const prevRes = await getPreviousMonthEndingBalances(month, year)
                if (prevRes.success) {
                    setPrevBalanceCF(prevRes.balanceCFEnd)
                    setPrevBalanceIUE(prevRes.balanceIUEEnd)
                    setStatusMessage('Saldos del mes anterior cargados.')
                } else {
                    setStatusMessage('No se encontraron datos previos.')
                    // Reset to defaults if desired, or keep current
                }
            }
            setLoading(false)
        }
        loadParameters()
    }, [month, year])

    async function handleCalculate() {
        setLoading(true)
        // 1. Fetch data
        const res = await getMonthlyTotals(month, year)

        if (res.success) {
            setTotals({ sales: res.salesTotal, purchases: res.purchasesTotal })

            // 2. Calculate
            const taxInput = {
                salesTotal: res.salesTotal,
                purchasesTotal: res.purchasesTotal,
                ufvStart,
                ufvEnd,
                prevBalanceCF,
                prevBalanceIUE
            }

            const taxRes = calculateTaxes(taxInput)
            setResult(taxRes)
        }
        setLoading(false)
    }

    async function handleSave() {
        if (!result) {
            alert('Primero debe calcular los impuestos.')
            return
        }

        if (!confirm('¿Seguro de guardar/cerrar los parámetros de este mes? Esto permitirá usar los saldos en el siguiente mes.')) return

        setLoading(true)
        const res = await saveTaxParameters({
            month,
            year,
            ufvStart,
            ufvEnd,
            previousBalanceCF: prevBalanceCF,
            previousBalanceIUE: prevBalanceIUE,
            balanceCFEnd: result.iva.newBalance,
            balanceIUEEnd: result.it.newBalanceIUE || 0 // Assuming IT balance also carries over if needed? Usually only IUE to IT.
            // Wait, tax-engine returns newBalanceIUE as leftover from prevBalanceIUE - IT. 
            // If we want to persist IUE profit for next year payment, that's different.
            // Requirement says: "saldo de Crédito Fiscal ... y lo que no fue gastado en el IVA" (CF)
            // Let's assume balanceIUEEnd is what's useful for next month IT offset.
        })

        if (res.success) {
            alert(res.message)
        } else {
            alert(res.message)
        }
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-white">Resultados de Impuestos</h1>
                {statusMessage && <span className="text-sm text-slate-300">{statusMessage}</span>}
            </div>

            <div className="bg-white shadow sm:rounded-lg p-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Mes</label>
                        <select value={month} onChange={e => setMonth(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm text-gray-900">
                            {[...Array(12)].map((_, i) => (
                                <option key={i} value={i + 1}>{i + 1}</option>
                            ))}
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Año</label>
                        <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm text-gray-900" />
                    </div>

                    <div className="sm:col-span-6 border-t pt-4 mt-2"><h3 className="font-medium text-gray-900">Variables UFV y Saldos</h3></div>

                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700">UFV Inicial (Ultimo día hábil mes anterior)</label>
                        <input type="number" step="0.00001" value={ufvStart} onChange={e => setUfvStart(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm text-gray-900" />
                    </div>
                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700">UFV Final (Ultimo día hábil mes actual)</label>
                        <input type="number" step="0.00001" value={ufvEnd} onChange={e => setUfvEnd(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm text-gray-900" />
                    </div>

                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700">Saldo Crédito Fiscal Anterior</label>
                        <input type="number" step="0.01" value={prevBalanceCF} onChange={e => setPrevBalanceCF(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm text-gray-900" />
                    </div>

                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700">Saldo IUE Disponible</label>
                        <input type="number" step="0.01" value={prevBalanceIUE} onChange={e => setPrevBalanceIUE(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm text-gray-900" />
                    </div>

                    <div className="sm:col-span-6 pt-4 flex space-x-3">
                        <button onClick={handleCalculate} className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                            {loading ? 'Procesando...' : 'Calcular Impuestos'}
                        </button>

                        {result && (
                            <button onClick={handleSave} className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                                Guardar Parámetros (Cerrar Mes)
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {result && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* IVA CARD */}
                    <div className="bg-white shadow sm:rounded-lg p-6 border-l-4 border-indigo-500">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Impuesto al Valor Agregado (IVA)</h3>
                        <div className="space-y-2 text-sm text-gray-700">
                            <div className="flex justify-between"><span>Ventas Mes:</span> <span className="font-semibold">{totals.sales.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Compras Mes (Base CF):</span> <span className="font-semibold">{totals.purchases.toFixed(2)}</span></div>
                            <div className="border-t my-2"></div>
                            <div className="flex justify-between"><span>Débito Fiscal (13% Ventas):</span> <span className="text-red-600">{result.iva.debitFiscal}</span></div>
                            <div className="flex justify-between"><span>Crédito Fiscal (13% Compras):</span> <span className="text-green-600">{result.iva.creditFiscal}</span></div>
                            <div className="flex justify-between"><span>Actualización Saldo Ant:</span> <span className="text-green-600">{result.iva.updateBalance}</span></div>
                            <div className="flex justify-between font-medium"><span>Total Crédito Fiscal (S+Act+Mes):</span> <span className="text-green-600">{result.iva.totalCF}</span></div>
                            <div className="border-t my-2"></div>
                            <div className="flex justify-between text-lg font-bold"><span>IVA A Pagar:</span> <span>{result.iva.pay}</span></div>
                            <div className="flex justify-between text-gray-500"><span>Nuevo Saldo CF (Sig. Mes):</span> <span>{result.iva.newBalance}</span></div>
                        </div>
                    </div>

                    {/* IT CARD */}
                    <div className="bg-white shadow sm:rounded-lg p-6 border-l-4 border-yellow-500">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Impuesto a las Transacciones (IT)</h3>
                        <div className="space-y-2 text-sm text-gray-700">
                            <div className="flex justify-between"><span>Ingresos Brutos:</span> <span className="font-semibold">{totals.sales.toFixed(2)}</span></div>
                            <div className="border-t my-2"></div>
                            <div className="flex justify-between"><span>IT Determinado (3%):</span> <span className="text-red-600">{result.it.determined}</span></div>
                            <div className="flex justify-between"><span>Saldo IUE Compemsable:</span> <span className="text-green-600">{prevBalanceIUE.toFixed(2)}</span></div>
                            <div className="border-t my-2"></div>
                            <div className="flex justify-between text-lg font-bold"><span>IT A Pagar:</span> <span>{result.it.pay}</span></div>
                            <div className="flex justify-between text-gray-500"><span>Nuevo Saldo IUE:</span> <span>{result.it.newBalanceIUE}</span></div>
                        </div>
                    </div>

                    {/* FINANCIAL RESULT CARD REMOVED AS REQUESTED */}
                </div>
            )}
        </div>
    )
}
