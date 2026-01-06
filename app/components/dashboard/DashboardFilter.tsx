'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export function DashboardFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Default to previous month if not set, or current if manually set
    // Actually, logic is better handled by reading current or default
    // We'll just show what's selected or default to "today" for the dropdown state
    // But the server does the "previous month" default logic if param is missing.

    // Let's rely on params. If empty, UI shows "Default" (which is effectively Prev Month)
    // Or we can force set it. Let's simpler: UI reflects params or defaults to "Dec 2025" if empty logic in server.

    // Better experience:
    // If params empty -> Server renders Dec 2025.
    // Client should show Dec 2025.

    const today = new Date()
    // Default logic matches server: previous month
    const defaults = new Date(today.getFullYear(), today.getMonth() - 1, 1)

    const yearParam = searchParams.get('year')
    const monthParam = searchParams.get('month')

    const currentYear = yearParam ? parseInt(yearParam) : defaults.getFullYear()
    const currentMonth = monthParam ? parseInt(monthParam) : defaults.getMonth() + 1

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set(name, value)
            return params.toString()
        },
        [searchParams]
    )

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        router.push('?' + createQueryString('year', e.target.value))
    }

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        router.push('?' + createQueryString('month', e.target.value))
    }

    return (
        <div className="flex space-x-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <select
                value={currentMonth}
                onChange={handleMonthChange}
                className="bg-transparent text-sm font-semibold text-gray-700 py-1 pl-2 pr-6 border-none focus:ring-0 focus:outline-none cursor-pointer"
            >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>
                        {new Date(2000, m - 1, 1).toLocaleDateString('es-BO', { month: 'long' })}
                    </option>
                ))}
            </select>
            <div className="w-px bg-gray-200 my-1"></div>
            <select
                value={currentYear}
                onChange={handleYearChange}
                className="bg-transparent text-sm font-semibold text-gray-700 py-1 pl-2 pr-6 border-none focus:ring-0 focus:outline-none cursor-pointer"
            >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
            </select>
        </div>
    )
}
