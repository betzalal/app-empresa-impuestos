import prisma from '@/lib/prisma'
import PayrollForm from './PayrollForm'

interface NewPayrollPageProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

export default async function NewPayrollPage({ searchParams }: NewPayrollPageProps) {
    const { getEmployees, getPayroll } = await import('@/app/lib/data/hr')
    const employees = await getEmployees()

    let initialData = null
    const copyId = searchParams.copyId as string

    if (copyId) {
        initialData = await getPayroll(copyId)
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {initialData ? 'Duplicate Payroll' : 'Generate Payroll'}
            </h1>
            <PayrollForm employees={employees} initialData={initialData} />
        </div>
    )
}

