import { Search, Filter, Plus } from 'lucide-react'
import { EmployeeCard } from '@/app/components/hr/EmployeeCard'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function PersonalDashboard({
    searchParams
}: {
    searchParams: { q?: string }
}) {
    const query = searchParams.q || ''


    // Use centralized secure fetching
    const { getEmployees } = await import('@/app/lib/data/hr')
    const allEmployees = await getEmployees()

    // Client-side filtering simulation (since we are moving logic to server action first)
    // Or we could update getEmployees to accept a query, but for now lets filter the result.
    const employees = allEmployees.filter(emp => {
        if (!query) return true
        const q = query.toLowerCase()
        return (
            emp.firstName.toLowerCase().includes(q) ||
            emp.lastName.toLowerCase().includes(q) ||
            emp.jobTitle.toLowerCase().includes(q) ||
            (emp.department && emp.department.toLowerCase().includes(q))
        )
    })

    async function searchAction(formData: FormData) {
        'use server'
        const q = formData.get('q')
        redirect(`/dashboard/personal?q=${q}`)
    }

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        <span className="text-orange-500 mr-2">{employees.length}</span>
                        Employees
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your team members and their details.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button className="flex items-center justify-center px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium">
                        <Filter className="w-5 h-5 mr-0 sm:mr-2" />
                        <span className="hidden sm:inline">Filter</span>
                    </button>
                    <Link
                        href="/dashboard/personal/new"
                        className="flex items-center justify-center px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium shadow-sm shadow-orange-500/20"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add New
                    </Link>
                </div>
            </div>

            {/* Search Bar */}
            <div className="w-full bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <form action={searchAction} className="relative">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <input
                        name="q"
                        defaultValue={query}
                        type="text"
                        placeholder="Type to search an employee by name, job or department..."
                        className="w-full pl-12 pr-4 py-3 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0"
                    />
                </form>
            </div>

            {/* Employee Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.map((emp) => (
                    <EmployeeCard key={emp.id} employee={emp} />
                ))}
                {employees.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        No employees found matching &quot;{query}&quot;.
                    </div>
                )}
            </div>
        </div>
    )
}
