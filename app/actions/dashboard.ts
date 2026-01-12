'use server'

import prisma from '@/lib/prisma'
import { getMonthlyTotals, getTaxParameters } from './tax-data'
import { calculateTaxes } from '@/lib/tax-engine'
import { verifySession } from './company'

/**
 * Returns summary for the requested month (or PREVIOUS month by default if not specified).
 * Defaulting to previous month because taxes are paid in arrears.
 */
export async function getDashboardSummary(month?: number, year?: number) {
    const today = new Date()
    // If no params, use previous month (e.g., in Jan 2026, default to Dec 2025)
    // new Date(y, m-1) -> month is 0-indexed in JS Date
    const targetDate = (month && year)
        ? new Date(year, month - 1, 1)
        : new Date(today.getFullYear(), today.getMonth() - 1, 1)

    const targetMonth = targetDate.getMonth() + 1
    const targetYear = targetDate.getFullYear()

    // 1. Get Totals
    const totals = await getMonthlyTotals(targetMonth, targetYear)

    // 2. Try to get parameters for accurate calculation, else defaults
    const paramsRes = await getTaxParameters(targetMonth, targetYear)
    const prevBalanceCF = paramsRes.data?.previousBalanceCF || 0
    const prevBalanceIUE = paramsRes.data?.previousBalanceIUE || 0
    const ufvStart = paramsRes.data?.ufvStart || 2.0
    const ufvEnd = paramsRes.data?.ufvEnd || 2.0

    // 3. Calculate Taxes
    const result = calculateTaxes({
        salesTotal: totals.salesTotal,
        purchasesTotal: totals.purchasesTotal,
        ufvStart,
        ufvEnd,
        prevBalanceCF,
        prevBalanceIUE
    })

    return {
        month: targetMonth,
        year: targetYear,
        totals,
        taxes: result
    }
}

/**
 * Returns Top 5 Purchases for the last 12 months from the selected date.
 */
export async function getTopPurchases(year?: number) {
    try {
        const targetYear = year || new Date().getFullYear()

        // Use UTC-based boundaries to ensure we cover the full day in any timezone
        const startDate = new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0))
        const endDate = new Date(Date.UTC(targetYear + 1, 0, 1, 0, 0, 0))

        const session = await verifySession()

        const topPurchases = await prisma.purchase.findMany({
            take: 5,
            orderBy: { amount: 'desc' },
            where: {
                companyId: session.companyId,
                date: {
                    gte: startDate,
                    lt: endDate
                }
            }
        })

        // Calculate total for percentage
        const totalRaw = await prisma.purchase.aggregate({
            _sum: { amount: true },
            where: {
                companyId: session.companyId,
                date: {
                    gte: startDate,
                    lt: endDate
                }
            }
        })
        const total = totalRaw._sum.amount || 1

        return topPurchases.map(p => ({
            ...p,
            percentage: ((p.amount / total) * 100).toFixed(1)
        }))
    } catch (e) {
        return []
    }
}

/**
 * Returns Accumulated IUE for the selected year.
 */

/**
 * Returns annual analytics for charts (Jan-Dec) for the specified year.
 */
