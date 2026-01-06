'use client'

import { MoreHorizontal, Edit, Trash2, ArrowUpCircle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { deleteEmployee } from '@/app/actions/hr'

export function EmployeeMenu({ employeeId }: { employeeId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [menuRef])

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
            await deleteEmployee(employeeId)
        }
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.preventDefault(); // Prevent Link navigation from parent
                    setIsOpen(!isOpen)
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
                <MoreHorizontal size={20} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-8 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 z-50 py-1">
                    <Link
                        href={`/dashboard/personal/employee/${employeeId}/edit`}
                        className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        <Edit size={16} className="mr-2" />
                        Edit Details
                    </Link>
                    <Link
                        href={`/dashboard/personal/employee/${employeeId}/edit`}
                        className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        <ArrowUpCircle size={16} className="mr-2" />
                        Promote / Transfer
                    </Link>
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-left"
                    >
                        <Trash2 size={16} className="mr-2" />
                        Delete Employee
                    </button>
                </div>
            )}
        </div>
    )
}
