import { getDashboardSummary } from '@/app/actions/dashboard'
import { getPaymentProofs } from '@/app/actions/payments'
import { DashboardFilter } from '@/app/components/dashboard/DashboardFilter'
import { PaymentUploadCard } from '@/app/components/dashboard/PaymentUploadCard'

export default async function PagosPage({ searchParams }: { searchParams: { month?: string, year?: string } }) {
    const month = searchParams.month ? parseInt(searchParams.month) : undefined
    const year = searchParams.year ? parseInt(searchParams.year) : undefined

    // 1. Get tax calculations
    const summary = await getDashboardSummary(month, year)

    // 2. Get existing proofs
    const proofs = await getPaymentProofs(summary.month, summary.year)

    const proofIVA = proofs.find((p: any) => p.taxType === 'IVA')
    const proofIT = proofs.find((p: any) => p.taxType === 'IT')

    // Determining amounts to pay
    // IVA: if pay > 0, that's the debt. If newBalance > 0, it's credit (no debt).
    const amountIVA = summary.taxes.iva.pay
    const amountIT = summary.taxes.it.pay

    return (
        <div className="space-y-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de Pagos</h1>
                    <p className="text-gray-500">Sube tus comprobantes para respaldar los impuestos.</p>
                </div>
                <DashboardFilter />
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3 text-blue-800 text-sm">
                <span className="flex items-center justify-center w-6 h-6 bg-blue-200 text-blue-700 rounded-full font-bold text-xs">i</span>
                <p>
                    Estás viendo los impuestos de
                    <span className="font-bold mx-1">
                        {new Date(summary.year, summary.month - 1, 1).toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })}
                    </span>
                    (A pagar en el siguiente mes).
                </p>
            </div>

            {/* Upload Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* IVA Card */}
                <PaymentUploadCard
                    taxType="IVA"
                    month={summary.month}
                    year={summary.year}
                    calculatedAmount={amountIVA}
                    existingProof={proofIVA}
                />

                {/* IT Card */}
                <PaymentUploadCard
                    taxType="IT"
                    month={summary.month}
                    year={summary.year}
                    calculatedAmount={amountIT}
                    existingProof={proofIT}
                />

            </div>

            {/* History Hint (Optional, could be expanded later) */}
            <div className="mt-12 opacity-50 text-center">
                <p className="text-sm text-gray-400 mb-2">Historial de cargas recientes</p>
                <div className="flex justify-center gap-2">
                    <span className="h-1 w-12 rounded-full bg-gray-200"></span>
                    <span className="h-1 w-8 rounded-full bg-gray-200"></span>
                    <span className="h-1 w-4 rounded-full bg-gray-200"></span>
                </div>
            </div>

        </div>
    )
}
