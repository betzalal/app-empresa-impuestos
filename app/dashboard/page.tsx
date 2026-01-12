import { getDashboardSummary, getLastPayments, getMonthlyMatrix, getTopPurchases, getAnnualAnalytics } from '@/app/actions/dashboard'
import { getCurrentUser } from '@/app/actions/user'
import { PaymentHistory } from '@/app/components/dashboard/PaymentHistory'
import { TopPurchases } from '@/app/components/dashboard/TopPurchases'
import { ResultsMatrix } from '@/app/components/dashboard/ResultsMatrix'
import { CalendarWidget } from '@/app/components/dashboard/CalendarWidget'
import { DashboardFilter } from '@/app/components/dashboard/DashboardFilter'
import AnnualTaxSummary from '@/app/components/dashboard/AnnualTaxSummary'
import OperationsChart from '@/app/components/dashboard/OperationsChart'
import TaxTrendChart from '@/app/components/dashboard/TaxTrendChart'
import { ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react'

export default async function DashboardPage({ searchParams }: { searchParams: { month?: string, year?: string } }) {
    const user = await getCurrentUser()

    const month = searchParams.month ? parseInt(searchParams.month) : undefined
    const year = searchParams.year ? parseInt(searchParams.year) : undefined

    const summary = await getDashboardSummary(month, year)

    // Use the calculated year from summary (which handles "prev month" default)
    // This ensures TopPurchases shows 2025 data when defaulting to Dec 2025
    const displayYear = summary.year

    // OPTIMIZATION: Fetch all independent data in parallel
    const [
        payments,
        matrix,
        topPurchases,
        analytics2025,
        analytics2026,
        chartData
    ] = await Promise.all([
        getLastPayments(),
        getMonthlyMatrix(displayYear),
        getTopPurchases(displayYear),
        getAnnualAnalytics(2025),
        getAnnualAnalytics(2026),
        getAnnualAnalytics(displayYear)
    ])

    // No longer need sequential awaits
    // const payments = await getLastPayments()
    // const iueData = await getIUEProjected(displayYear)
    // const matrix = await getMonthlyMatrix(displayYear)
    // const topPurchases = await getTopPurchases(displayYear)

    // Annual Analytics for Charts
    // const analytics2025 = await getAnnualAnalytics(2025)
    // For 2026, we might want to toggle or show both?
    // User asked for "charts... red for sales, green for purchases".
    // Usually charts show a timeline. If we want 2025 and 2026, maybe we concat?
    // Or just show the "displayYear" selected?
    // The user said "see how much was paid in 2025, and in 2026... meanwhile 2026 is 0".
    // "One graph showing sales and purchases".
    // It makes sense to show the CURRENT selected year in the chart, or maybe the last 12 months.
    // Let's pass the selected year's data to the charts.
    // Let's pass the selected year's data to the charts.
    // const chartData = await getAnnualAnalytics(displayYear)
    // const analytics2026 = await getAnnualAnalytics(2026) // For the summary box specific request

    return (
        <div className="space-y-6">

            {/* Top Bar with Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
                    <p className="text-[var(--text-secondary)] text-sm">Resumen de impuestos y movimientos.</p>
                </div>
                <DashboardFilter />{/* URL param based */}
            </div>

            {/* Header / Live Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Welcome & Date */}
                <div className="glass-card p-6 flex flex-col justify-between bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-3xl group-hover:bg-white/20 transition-colors duration-500"></div>
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2 drop-shadow-md">Impuestos</h2>
                            <p className="text-white/90 font-bold text-lg capitalize drop-shadow-sm">
                                {new Date(summary.year, summary.month - 1, 1).toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center space-x-2 bg-black/20 w-fit px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md text-white border border-white/10 shadow-sm">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
                        <span>Resumen Mensual</span>
                    </div>
                </div>

                {/* IVA Live */}
                <div className="glass-card p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-[var(--text-secondary)]">Saldo IVA (Mes Actual)</p>
                            <h3 className={`text-2xl font-black mt-1 ${summary.taxes.iva.pay > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {summary.taxes.iva.pay > 0 ? 'A Pagar: ' : 'Saldo a Favor: '}
                                {Math.abs(summary.taxes.iva.pay > 0 ? summary.taxes.iva.pay : summary.taxes.iva.newBalance).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                            </h3>
                        </div>
                        <div className={`p-2 rounded-xl ${summary.taxes.iva.pay > 0 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                            {summary.taxes.iva.pay > 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                        </div>
                    </div>
                    <div className="mt-4 text-sm font-medium text-[var(--text-secondary)] flex justify-between">
                        <span>Ventas: {summary.totals.salesTotal.toLocaleString()}</span>
                        <span>Compras: {summary.totals.purchasesTotal.toLocaleString()}</span>
                    </div>
                </div>

                {/* IT Live */}
                <div className="glass-card p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-[var(--text-secondary)]">IT por Pagar</p>
                            <h3 className="text-2xl font-black mt-1 text-[var(--text-primary)]">
                                {summary.taxes.it.pay.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                            </h3>
                        </div>
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                            <RefreshCcw size={20} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-[var(--text-secondary)]">
                        {summary.taxes.it.pay > 0 && <span className="text-orange-500 font-bold">Vence pronto</span>}
                        {summary.taxes.it.pay === 0 && <span className="text-green-500 font-bold">Sin deuda</span>}
                    </div>
                </div>
            </div>

            {/* Annual Analytics Section */}
            <div className="space-y-6">

                {/* 1. Operations Chart (Sales vs Purchases) */}
                <OperationsChart data={chartData} />

                {/* 2. Annual Summary (Numbers) */}
                <AnnualTaxSummary data2025={analytics2025} data2026={analytics2026} />

                {/* 3. Tax Trend Chart */}
                <TaxTrendChart data={chartData} />

            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Payments & IUE */}
                <div className="space-y-8">
                    <PaymentHistory payments={payments} />
                </div>

                {/* Middle Column: Monthly Matrix */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="h-full">
                        <ResultsMatrix data={matrix} />
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top Purchases */}
                <div className="lg:col-span-2">
                    <TopPurchases purchases={topPurchases} />
                </div>

                {/* Calendar Widget (Phase 3) */}
                <div className="h-full">
                    <CalendarWidget nit={user?.nit || undefined} />
                </div>
            </div>

        </div>
    )
}