// Helper to simplify Tax Calculation logic
export async function getAnnualAnalytics(year: number) {
    // Ideally we fetch all params for the year. For now, let's assume standard defaults if not set.
    // Or simpler: We actually need to calculate monthly taxes properly.
    // If we want to optimize, we should fetch ALL tax params for the year in one go.
    // However, `getTaxParameters` is per month.
    // A middle ground optimization: Parallelize the `getDashboardSummary` calls is already done via `Promise.all`.
    // The previous implementation WAS using Promise.all, which is decent.
    // But we can go faster if we don't query totals 12 times.

    // 1. Fetch ALL totals for the year (Sales & Purchases per month)
    const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0))
    const endDate = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0))

    const session = await verifySession()

    const allSales = await prisma.sale.findMany({
        where: {
            companyId: session.companyId,
            date: { gte: startDate, lt: endDate }
        },
        select: { date: true, amount: true }
    })
    const allPurchases = await prisma.purchase.findMany({
        where: {
            companyId: session.companyId,
            date: { gte: startDate, lt: endDate }
        },
        select: { date: true, importBaseCF: true }
    })

    const monthlyTotals: Record<number, { sales: number, purchases: number }> = {}
    for (let i = 1; i <= 12; i++) monthlyTotals[i] = { sales: 0, purchases: 0 }

    allSales.forEach(s => { const m = s.date.getMonth() + 1; monthlyTotals[m].sales += s.amount })
    allPurchases.forEach(p => { const m = p.date.getMonth() + 1; monthlyTotals[m].purchases += (p.importBaseCF || 0) })

    // 2. Fetch ALL Tax Params for the year
    const allParams = await prisma.taxParameter.findMany({
        where: {
            year,
            companyId: session.companyId
        }
    })
    const paramsMap = new Map()
    allParams.forEach((p: any) => paramsMap.set(p.month, p))

    // 3. Compute Monthly Taxes in memory
    const results = []
    const months = Array.from({ length: 12 }, (_, i) => i + 1)

    // Parallel processing is not needed for calculation if data is in memory
    for (const month of months) {
        const totals = monthlyTotals[month]
        const params = paramsMap.get(month)

        const ufvStart = params?.ufvStart || 2.0
        const ufvEnd = params?.ufvEnd || 2.0
        const prevBalanceCF = params?.previousBalanceCF || 0
        const prevBalanceIUE = params?.previousBalanceIUE || 0

        const taxRes = calculateTaxes({
            salesTotal: totals.sales,
            purchasesTotal: totals.purchases,
            ufvStart,
            ufvEnd,
            prevBalanceCF,
            prevBalanceIUE
        })

        results.push({
            name: new Date(year, month - 1).toLocaleString('es-BO', { month: 'short' }),
            month,
            sales: totals.sales,
            purchases: totals.purchases,
            ivaToPay: taxRes.iva.pay,
            itToPay: taxRes.it.pay,
            iueEstimated: 0, // Placeholder
            totalTax: taxRes.iva.pay + taxRes.it.pay
        })
    }

    // Calculate Annual Totals for IUE (Annual Corporate Tax)
    const totalYearSales = results.reduce((acc, curr) => acc + curr.sales, 0)
    const totalYearPurchases = results.reduce((acc, curr) => acc + curr.purchases, 0)
    const annualNetProfit = Math.max(0, totalYearSales - totalYearPurchases)
    const annualIUE = annualNetProfit * 0.25

    return results.map(r => {
        const isDecember = r.month === 12
        const iue = isDecember ? annualIUE : 0
        return {
            ...r,
            iueEstimated: iue,
            totalTax: r.ivaToPay + r.itToPay + iue
        }
    })
}

/**
 * Returns a matrix of monthly data for the selected year.
 */
export async function getMonthlyMatrix(year?: number) {
    const targetYear = year || new Date().getFullYear()

    // Optimization: Fetch all monthly totals for the year in efficient queries
    const startDate = new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0))
    const endDate = new Date(Date.UTC(targetYear + 1, 0, 1, 0, 0, 0))

    const session = await verifySession()

    // Group Sales by Month (using a raw query might be cleaner for month extraction, 
    // but Prisma groupBy usually requires a Date field. 
    // Since 'date' is a DateTime, groupBy returns exact timestamps.
    // We'll fetch all simplified records or use raw query if supported.
    // simpler approach: Fetch all records with 'amount' and 'date' to minimal payload and aggregate in JS
    // This avoids N+1 and is faster than 12 queries.

    // 1. Fetch Sales
    const allSales = await prisma.sale.findMany({
        where: {
            companyId: session.companyId,
            date: { gte: startDate, lt: endDate }
        },
        select: { date: true, amount: true }
    })

    // 2. Fetch Purchases
    const allPurchases = await prisma.purchase.findMany({
        where: {
            companyId: session.companyId,
            date: { gte: startDate, lt: endDate }
        },
        select: { date: true, importBaseCF: true }
    })

    // 3. Aggregate
    const monthlyData: Record<number, { sales: number, purchases: number }> = {}

    // Initialize map
    for (let i = 1; i <= 12; i++) monthlyData[i] = { sales: 0, purchases: 0 }

    allSales.forEach(s => {
        const m = s.date.getMonth() + 1 // UTC? Prisma dates are typically UTC.
        // Be careful with timezones. getMonth() uses local unless we set environment.
        // Assuming dates are stored correctly. We'll use the date object directly.
        if (monthlyData[m]) monthlyData[m].sales += s.amount
    })

    allPurchases.forEach(p => {
        const m = p.date.getMonth() + 1
        if (monthlyData[m]) monthlyData[m].purchases += (p.importBaseCF || 0)
    })

    const matrix = []
    for (let m = 1; m <= 12; m++) {
        if (monthlyData[m].sales > 0 || monthlyData[m].purchases > 0) {
            matrix.push({
                month: m,
                sales: monthlyData[m].sales,
                purchases: monthlyData[m].purchases
            })
        }
    }

    return matrix.sort((a, b) => b.month - a.month)
}

/**
 * Mock data for last payments (since we don't store "payments" yet, just calc results).
 */
export async function getLastPayments() {
    return [
        { month: 'Noviembre', amount: 4500, status: 'Pagado' },
        { month: 'Octubre', amount: 3200, status: 'Pagado' },
        { month: 'Septiembre', amount: 2100, status: 'Pendiente' },
    ]
}
