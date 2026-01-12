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
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        <span className="text-orange-500 mr-2">{employees.length}</span>
                        Employees
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1 text-sm">Manage your team members and their details.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button className="flex items-center justify-center px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-primary)] transition-colors font-medium border border-[var(--border-color)] text-sm">
                        <Filter className="w-4 h-4 mr-0 sm:mr-2" />
                        <span className="hidden sm:inline">Filter</span>
                    </button>
                    <Link
                        href="/dashboard/personal/new"
                        className="flex items-center justify-center px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium shadow-sm shadow-orange-500/20 text-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New
                    </Link>
                </div>
            </div>

            {/* Search Bar */}
            <div className="w-full bg-[var(--bg-card)] p-1.5 rounded-xl border border-[var(--border-color)] shadow-sm">
                <form action={searchAction} className="relative">
                    <Search className="absolute left-4 top-2.5 h-4 w-4 text-[var(--text-secondary)] opacity-50" />
                    <input
                        name="q"
                        defaultValue={query}
                        type="text"
                        placeholder="Search employee by name, job or department..."
                        className="w-full pl-10 pr-4 py-2 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-0 text-sm"
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
