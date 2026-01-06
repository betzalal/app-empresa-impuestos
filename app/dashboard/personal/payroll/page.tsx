import { Plus } from 'lucide-react'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import PayrollList from './PayrollList'

import { getEmployeesWithPayrolls } from '@/app/lib/data/hr'

export default async function PayrollPage() {
    // Grouping Strategy: Fetch employees with their payrolls directly.
    // This allows us to map 1 Employee -> N Payrolls easily in the UI.
    const employeesWithPayrolls = await getEmployeesWithPayrolls()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nóminas (Payroll)</h1>
                <Link
                    href="/dashboard/personal/payroll/new"
                    className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Nómina
                </Link>
            </div>

            <PayrollList employees={employeesWithPayrolls as any} />
        </div>
    )
}
