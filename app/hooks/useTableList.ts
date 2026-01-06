import { useState, useMemo } from 'react'

export interface SortConfig<T> {
    key: keyof T
    direction: 'asc' | 'desc'
}

export function useTableList<T extends Record<string, any>>(data: T[]) {
    const [searchTerm, setSearchTerm] = useState('')
    const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(null)
    const [filterDate, setFilterDate] = useState<{ month: number, year: number } | 'ALL'>('ALL')

    const filteredData = useMemo(() => {
        let processed = [...data]

        // 1. Date Filter
        if (filterDate !== 'ALL') {
            processed = processed.filter(item => {
                const d = new Date(item.date)
                // Adjust for month index (0-11) matching filter (1-12)
                return d.getMonth() + 1 === filterDate.month && d.getFullYear() === filterDate.year
            })
        }

        // 2. Search Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase()
            processed = processed.filter(item => {
                return Object.values(item).some(val =>
                    String(val).toLowerCase().includes(lowerTerm)
                )
            })
        }

        // 3. Sorting
        if (sortConfig) {
            processed.sort((a, b) => {
                const aVal = a[sortConfig.key]
                const bVal = b[sortConfig.key]

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
        } else {
            // Default sort by date desc
            processed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        }

        return processed
    }, [data, searchTerm, sortConfig, filterDate])

    const requestSort = (key: keyof T) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    // 4. Extract Available Months for Filter
    const availableMonths = useMemo(() => {
        const uniqueDates = new Set<string>()
        data.forEach(item => {
            const d = new Date(item.date)
            // Use format "M-YYYY" for unique key
            uniqueDates.add(`${d.getMonth() + 1}-${d.getFullYear()}`)
        })

        // Convert back to object and sort descending
        return Array.from(uniqueDates).map(str => {
            const [month, year] = str.split('-').map(Number)
            return { month, year }
        }).sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year
            return b.month - a.month
        })
    }, [data])

    return {
        searchTerm,
        setSearchTerm,
        sortConfig,
        requestSort,
        filterDate,
        setFilterDate,
        filteredData,
        availableMonths
    }
}
