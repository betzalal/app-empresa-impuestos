'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calculator,
    TrendingDown,
    Plus,
    Trash2,
    Save,
    Info,
    AlertCircle,
    ArrowRight,
    Package,
    DollarSign,
    Scale,
    Receipt,
    RefreshCw,
    TrendingUp,
    ChevronDown,
    Activity
} from 'lucide-react'
import { getIueDataAction, saveIueDataAction, IueDataInput, getIueAutomatedDataAction } from '@/app/actions/iue'

export default function IuePage() {
    const [year, setYear] = useState(new Date().getFullYear())
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    // Automated Data State
    const [autoData, setAutoData] = useState({
        totalSales: 0,
        totalPurchases: 0,
        operatingExpenses: {
            "Alquileres": 0,
            "Servicios Básicos": 0,
            "Mantenimiento": 0,
            "Publicidad y Marketing": 0,
            "Seguros": 0
        },
        payroll: {
            sueldos: 0,
            aportes: 0,
            provisions: 0,
            total: 0
        }
    })

    // Manual / Form State
    const [iueData, setIueData] = useState<IueDataInput & { computerValue: number, furnitureValue: number, appValue: number }>({
        year: year,
        initialInventory: 0,
        finalInventory: 0,
        depreciation: 0,
        otherNonMonetaryA: 0,
        fines: 0,
        withoutInvoice: 0,
        personalExpenses: 0,
        nonMonetaryDetail: '',
        nonMonetaryAmount: 0,
        taxAdjustmentDetail: '',
        taxAdjustmentAmount: 0,
        computerValue: 0,
        furnitureValue: 0,
        appValue: 200000,
    })

    // Dynamic List States
    const [itemsBox2, setItemsBox2] = useState<{ id: string, detail: string, amount: number }[]>([])
    const [itemsBox3, setItemsBox3] = useState<{ id: string, detail: string, amount: number }[]>([])
    const [itemsBox4, setItemsBox4] = useState<{ id: string, detail: string, amount: number }[]>([])
    const [itemsBox5, setItemsBox5] = useState<{ id: string, detail: string, amount: number }[]>([])
    const [softwareItems, setSoftwareItems] = useState<{ id: string, detail: string, amount: number }[]>([])

    // Individual Input States for Lists
    const [tempItem2, setTempItem2] = useState({ detail: '', amount: 0 })
    const [tempItem3, setTempItem3] = useState({ detail: '', amount: 0 })
    const [tempItem4, setTempItem4] = useState({ detail: '', amount: 0 })
    const [tempItem5, setTempItem5] = useState({ detail: '', amount: 0 })

    useEffect(() => {
        init()
    }, [year])

    const init = async () => {
        setLoading(true)
        await Promise.all([loadManualData(), loadAutoData()])
        setLoading(false)
    }

    const loadAutoData = async () => {
        setRefreshing(true)
        const res = await getIueAutomatedDataAction(year)
        if (res.success && res.data) {
            setAutoData(res.data as any)
        }
        setRefreshing(false)
    }

    const loadManualData = async () => {
        const res = await getIueDataAction(year)
        if (res.success && res.data) {
            const data = res.data as any

            // Extract computerValue/furnitureValue from itemsBox2 if they exist, or keep 0
            // Since we didn't have these fields in DB before, we'll try to find them in JSON or just use defaults
            setIueData({
                ...data,
                computerValue: data.computerValue || 0,
                furnitureValue: data.furnitureValue || 0,
            })

            try {
                setItemsBox2(data.itemsBox2 ? JSON.parse(data.itemsBox2) : [])
                setItemsBox3(data.itemsBox3 ? JSON.parse(data.itemsBox3) : [])
                setItemsBox4(data.itemsBox4 ? JSON.parse(data.itemsBox4) : [])
                setItemsBox5(data.itemsBox5 ? JSON.parse(data.itemsBox5) : [])
                setSoftwareItems(data.softwareItems ? JSON.parse(data.softwareItems) : [])
            } catch (e) {
                console.error("Error parsing items:", e)
                setItemsBox2([])
                setItemsBox3([])
                setItemsBox4([])
                setItemsBox5([])
            }
        } else {
            resetFields()
        }
    }

    const resetFields = () => {
        setIueData({
            year: year,
            initialInventory: 0,
            finalInventory: 0,
            depreciation: 0,
            otherNonMonetaryA: 0,
            fines: 0,
            withoutInvoice: 0,
            personalExpenses: 0,
            nonMonetaryDetail: '',
            nonMonetaryAmount: 0,
            taxAdjustmentDetail: '',
            taxAdjustmentAmount: 0,
            computerValue: 0,
            furnitureValue: 0,
            appValue: 0,
        })
        setItemsBox2([])
        setItemsBox3([])
        setItemsBox4([])
        setItemsBox5([])
        setSoftwareItems([])
    }

    const handleSave = async () => {
        setSaving(true)
        const finalData: any = {
            ...iueData,
            year,
            itemsBox2: JSON.stringify(itemsBox2),
            itemsBox3: JSON.stringify(itemsBox3),
            itemsBox4: JSON.stringify(itemsBox4),
            itemsBox5: JSON.stringify(itemsBox5),
            softwareItems: JSON.stringify(softwareItems),
        }
        const res = await saveIueDataAction(finalData)
        if (res.success) {
            alert('Datos del IUE guardados correctamente')
        } else {
            alert('Error al guardar: ' + res.error)
        }
        setSaving(false)
    }

    // List Management Helpers
    const addItem = (box: 2 | 3 | 4 | 5) => {
        const itemMap: Record<number, { detail: string, amount: number }> = {
            2: tempItem2,
            3: tempItem3,
            4: tempItem4,
            5: tempItem5
        }
        const temp = itemMap[box]
        if (!temp.detail || temp.amount <= 0) return

        const newItem = { id: Math.random().toString(36).substr(2, 9), ...temp }

        if (box === 2) {
            setItemsBox2(prev => [...prev, newItem])
            setTempItem2({ detail: '', amount: 0 })
        } else if (box === 3) {
            setItemsBox3(prev => [...prev, newItem])
            setTempItem3({ detail: '', amount: 0 })
        } else if (box === 4) {
            setItemsBox4(prev => [...prev, newItem])
            setTempItem4({ detail: '', amount: 0 })
        } else if (box === 5) {
            setItemsBox5(prev => [...prev, newItem])
            setTempItem5({ detail: '', amount: 0 })
        }
    }

    const removeItem = (box: 2 | 3 | 4 | 5 | 6, id: string) => {
        if (box === 2) setItemsBox2(prev => prev.filter(i => i.id !== id))
        else if (box === 3) setItemsBox3(prev => prev.filter(i => i.id !== id))
        else if (box === 4) setItemsBox4(prev => prev.filter(i => i.id !== id))
        else if (box === 5) setItemsBox5(prev => prev.filter(i => i.id !== id))
        else if (box === 6) setSoftwareItems(prev => prev.filter(i => i.id !== id))
    }

    // --- FINANCIAL EQUATIONS ---

    // 1. Costo de Ventas (CV)
    const costOfSales = iueData.initialInventory + autoData.totalPurchases - iueData.finalInventory

    // 2. Utilidad Bruta (UB)
    const grossProfit = autoData.totalSales - costOfSales

    // 3. Gastos Operativos (GO)
    const opExpensesTotal = (
        autoData.payroll.total +
        autoData.operatingExpenses["Alquileres"] +
        autoData.operatingExpenses["Servicios Básicos"] +
        autoData.operatingExpenses["Mantenimiento"] +
        autoData.operatingExpenses["Publicidad y Marketing"] +
        autoData.operatingExpenses["Seguros"]
    )

    // 4. Gastos No Monetarios (GNM)
    const computerDepreciation = iueData.computerValue * 0.25
    const furnitureDepreciation = iueData.furnitureValue * 0.10
    const softwareAmortization = softwareItems.reduce((acc, curr) => acc + (curr.amount * 0.20), 0)
    const extraNonMonetary = itemsBox2.reduce((acc, curr) => acc + curr.amount, 0)
    const totalGNM = computerDepreciation + furnitureDepreciation + softwareAmortization + iueData.depreciation + iueData.otherNonMonetaryA + extraNonMonetary

    // 5. Utilidad Neta Contable (UN)
    const netProfitAccounting = grossProfit - opExpensesTotal - totalGNM

    // 6. Ajuste Fiscal (AF)
    const extraNonDeductible = itemsBox3.reduce((acc, curr) => acc + curr.amount, 0)
    const extraAdjustments = itemsBox4.reduce((acc, curr) => acc + curr.amount, 0)
    const totalTaxAdjustments = iueData.fines + iueData.withoutInvoice + iueData.personalExpenses + extraNonDeductible + iueData.taxAdjustmentAmount + extraAdjustments

    // 7. Base Imponible (BI)
    const taxExemptIncome = itemsBox5.reduce((acc, curr) => acc + curr.amount, 0)
    const taxBase = Math.max(0, netProfitAccounting + totalTaxAdjustments - taxExemptIncome)

    // 8. IUE to Pay
    const iueFinal = taxBase * 0.25

    const updateField = (field: string, value: any) => {
        setIueData(prev => ({ ...prev, [field]: value }))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                            <Calculator className="text-blue-500" /> Cálculo del IUE {year}
                        </h1>
                        <p className="text-[var(--text-secondary)] mt-1 text-sm">Automatización basada en ventas, gastos y planillas.</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                        {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button
                        onClick={loadAutoData}
                        disabled={refreshing}
                        className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-4 py-2 rounded-xl transition-all flex items-center gap-2 border border-[var(--border-color)] text-sm"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refrescar Datos
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 text-sm"
                    >
                        <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Todo'}
                    </button>
                </div>
            </div>

            {/* MAIN DASHBOARD RESULTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Result Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-900 border border-blue-400/20 p-8 shadow-2xl shadow-blue-900/40"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <TrendingDown size={140} className="text-white" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <h2 className="text-white/60 text-xs font-black uppercase tracking-[0.2em] mb-1 text-center lg:text-left">Impuesto Determinado</h2>
                            <div className="text-4xl lg:text-5xl font-black text-white mb-2 flex items-center justify-center lg:justify-start gap-4">
                                <span className="text-blue-200 text-3xl">Bs</span>
                                {iueFinal.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-white/10">
                            <div>
                                <p className="text-white/50 text-[10px] uppercase font-bold">Base Imponible</p>
                                <p className="text-white font-mono text-lg">Bs {taxBase.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-white/50 text-[10px] uppercase font-bold">Utilidad Neta</p>
                                <p className="text-white font-mono text-lg">Bs {netProfitAccounting.toLocaleString()}</p>
                            </div>
                            <div className="hidden md:block">
                                <p className="text-white/50 text-[10px] uppercase font-bold">Ajustes Fiscales</p>
                                <p className="text-white font-mono text-lg">Bs {totalTaxAdjustments.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Formulas Sidebar (Full Breakdown) */}
                <div className="glass-card p-5 border-[var(--border-color)] space-y-4 bg-[var(--bg-card)]">
                    <h3 className="text-[var(--text-primary)] text-xs font-black uppercase flex items-center gap-2 opacity-70">
                        <Activity size={14} className="text-blue-500" /> Desglose de la Ecuación
                    </h3>
                    <div className="space-y-3">
                        <FormulaRow label="Ventas Totales (VT)" value={autoData.totalSales} />
                        <FormulaRow label="Costo de Ventas (CV)" value={costOfSales} isNegative />
                        <div className="border-t border-[var(--border-color)] my-1.5 opacity-50"></div>
                        <FormulaRow label="Utilidad Bruta (UB)" value={grossProfit} isHighlight />

                        <div className="pt-1.5 space-y-1">
                            <FormulaRow label="Carga Laboral (CL)" value={autoData.payroll.total} isNegative />
                            <FormulaRow label="Gastos Funcionamiento (GF)" value={opExpensesTotal - autoData.payroll.total} isNegative />
                            <div className="flex justify-between text-[11px] text-[var(--text-secondary)] italic pl-2 border-l border-[var(--border-color)]">
                                <span>Total Operativos (GO)</span>
                                <span>Bs {opExpensesTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        <FormulaRow label="Gastos No Monetarios (GNM)" value={totalGNM} isNegative />
                        <div className="border-t border-[var(--border-color)] my-1.5 opacity-50"></div>
                        <FormulaRow label="Utilidad Neta (UN)" value={netProfitAccounting} isHighlight />

                        <FormulaRow label="Ajuste Fiscal (AF)" value={totalTaxAdjustments} />
                        <FormulaRow label="Rentas No Gravadas (RG)" value={taxExemptIncome} isNegative />

                        <div className="border-t-2 border-blue-500/30 my-2 pt-2">
                            <FormulaRow label="Base Imponible (BI)" value={taxBase} isHighlight />
                            <div className="flex justify-between text-xs text-blue-400 font-bold mt-1">
                                <span>Alicuota IUE (25%)</span>
                                <span>Bs {iueFinal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* INPUT SECTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* 1. Gestión de Costos */}
                <SectionCard title="Gestión de Costos" icon={<Package className="text-blue-400" />}>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <InputPair
                                label="Inventario Inicial"
                                value={iueData.initialInventory}
                                onChange={(v) => updateField('initialInventory', v)}
                            />
                            <InputPair
                                label="Inventario Final"
                                value={iueData.finalInventory}
                                onChange={(v) => updateField('finalInventory', v)}
                            />
                        </div>
                        <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)]">
                            <p className="text-[10px] text-[var(--text-secondary)] uppercase font-black mb-2 opacity-50">Compras Registradas (Automático)</p>
                            <p className="text-xl font-mono text-[var(--text-primary)]">Bs {autoData.totalPurchases.toLocaleString()}</p>
                            <p className="text-[9px] text-[var(--text-secondary)] mt-1 italic">* Jala datos de facturas de compras del año {year}</p>
                        </div>
                    </div>
                </SectionCard>

                {/* 2. Carga Laboral y Funcionamiento */}
                <SectionCard title="Gastos Operativos" icon={<Activity className="text-emerald-400" />}>
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                                <p className="text-[10px] text-emerald-500 font-black mb-1 text-center uppercase tracking-tighter">PERSONAL + BENEFICIOS</p>
                                <p className="text-lg font-mono text-[var(--text-primary)] text-center">Bs {autoData.payroll.total.toLocaleString()}</p>
                            </div>
                            <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
                                <p className="text-[10px] text-blue-500 font-black mb-1 text-center uppercase tracking-tighter">FACTURAS FUNCIONAMIENTO</p>
                                <p className="text-lg font-mono text-[var(--text-primary)] text-center">Bs {(opExpensesTotal - autoData.payroll.total).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <DataBar label="Sueldos y Bonos" value={autoData.payroll.sueldos} total={opExpensesTotal} color="bg-emerald-500" />
                            <DataBar label="Aportes y Seguros (Inc. Provisiones)" value={autoData.payroll.aportes} total={opExpensesTotal} color="bg-emerald-500/60" />
                            <DataBar label="Reserva Aguinaldo (Ref.)" value={autoData.payroll.provisions} total={opExpensesTotal} color="bg-emerald-500/30" />
                            <DataBar label="Alquileres y Servicios" value={autoData.operatingExpenses["Alquileres"] + autoData.operatingExpenses["Servicios Básicos"]} total={opExpensesTotal} color="bg-blue-500" />
                            <DataBar label="Otros Operativos" value={autoData.operatingExpenses["Mantenimiento"] + autoData.operatingExpenses["Publicidad y Marketing"] + autoData.operatingExpenses["Seguros"]} total={opExpensesTotal} color="bg-blue-400" />
                        </div>
                    </div>
                </SectionCard>

                {/* 3. Gastos No Monetarios (Asset Valuation) */}
                <SectionCard title="Gastos No Monetarios" icon={<Scale className="text-purple-400" />} total={totalGNM}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800">
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 uppercase font-black">Valor Computadoras</label>
                                <input
                                    type="number"
                                    value={iueData.computerValue || ''}
                                    onChange={(e) => updateField('computerValue', Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-sm outline-none"
                                />
                                <p className="text-[10px] text-purple-400 italic">Depr. 25%: Bs {computerDepreciation.toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 uppercase font-black">Valor Muebles</label>
                                <input
                                    type="number"
                                    value={iueData.furnitureValue || ''}
                                    onChange={(e) => updateField('furnitureValue', Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-sm outline-none"
                                />
                                <p className="text-[10px] text-purple-400 italic">Depr. 10%: Bs {furnitureDepreciation.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Software/Apps List with 20% calculation */}
                        <DynamicList
                            items={softwareItems}
                            onAdd={(detail, amount) => setSoftwareItems(p => [...p, { id: Date.now().toString(), detail, amount }])}
                            onRemove={(id) => removeItem(6, id)}
                            accentColor="purple"
                            label="VALOR APPS / SOFTWARE (Amort. 20%)"
                        />
                        <div className="flex justify-between items-center text-[10px] text-purple-400 font-bold px-1 py-1 bg-purple-500/5 rounded-lg border border-purple-500/10">
                            <span>TOTAL AMORTIZACIÓN SOFTWARE</span>
                            <span>Bs {softwareAmortization.toLocaleString()}</span>
                        </div>

                        <InputPair label="Depreciación Otros Activos" value={iueData.depreciation} onChange={(v) => updateField('depreciation', v)} />

                        {/* List items for other GNM */}
                        <DynamicList
                            items={itemsBox2}
                            onAdd={(detail, amount) => { setItemsBox2(p => [...p, { id: Date.now().toString(), detail, amount }]) }}
                            onRemove={(id) => removeItem(2, id)}
                            accentColor="purple"
                            label="Otros Ajustes GNM"
                        />
                    </div>
                </SectionCard>

                {/* 4. Ajustes y No Deducibles */}
                <SectionCard title="Fuera de Movimiento (Ajustes)" icon={<RefreshCw className="text-red-400" />} total={totalTaxAdjustments}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <InputPair label="Multas/Sanciones" value={iueData.fines} onChange={(v) => updateField('fines', v)} />
                            <InputPair label="Sin Factura" value={iueData.withoutInvoice} onChange={(v) => updateField('withoutInvoice', v)} />
                        </div>
                        <InputPair label="Ajuste Impositivo Manual" value={iueData.taxAdjustmentAmount} onChange={(v) => updateField('taxAdjustmentAmount', v)} />

                        <DynamicList
                            items={itemsBox3}
                            onAdd={(detail, amount) => setItemsBox3(p => [...p, { id: Date.now().toString(), detail, amount }])}
                            onRemove={(id) => removeItem(3, id)}
                            accentColor="red"
                            label="Gastos No Deducibles Extra"
                        />
                    </div>
                </SectionCard>

                {/* 5. Rentas No Gravadas (Subtracted) */}
                <SectionCard title="Rentas No Gravadas" icon={<TrendingUp className="text-amber-400" />} total={taxExemptIncome} className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-sm text-slate-400 italic mb-6">
                                Detalla aquí los ingresos del año que no están sujetos al IUE según normas vigentes.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    id="renta-detail"
                                    type="text"
                                    placeholder="Motivo de exención..."
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                                <input
                                    id="renta-amount"
                                    type="number"
                                    placeholder="Bs"
                                    className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                                <button
                                    onClick={() => {
                                        const d = (document.getElementById('renta-detail') as HTMLInputElement).value
                                        const a = (document.getElementById('renta-amount') as HTMLInputElement).value
                                        if (d && Number(a) > 0) {
                                            setItemsBox5(p => [...p, { id: Date.now().toString(), detail: d, amount: Number(a) }])
                                                ; (document.getElementById('renta-detail') as HTMLInputElement).value = ''
                                                ; (document.getElementById('renta-amount') as HTMLInputElement).value = ''
                                        }
                                    }}
                                    className="bg-amber-600 p-2 rounded-xl text-white"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {itemsBox5.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] group">
                                    <span className="text-[var(--text-secondary)] text-sm">{item.detail}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-amber-600 font-bold font-mono">- Bs {item.amount.toLocaleString()}</span>
                                        <button onClick={() => removeItem(5, item.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SectionCard>
            </div>

            <div className="p-8 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl flex flex-col md:flex-row gap-8 items-center justify-between shadow-sm">
                <div className="space-y-1">
                    <h4 className="text-xl font-bold text-[var(--text-primary)]">¿Todo listo?</h4>
                    <p className="text-[var(--text-secondary)] text-sm">Asegúrate de guardar los cambios antes de salir para que se reflejen en los reportes anuales.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-black px-12 py-4 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <Save size={24} /> {saving ? 'GUARDANDO...' : 'GUARDAR GESTIÓN ' + year}
                </button>
            </div>
        </div>
    )
}

// --- HELPER COMPONENTS ---

function SectionCard({ title, icon, children, total, className = "" }: { title: string, icon: React.ReactNode, children: React.ReactNode, total?: number, className?: string }) {
    return (
        <div className={`bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-3xl space-y-5 shadow-sm ${className}`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">{icon}</div>
                    <h3 className="text-xs font-black text-[var(--text-primary)] opacity-70 uppercase tracking-widest">{title}</h3>
                </div>
                {total !== undefined && (
                    <div className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-primary)] px-3 py-1 rounded-full border border-[var(--border-color)]">
                        Total: BS {total.toLocaleString()}
                    </div>
                )}
            </div>
            {children}
        </div>
    )
}

function InputPair({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
    return (
        <div className="space-y-1">
            <label className="text-[11px] text-[var(--text-secondary)] uppercase font-black tracking-tighter ml-1 opacity-70">{label}</label>
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] font-bold text-xs opacity-50">BS</div>
                <input
                    type="number"
                    value={value || ''}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-1.5 pl-10 pr-4 text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                    placeholder="0.00"
                />
            </div>
        </div>
    )
}

function FormulaRow({ label, value, isNegative, isHighlight }: { label: string, value: number, isNegative?: boolean, isHighlight?: boolean }) {
    return (
        <div className={`flex justify-between text-xs items-center ${isHighlight ? 'text-[var(--text-primary)] font-bold py-0.5' : 'text-[var(--text-secondary)]'}`}>
            <span className="opacity-80">{label}</span>
            <span className={`font-mono ${isNegative ? 'text-red-500' : isHighlight ? 'text-blue-500' : ''}`}>
                {isNegative ? '-' : ''} {Math.abs(value).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
            </span>
        </div>
    )
}

function DataBar({ label, value, total, color }: { label: string, value: number, total: number, color: string }) {
    const percentage = Math.min(100, Math.max(0, (value / (total || 1)) * 100))
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500">{label}</span>
                <span className="text-[var(--text-primary)] opacity-70 font-mono">Bs {value.toLocaleString()}</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={`h-full ${color}`}
                />
            </div>
        </div>
    )
}

function DynamicList({ items, onAdd, onRemove, accentColor, label }: { items: any[], onAdd: (d: string, a: number) => void, onRemove: (id: string) => void, accentColor: string, label: string }) {
    const [d, setD] = useState('')
    const [a, setA] = useState<number | ''>('')

    return (
        <div className="space-y-3 pt-4 border-t border-slate-800">
            <p className="text-[9px] text-slate-500 uppercase font-black">{label}</p>
            <div className="flex gap-2">
                <input type="text" value={d} onChange={e => setD(e.target.value)} placeholder="Motivo..." className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] text-white outline-none" />
                <input type="number" value={a} onChange={e => setA(Number(e.target.value))} placeholder="Bs" className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] text-white outline-none" />
                <button onClick={() => { if (d && a) { onAdd(d, a); setD(''); setA('') } }} className={`bg-${accentColor}-600 p-1.5 rounded-lg text-white`}><Plus size={14} /></button>
            </div>
            <div className="space-y-1 max-h-[100px] overflow-y-auto">
                {items.map((i: any) => (
                    <div key={i.id} className="flex justify-between items-center text-[10px] bg-slate-950/50 p-2 rounded-lg border border-slate-900 group">
                        <span className="text-slate-400">{i.detail}</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-${accentColor}-400 font-bold`}>Bs {i.amount.toLocaleString()}</span>
                            <button onClick={() => onRemove(i.id)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
