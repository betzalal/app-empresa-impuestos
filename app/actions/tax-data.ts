'use server'

import prisma from '@/lib/prisma'
import { verifySession } from './company'

// ... existing code ...

export async function getMonthlyTotals(month: number, year: number) {
    try {
        // Construct dates in UTC to ensure consistent 00:00:00 start across calculations
        // Month is 0-indexed in Date constructor, so month-1 gives us the correct month
        // Day 1 is the first day of the month
        const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))

        // For end date, we go to the first day of the NEXT month, and use 'lt' (less than)
        // This ensures we capture everything up to the very last millisecond of the current month
        const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))

        const session = await verifySession()
        if (!session.companyId) {
            return { success: false, salesTotal: 0, purchasesTotal: 0, purchasesGross: 0 }
        }

        const sales = await prisma.sale.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                date: {
                    gte: startDate,
                    lt: endDate, // Changed from lte to lt to avoid overlap if endDate was next month 00:00:00
                },
                companyId: session.companyId
            }
        })

        const purchases = await prisma.purchase.aggregate({
            _sum: {
                amount: true, // Total amount
                importBaseCF: true // Use base CF for calculation if available
            },
            where: {
                date: {
                    gte: startDate,
                    lt: endDate,
                },
                companyId: session.companyId
            }
        })

        // Purchases for tax credit usually use the Base CF amount (Row S).
        // If importBaseCF is 0 or null, logic might fall back, but we stored it.
        // However, the aggregate might return null if no records.

        return {
            success: true,
            salesTotal: sales._sum.amount || 0,
            purchasesTotal: purchases._sum.importBaseCF || 0, // IMPORTANT: Use Base CF for tax credit
            purchasesGross: purchases._sum.amount || 0
        }
    } catch (error) {
        console.error('Error getting monthly totals:', error)
        return { success: false, salesTotal: 0, purchasesTotal: 0, purchasesGross: 0 }
    }
}

export async function getTaxParameters(month: number, year: number) {
    try {
        const session = await verifySession()
        if (!session.companyId) {
            return { success: false, data: null }
        }

        // Prisma automatically names the compound unique index arg based on fields
        // Since we changed it to @@unique([month, year, companyId]), the key is likely month_year_companyId
        const params = await prisma.taxParameter.findUnique({
            where: {
                month_year_companyId: {
                    month,
                    year,
                    companyId: session.companyId
                }
            }
        })
        return { success: true, data: params }
    } catch (error) {
        console.error('Error getting tax parameters:', error)
        return { success: false, data: null }
    }
}

export async function getPreviousMonthEndingBalances(currentMonth: number, currentYear: number) {
    try {
        let prevMonth = currentMonth - 1
        let prevYear = currentYear
        if (prevMonth === 0) {
            prevMonth = 12
            prevYear = currentYear - 1
        }

        const session = await verifySession()
        if (!session.companyId) {
            return { success: false, balanceCFEnd: 0, balanceIUEEnd: 0 }
        }

        const params = await prisma.taxParameter.findUnique({
            where: {
                month_year_companyId: {
                    month: prevMonth,
                    year: prevYear,
                    companyId: session.companyId
                }
            }
        })

        if (params) {
            return {
                success: true,
                balanceCFEnd: params.balanceCFEnd || 0,
                balanceIUEEnd: params.balanceIUEEnd || 0
            }
        }
        return { success: false, balanceCFEnd: 0, balanceIUEEnd: 0 as number } // Type assertion if needed
    } catch (error) {
        console.error('Error getting previous balances:', error)
        return { success: false, balanceCFEnd: 0, balanceIUEEnd: 0 }
    }
}

export async function saveTaxParameters(data: {
    month: number,
    year: number,
    ufvStart: number,
    ufvEnd: number,
    previousBalanceCF: number,
    previousBalanceIUE: number,
    balanceCFEnd: number,
    balanceIUEEnd: number
}) {
    try {
        const session = await verifySession()
        if (!session.companyId) {
            return { success: false, message: 'La sesión no está vinculada a una empresa.' }
        }

        await prisma.taxParameter.upsert({
            where: {
                month_year_companyId: {
                    month: data.month,
                    year: data.year,
                    companyId: session.companyId
                }
            },
            update: {
                ufvStart: data.ufvStart,
                ufvEnd: data.ufvEnd,
                previousBalanceCF: data.previousBalanceCF,
                previousBalanceIUE: data.previousBalanceIUE,
                balanceCFEnd: data.balanceCFEnd,
                balanceIUEEnd: data.balanceIUEEnd
            },
            create: {
                month: data.month,
                year: data.year,
                ufvStart: data.ufvStart,
                ufvEnd: data.ufvEnd,
                previousBalanceCF: data.previousBalanceCF,
                previousBalanceIUE: data.previousBalanceIUE,
                balanceCFEnd: data.balanceCFEnd,
                balanceIUEEnd: data.balanceIUEEnd,
                companyId: session.companyId
            }
        })
        return { success: true, message: 'Parámetros guardados correctamente' }
    } catch (error) {
        console.error('Error saving tax parameters:', error)
        return { success: false, message: 'Error al guardar parámetros' }
    }
}
