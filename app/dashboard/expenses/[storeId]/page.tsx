import { getExpenses, getExpenseStoreById } from '@/app/actions/expenses'
import { StoreManager } from './StoreManager'
import { ArrowLeft, Store } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
    params: {
        storeId: string
    }
}

export default async function StorePage({ params }: PageProps) {
    const { storeId } = params

    const [storeRes, expensesRes] = await Promise.all([
        getExpenseStoreById(storeId),
        getExpenses(storeId) // Fetch all expenses
    ])

    if (!storeRes.success || !storeRes.data) {
        return notFound()
    }

    const store = storeRes.data
    const expenses = expensesRes.success ? expensesRes.data : []

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/expenses"
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <Store className="w-6 h-6 text-blue-500" />
                        {store.name}
                    </h1>
                    {store.description && <p className="text-slate-400 mt-1">{store.description}</p>}
                </div>
            </div>

            <StoreManager store={store} expenses={expenses || []} />
        </div>
    )
}
