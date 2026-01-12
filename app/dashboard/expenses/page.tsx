import { getExpenseStores } from '@/app/actions/expenses'
import { ExpenseStoreList } from './ExpenseStoreList'
import { Store, Plus } from 'lucide-react'

export default async function ExpensesPage() {
    const { success, data: stores } = await getExpenseStores()

    if (!success) {
        return <div>Error loading stores</div>
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Store className="w-6 h-6 text-blue-500" />
                        Gastos Operativos
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">Selecciona una tienda para gestionar sus gastos</p>
                </div>
            </div>

            <ExpenseStoreList initialStores={stores || []} />
        </div>
    )
}
