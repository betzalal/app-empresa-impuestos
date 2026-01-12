
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Copy, Calendar, DollarSign, User, Trash2, X, Lock, Archive, CheckCircle, Mail, Phone, MapPin, FileText, Download, Upload } from 'lucide-react'
import Link from 'next/link'
import PayrollBreakdown from './PayrollBreakdown'
import PayrollProofsModal from './PayrollProofsModal'
import { createPortal } from 'react-dom'
import { deletePayroll, archiveEmployee, deleteEmployeeSecure } from '@/app/actions/hr'
import { useRouter } from 'next/navigation'

interface Employee {
    id: string
    firstName: string
    lastName: string
    jobTitle: string
    hiredDate: Date
    status: string
    email?: string | null
    phone?: string | null
    address?: string | null
    image?: string | null
    documentId?: string
    payrolls: any[] // Required for mapping
    documents?: any[]
    jobPosition?: any
}

interface PayrollListProps {
    employees: Employee[]
}

export default function PayrollList({ employees }: PayrollListProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'Active' | 'Archived'>('Active')

    // Filter employees by status
    const activeEmployees = employees.filter(e => !e.status || e.status === 'Active')
    const archivedEmployees = employees.filter(e => e.status === 'Archived')

    const hasAnyPayrolls = employees.some(e => e.payrolls.length > 0)
    const hasArchived = archivedEmployees.length > 0

    if (!hasAnyPayrolls && !hasArchived) {
        return (
            <div className="p-12 text-center text-slate-500 italic bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                No payroll records found. Click "Nueva Nómina" to create the first payment.
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* TABS (Only if archived exists) */}
            {hasArchived && (
                <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('Active')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'Active'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Active Personnel ({activeEmployees.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('Archived')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'Archived'
                            ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Archived / History ({archivedEmployees.length})
                    </button>
                </div>
            )}

            {/* LIST */}
            <div className="space-y-4">
                {(activeTab === 'Active' ? activeEmployees : archivedEmployees).map((employee) => {
                    // Get latest payroll
                    const latestPayroll = employee.payrolls[0] || { baseSalary: 0, socialSecurity: 0, healthInsurance: 0, laborMinistry: 0, otherDeductions: 0 }
                    const firstPayroll = employee.payrolls[employee.payrolls.length - 1] || latestPayroll

                    // Calculate ranges
                    const startDate = new Date(firstPayroll.year, firstPayroll.month - 1)
                    const lastPaymentDate = new Date(latestPayroll.year, latestPayroll.month - 1)

                    // Contributions
                    const ssRate = latestPayroll.socialSecurity > 1 ? latestPayroll.socialSecurity / 100 : latestPayroll.socialSecurity
                    const hiRate = latestPayroll.healthInsurance > 1 ? latestPayroll.healthInsurance / 100 : latestPayroll.healthInsurance
                    const latestContributions =
                        (latestPayroll.baseSalary * ssRate) +
                        (latestPayroll.baseSalary * hiRate) +
                        latestPayroll.laborMinistry +
                        latestPayroll.otherDeductions

                    return (
                        <PayrollGroupRow
                            key={employee.id}
                            employee={employee}
                            latestPayroll={latestPayroll}
                            latestContributions={latestContributions}
                            periodStart={startDate}
                            periodEnd={lastPaymentDate}
                            isArchived={activeTab === 'Archived'}
                        />
                    )
                })}
            </div>

            {activeTab === 'Active' && activeEmployees.length === 0 && (
                <div className="p-8 text-center text-slate-500 italic">No active employees with payroll history.</div>
            )}
        </div>
    )
}

function PayrollGroupRow({ employee, latestPayroll, latestContributions, periodStart, periodEnd, isArchived }: any) {
    const [isExpanded, setIsExpanded] = useState(false)
    const router = useRouter()

    // Delete/Action Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [targetId, setTargetId] = useState<string | null>(null)
    const [actionType, setActionType] = useState<'deletePayroll' | 'deleteEmployee' | null>(null)
    const [password, setPassword] = useState('')
    const [deleteError, setDeleteError] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    // Backup & Force Delete State
    const [showBackupStep, setShowBackupStep] = useState(false)
    const [overrideCode, setOverrideCode] = useState('')

    // Proofs Modal State
    const [isProofsModalOpen, setIsProofsModalOpen] = useState(false)
    const [selectedProofPayrollId, setSelectedProofPayrollId] = useState<string | null>(null)

    // Archive State
    const [isArchiveing, setIsArchiveing] = useState(false)

    const handleOpenProofs = (payroll: any) => {
        setSelectedProofPayrollId(payroll.id)
        setIsProofsModalOpen(true)
    }

    // Derived State for Modal (Always fresh)
    const payrollForModal = selectedProofPayrollId
        ? employee.payrolls.find((p: any) => p.id === selectedProofPayrollId)
        : null

    // Formatter
    const currency = (val: number) => `Bs ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })} `
    const dateStr = (date: Date) => date ? new Date(date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : '-'
    const monthStr = (m: number, y: number) => {
        if (m === 13) return `Aguinaldo ${y}`
        return new Date(y, m - 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' })
    }
    const fullDate = (date: Date) => date ? new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'

    const handleDeletePayroll = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setTargetId(id)
        setActionType('deletePayroll')
        setIsDeleteModalOpen(true)
        setDeleteError('')
        setPassword('')
    }

    const handleDeleteEmployee = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setTargetId(id)
        setActionType('deleteEmployee')
        setIsDeleteModalOpen(true)
        setDeleteError('')
        setPassword('')
    }

    const handleArchiveClick = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm(`Are you sure you want to archive ${employee.firstName}? This will remove them from the active list but keep their history.`)) return

        setIsArchiveing(true)
        await archiveEmployee(employee.id)
        setIsArchiveing(false)
        router.refresh()
    }

    const confirmSecureAction = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!targetId || !actionType) return

        setIsProcessing(true)
        setDeleteError('')
        setOverrideCode('')
        setShowBackupStep(false)

        try {
            let res;
            if (actionType === 'deletePayroll') {
                res = await deletePayroll(targetId, password)
            } else {
                // Pass overrideCode if we are in backup step
                res = await deleteEmployeeSecure(targetId, password, showBackupStep ? overrideCode : undefined)
            }

            if (res.success) {
                setIsDeleteModalOpen(false)
                setTargetId(null)
                setActionType(null)
                setShowBackupStep(false)
                router.refresh()
            } else {
                if (res.message === 'RESTRICTED') {
                    setShowBackupStep(true)
                    setDeleteError('Security Alert: Financial Records Found.')
                } else {
                    setDeleteError(res.message || 'Error executing action')
                }
            }
        } catch (error) {
            setDeleteError('An unexpected error occurred')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-xl border overflow-hidden shadow-sm transition-all ${isArchived ? 'border-orange-200 dark:border-orange-900/30 bg-orange-50/10' : 'border-slate-200 dark:border-slate-800'}`}>
            {/* Header Row (Summary) */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative group"
            >
                <div className="mr-4 text-slate-400">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>

                {/* Employee Info */}
                <div className="flex-1 min-w-[200px] flex items-center gap-3">
                    {employee.image ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                            {/* Use img tag for simplicity with user-uploaded content in public/uploads */}
                            <img src={employee.image} alt={employee.firstName} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <User className="w-5 h-5" />
                        </div>
                    )}
                    <div>
                        <h3 className={`font-bold text-lg ${isArchived ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                            {employee.firstName} {employee.lastName}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{employee.jobTitle}</span>
                            {isArchived && <span className="bg-orange-100 text-orange-600 px-1.5 rounded">Archived</span>}
                        </div>
                    </div>
                </div>

                {/* Period */}
                <div className="hidden md:block w-48 px-4 text-center border-l border-slate-100 dark:border-slate-800">
                    <p className="text-xs uppercase font-bold text-slate-400 mb-1">Period (Active)</p>
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <Calendar className="w-3 h-3" />
                        {latestPayroll.month ? `${dateStr(periodStart)} - ${dateStr(periodEnd)}` : 'No Records'}
                    </div>
                </div>

                {/* Status / Actions Helper - Only show on hover for Active */}
                <div className="w-32 px-4 text-center border-l border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2">
                    {!isArchived ? (
                        <div className="flex items-center gap-2">
                            <div className={`hidden ${isExpanded ? 'flex' : 'group-hover:flex'} items-center gap-1 animate-in fade-in duration-200`}>
                                <button
                                    onClick={handleArchiveClick}
                                    title="Archive Employee (Save History)"
                                    disabled={isArchiveing}
                                    className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                    <Archive className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => handleDeleteEmployee(employee.id, e)}
                                    title="Delete Employee Permanently"
                                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => handleDeleteEmployee(employee.id, e)}
                                title="Delete Archived Employee"
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 animate-in slide-in-from-top-2 duration-200">

                    {/* ARCHIVED PROFILE VIEW */}
                    {isArchived && (
                        <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl p-6 border border-orange-100 dark:border-orange-900/20 shadow-sm flex flex-col lg:flex-row gap-8">
                            {/* Left: Info */}
                            <div className="flex-1 space-y-4">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                    <User className="w-4 h-4 text-orange-500" /> Employee Profile
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                    <div className="col-span-2">
                                        <span className="block text-xs font-medium text-slate-400 uppercase">Last Job Position</span>
                                        <div className="font-semibold text-slate-800 dark:text-slate-200">{employee.jobTitle}</div>
                                    </div>

                                    <div>
                                        <span className="block text-xs font-medium text-slate-400">Email</span>
                                        <div className="text-slate-600 dark:text-slate-300">{employee.email || '-'}</div>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-medium text-slate-400">Phone</span>
                                        <div className="text-slate-600 dark:text-slate-300">{employee.phone || '-'}</div>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-medium text-slate-400">Address</span>
                                        <div className="text-slate-600 dark:text-slate-300">{employee.address || '-'}</div>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-medium text-slate-400">Hired Date</span>
                                        <div className="text-slate-600 dark:text-slate-300">{fullDate(employee.hiredDate)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Middle: Financial Summary (Totals) */}
                            <div className="flex-1 space-y-4 border-l border-slate-100 dark:border-slate-700 pl-0 lg:pl-8">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                    <DollarSign className="w-4 h-4 text-emerald-500" /> Financial Summary
                                </h4>
                                {(() => {
                                    // Calculate Totals on the fly
                                    const totals = employee.payrolls.reduce((acc: any, p: any) => {
                                        const ssRate = p.socialSecurity > 1 ? p.socialSecurity / 100 : p.socialSecurity
                                        const hiRate = p.healthInsurance > 1 ? p.healthInsurance / 100 : p.healthInsurance
                                        const contrib = (p.baseSalary * ssRate) + (p.baseSalary * hiRate) + p.laborMinistry + p.otherDeductions

                                        return {
                                            paid: acc.paid + p.baseSalary + (p.bonuses || 0),
                                            contrib: acc.contrib + contrib
                                        }
                                    }, { paid: 0, contrib: 0 })

                                    return (
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                                                <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Total Paid to Employee</span>
                                                <div className="text-2xl font-mono font-bold text-emerald-700 dark:text-emerald-300">{currency(totals.paid)}</div>
                                                <div className="text-xs text-emerald-600/70">Base Salary + Bonuses</div>
                                            </div>
                                            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/20">
                                                <span className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">Total Contributions</span>
                                                <div className="text-2xl font-mono font-bold text-indigo-700 dark:text-indigo-300">{currency(totals.contrib)}</div>
                                                <div className="text-xs text-indigo-600/70">Taxes, Insurance, etc.</div>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>

                            {/* Right: Docs */}
                            <div className="lg:w-1/4 border-l border-slate-100 dark:border-slate-700 pl-0 lg:pl-8">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                    <FileText className="w-4 h-4 text-blue-500" /> Documents
                                </h4>
                                {employee.documents && employee.documents.length > 0 ? (
                                    <ul className="space-y-3 pt-2">
                                        {employee.documents.map((doc: any) => (
                                            <li key={doc.id} className="text-sm group bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="flex-1 font-medium text-slate-700 dark:text-slate-200 truncate pr-2" title={doc.title}>
                                                        {doc.title}
                                                    </span>
                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 p-0.5 hover:bg-blue-50 rounded">
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                </div>
                                                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-md">
                                                    {doc.type}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-slate-400 italic">No attached documents.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PAYROLL TABLE */}
                    <div className="bg-white dark:bg-slate-800/50 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 overflow-x-auto">
                        {isArchived && (
                            <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payroll History</h4>
                            </div>
                        )}
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase font-medium border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    <th className="px-4 py-2">Month</th>
                                    <th className="px-4 py-2 text-right">Base Salary</th>
                                    <th className="px-4 py-2 text-right">Bonuses</th>
                                    <th className="px-4 py-2 text-right">Contributions</th>
                                    <th className="px-4 py-2 text-right">Total Co. Cost</th>
                                    <th className="px-4 py-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {employee.payrolls.map((payroll: any) => {
                                    // Calculate Row Data
                                    const ssRate = payroll.socialSecurity > 1 ? payroll.socialSecurity / 100 : payroll.socialSecurity
                                    const hiRate = payroll.healthInsurance > 1 ? payroll.healthInsurance / 100 : payroll.healthInsurance

                                    const contributions =
                                        (payroll.baseSalary * ssRate) +
                                        (payroll.baseSalary * hiRate) +
                                        payroll.laborMinistry +
                                        payroll.otherDeductions

                                    const totalCost = payroll.baseSalary + payroll.bonuses + contributions

                                    return (
                                        <tr key={payroll.id} className="hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                                {monthStr(payroll.month, payroll.year)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                                                {currency(payroll.baseSalary)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-emerald-600 font-mono">
                                                {payroll.bonuses > 0 ? `+ ${currency(payroll.bonuses)} ` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {/* BREAKDOWN MODAL COMPONENT */}
                                                <PayrollBreakdown
                                                    baseSalary={payroll.baseSalary}
                                                    bonuses={payroll.bonuses}
                                                    socialSecurity={payroll.socialSecurity}
                                                    healthInsurance={payroll.healthInsurance}
                                                    laborMinistry={payroll.laborMinistry}
                                                    otherDeductions={payroll.otherDeductions}
                                                    otherReason={payroll.otherReason}
                                                    totalContributions={contributions}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                                                {currency(totalCost)}
                                            </td>
                                            <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                                                {!isArchived && (
                                                    <Link
                                                        href={`/dashboard/personal/payroll/new?copyId=${payroll.id}`}
                                                        title="Duplicate Payroll"
                                                        className="inline-flex p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </Link>
                                                )}

                                                {/* PROOFS BUTTON */}
                                                <button
                                                    onClick={() => handleOpenProofs(payroll)}
                                                    title="View/Upload Payment Proofs"
                                                    className="inline-flex p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={(e) => handleDeletePayroll(payroll.id, e)}
                                                    title="Delete Payroll Record"
                                                    className="inline-flex p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PAYMENT PROOFS MODAL */}
            {payrollForModal && (
                <PayrollProofsModal
                    payroll={payrollForModal}
                    isOpen={isProofsModalOpen}
                    onClose={() => {
                        setIsProofsModalOpen(false)
                        setSelectedProofPayrollId(null)
                    }}
                />
            )}

            {/* SECURE ACTION MODAL (Portal) */}
            {isDeleteModalOpen && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Lock className="w-5 h-5 text-red-500" />
                                {showBackupStep ? 'Security Override' : 'Confirm Action'}
                            </h2>
                            <button onClick={() => setIsDeleteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {!showBackupStep ? (
                            <>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                                    {actionType === 'deleteEmployee'
                                        ? 'Are you sure you want to PERMANENTLY delete this employee and ALL their history? This cannot be undone.'
                                        : 'Are you sure you want to delete this payroll record?'}
                                </p>

                                <form onSubmit={confirmSecureAction} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>

                                    {deleteError && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-lg">
                                            {deleteError}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsDeleteModalOpen(false)}
                                            className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isProcessing || !password}
                                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium shadow-lg shadow-red-500/20 disabled:opacity-50 transition-colors"
                                        >
                                            {isProcessing ? 'Verifying...' : 'Confirm Delete'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            /* BACKUP & FORCE DELETE FLOW */
                            <div className="space-y-4">
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30 text-sm text-red-800 dark:text-red-300">
                                    <strong>Alert:</strong> RESTRICTED DATA FOUND.
                                    <p className="mt-1">This employee has linked financial records. To delete, you MUST download a backup first.</p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <a
                                        href={`/api/backup-employee/${targetId}`}
                                        target="_blank"
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold shadow-md transition-colors"
                                    >
                                        <Download className="w-5 h-5" /> Download Full Backup (ZIP)
                                    </a>
                                </div>

                                <div className="border-t border-slate-200 dark:border-slate-800 my-4 pt-4">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Force Delete Code
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-2 text-center text-lg font-mono tracking-widest rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-transparent outline-none focus:border-red-500 transition-colors"
                                        placeholder="000000"
                                        value={overrideCode}
                                        onChange={(e) => setOverrideCode(e.target.value)}
                                    />
                                    <p className="text-xs text-center text-slate-400 mt-2">Enter code '196723' to confirm permanent deletion.</p>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmSecureAction}
                                        disabled={isProcessing || overrideCode !== '196723'}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isProcessing ? 'DELETING...' : 'FORCE DELETE'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
