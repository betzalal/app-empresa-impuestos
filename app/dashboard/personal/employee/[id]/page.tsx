import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Mail, Phone, MapPin, Calendar, Briefcase, ChevronLeft, CreditCard, FileText, ArrowRight, Activity, Layers } from 'lucide-react'
import { MiniOrgChart } from '@/app/components/hr/MiniOrgChart'
import prisma from '@/lib/prisma'
import Image from 'next/image'


export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
    const { verifySession } = await import('@/app/actions/company')
    const session = await verifySession()

    const employee = await prisma.employee.findUnique({
        where: { id: params.id },
        include: { payrolls: true, documents: true } // Fetch payroll history and documents
    })

    if (!employee || employee.companyId !== session.companyId) {
        notFound()
    }

    // --- Financial Calculations ---
    // 1. Current Month Cost (Latest Payroll)
    const latestPayroll = employee.payrolls.length > 0
        ? employee.payrolls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : null

    let currentMonthCost = 0
    let companyExpenses = { ss: 0, health: 0, ministry: 0, other: 0 }

    if (latestPayroll) {
        const salaryCost = latestPayroll.baseSalary + latestPayroll.bonuses
        companyExpenses = {
            ss: latestPayroll.baseSalary * latestPayroll.socialSecurity,
            health: latestPayroll.baseSalary * latestPayroll.healthInsurance,
            ministry: latestPayroll.laborMinistry,
            other: latestPayroll.otherDeductions
        }
        const totalExpenses = Object.values(companyExpenses).reduce((a, b) => a + b, 0)
        currentMonthCost = salaryCost + totalExpenses
    }

    // 2. Total Historical Cost
    const totalHistoricalCost = employee.payrolls.reduce((total, p) => {
        const salary = p.baseSalary + p.bonuses
        const expenses = (p.baseSalary * p.socialSecurity) + (p.baseSalary * p.healthInsurance) + p.laborMinistry + p.otherDeductions
        return total + salary + expenses
    }, 0)

    const averageMonthlyCost = employee.payrolls.length > 0 ? totalHistoricalCost / employee.payrolls.length : 0

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header / Back Link */}
            <div className="flex items-center gap-2">
                <Link href="/dashboard/personal" className="flex items-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                    <ChevronLeft size={20} />
                    <span className="font-medium">Back to Dashboard</span>
                </Link>
            </div>

            {/* Profile Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center md:items-start md:justify-between gap-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-900 shadow-md">
                        {/* Avatar or Initials */}
                        {employee.image ? (
                            <Image
                                src={employee.image}
                                alt={employee.firstName}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="text-3xl font-bold text-slate-500 dark:text-slate-400">
                                {employee.firstName[0]}{employee.lastName[0]}
                            </div>
                        )}
                    </div>

                    <div className="text-center md:text-left space-y-1">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{employee.firstName} {employee.lastName}</h1>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 dark:text-slate-400 font-medium">
                            <Briefcase size={16} />
                            <span>{employee.jobTitle}</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span>{employee.department}</span>
                        </div>
                        {employee.store && (
                            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-slate-400 dark:text-slate-500">
                                <MapPin size={14} />
                                <span>{employee.store}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <Link
                        href={`/dashboard/personal/employee/${employee.id}/edit`}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium text-sm"
                    >
                        Edit Details
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Personal Info & Org Chart */}
                <div className="space-y-8 col-span-1 lg:col-span-2">

                    {/* 1. Personal Info */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                            <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                            <h3 className="font-bold text-slate-900 dark:text-white">Personal Information</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document ID</label>
                                <p className="text-slate-900 dark:text-white font-medium mt-1">{employee.documentId}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Birth Date</label>
                                <p className="text-slate-900 dark:text-white font-medium mt-1">
                                    {employee.birthDate ? new Date(employee.birthDate).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Mail size={16} className="text-slate-400" />
                                    <p className="text-slate-900 dark:text-white font-medium">{employee.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Phone size={16} className="text-slate-400" />
                                    <p className="text-slate-900 dark:text-white font-medium">{employee.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Address</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <MapPin size={16} className="text-slate-400" />
                                    <p className="text-slate-900 dark:text-white font-medium">{employee.address || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Financial Summary (Company Expenses) */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Financial Summary (Company Cost)</h3>
                            </div>
                            <div className="flex items-center text-xs text-slate-400">
                                <Activity size={14} className="mr-1" />
                                Updated: {latestPayroll ? new Date(latestPayroll.createdAt).toLocaleDateString() : 'Never'}
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Current Month Breakdown */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Current Month Breakdown</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Base Salary</span>
                                            <span className="font-medium text-slate-900 dark:text-white">Bs {employee.baseSalary.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Social Security ({(latestPayroll?.socialSecurity || 0.19) * 100}%)</span>
                                            <span className="font-medium text-slate-700 dark:text-slate-300">Bs {companyExpenses.ss.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Health Insurance ({(latestPayroll?.healthInsurance || 0.10) * 100}%)</span>
                                            <span className="font-medium text-slate-700 dark:text-slate-300">Bs {companyExpenses.health.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm pb-2 border-b border-dashed border-slate-200 dark:border-slate-700">
                                            <span className="text-slate-500">Labor Ministry</span>
                                            <span className="font-medium text-slate-700 dark:text-slate-300">Bs {companyExpenses.ministry}</span>
                                        </div>
                                        <div className="flex justify-between text-base font-bold">
                                            <span className="text-slate-800 dark:text-white">Total Monthly Cost</span>
                                            <span className="text-emerald-600 dark:text-emerald-400">Bs {currentMonthCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Historical Totals */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 flex flex-col justify-center space-y-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Invested to Date</label>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            Bs {totalHistoricalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg. Monthly Cost</label>
                                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mt-1">
                                            Bs {averageMonthlyCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Job & Organization */}
                <div className="space-y-8">
                    {/* 3. Job Details */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                            <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                            <h3 className="font-bold text-slate-900 dark:text-white">Job Details</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Position</label>
                                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{employee.jobTitle}</p>
                                <p className="text-sm text-slate-500">{employee.department}</p>
                            </div>

                            {/* Visual Org Chart */}
                            <div className="bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 p-4 relative">
                                <div className="absolute top-2 right-2 text-[10px] uppercase font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                                    You Are Here
                                </div>
                                <MiniOrgChart jobTitle={employee.jobTitle} />
                            </div>

                            {/* Link to Responsibilities */}
                            <Link
                                href="/dashboard/personal/flujogramas"
                                className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-slate-900 rounded-md shadow-sm">
                                        <Layers size={18} />
                                    </div>
                                    <div className="text-sm font-medium">
                                        View Responsibilities & Process Flow
                                    </div>
                                </div>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date Hired</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar size={16} className="text-slate-400" />
                                        <p className="text-slate-900 dark:text-white font-medium">
                                            {new Date(employee.hiredDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Base Salary</label>
                                    <p className="text-slate-900 dark:text-white font-medium mt-1">
                                        Bs {employee.baseSalary.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Horas cargadas total</label>
                                    <p className="text-slate-900 dark:text-white font-medium mt-1">
                                        {(employee as any).monthlyHours || 176} hrs
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Horas diarias (Promedio)</label>
                                    <p className="text-slate-900 dark:text-white font-medium mt-1">
                                        {(((employee as any).monthlyHours || 176) / 22).toFixed(1)} hrs/dia
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Documents */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                                <h3 className="font-bold text-slate-900 dark:text-white">My Documents & Flowcharts</h3>
                            </div>
                        </div>
                        <div className="p-0">
                            {employee.documents.length === 0 ? (
                                <div className="p-6 text-center text-slate-500 text-sm italic">
                                    No documents assigned to this employee.
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {employee.documents.map((doc) => (
                                        <li key={doc.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white text-sm">{doc.title}</p>
                                                    <p className="text-xs text-slate-500 capitalize">{doc.type}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                View
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
