import { MoreHorizontal, Mail, Phone, Calendar, Briefcase, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { EmployeeMenu } from './EmployeeMenu'

interface Employee {
    id: string
    firstName: string
    lastName: string
    jobTitle: string
    department: string
    image?: string | null
    email?: string | null
    phone?: string | null
    hiredDate: Date
    store?: string | null
}

export function EmployeeCard({ employee }: { employee: Employee }) {
    // We wrap the CONTENT in a Link, but position the Menu absolutely on top so it handles its own clicks
    return (
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center transition-all hover:shadow-md group">

            {/* Clickable Overlay for Navigation */}
            <Link href={`/dashboard/personal/employee/${employee.id}`} className="absolute inset-0 z-0" />

            <div className="relative w-full flex justify-end z-10">
                <EmployeeMenu employeeId={employee.id} />
            </div>

            <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-950 shadow-sm relative">
                    {employee.image ? (
                        <Image
                            src={employee.image}
                            alt={`${employee.firstName} ${employee.lastName}`}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-bold">
                            {employee.firstName[0]}{employee.lastName[0]}
                        </div>
                    )}
                </div>
                {/* Status Dot */}
                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                {employee.firstName} {employee.lastName}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
                {employee.jobTitle}
            </p>

            <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-6 mb-6">
                <div className="text-left">
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Department</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{employee.department}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Hired Date</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {new Date(employee.hiredDate).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div className="w-full space-y-3">
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <Mail size={16} className="mr-3 text-slate-400" />
                    <span className="truncate">{employee.email || 'No email'}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <Phone size={16} className="mr-3 text-slate-400" />
                    <span>{employee.phone || 'No phone'}</span>
                </div>
            </div>
        </div>
    )
}
