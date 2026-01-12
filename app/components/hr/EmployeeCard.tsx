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
        <div className="relative bg-[var(--bg-card)] rounded-2xl p-5 shadow-sm border border-[var(--border-color)] flex flex-col items-center text-center transition-all hover:shadow-md group">

            {/* Clickable Overlay for Navigation */}
            <Link href={`/dashboard/personal/employee/${employee.id}`} className="absolute inset-0 z-0" />

            <div className="relative w-full flex justify-end z-10">
                <EmployeeMenu employeeId={employee.id} />
            </div>

            <div className="relative mb-3">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-[var(--bg-secondary)] border-2 border-[var(--bg-card)] shadow-sm relative">
                    {employee.image ? (
                        <Image
                            src={employee.image}
                            alt={`${employee.firstName} ${employee.lastName}`}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)] text-xl font-bold">
                            {employee.firstName[0]}{employee.lastName[0]}
                        </div>
                    )}
                </div>
                {/* Status Dot */}
                <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[var(--bg-card)]"></div>
            </div>

            <h3 className="text-base font-bold text-[var(--text-primary)] mb-0.5">
                {employee.firstName} {employee.lastName}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4 font-medium opacity-80">
                {employee.jobTitle}
            </p>

            <div className="w-full grid grid-cols-2 gap-4 border-t border-[var(--border-color)] pt-4 mb-4">
                <div className="text-left">
                    <p className="text-[10px] text-[var(--text-secondary)] mb-0.5 opacity-60">Department</p>
                    <p className="text-xs font-semibold text-[var(--text-primary)] opacity-80">{employee.department}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-[var(--text-secondary)] mb-0.5 opacity-60">Hired Date</p>
                    <p className="text-xs font-semibold text-[var(--text-primary)] opacity-80">
                        {new Date(employee.hiredDate).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div className="w-full space-y-2">
                <div className="flex items-center text-xs text-[var(--text-secondary)] opacity-80">
                    <Mail size={14} className="mr-3 opacity-50" />
                    <span className="truncate">{employee.email || 'No email'}</span>
                </div>
                <div className="flex items-center text-xs text-[var(--text-secondary)] opacity-80">
                    <Phone size={14} className="mr-3 opacity-50" />
                    <span>{employee.phone || 'No phone'}</span>
                </div>
            </div>
        </div>
    )
}
