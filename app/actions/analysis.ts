'use server'

import prisma from '@/lib/prisma'
import { getCurrentUser } from './user'

export async function getGeneralStats(year: number) {
    const user = await getCurrentUser()
    if (!user || !user.companyId) return { success: false, error: 'Unauthorized' }
    const companyId = user.companyId

    try {
        // 1. Gross Income (Sales) for the year
        const sales = await prisma.sale.aggregate({
            where: {
                companyId,
                date: {
                    gte: new Date(year, 0, 1),
                    lte: new Date(year, 11, 31)
                }
            },
            _sum: { amount: true }
        })
        const totalIncome = sales._sum.amount || 0

        // 2. Total Expenses (Operating Expenses + Purchases)
        // Note: Purchases are separate from Operating Expenses in this schema
        const purchases = await prisma.purchase.aggregate({
            where: {
                companyId,
                date: {
                    gte: new Date(year, 0, 1),
                    lte: new Date(year, 11, 31)
                }
            },
            _sum: { amount: true }
        })

        // Fetch Operating Expenses (linked via ExpenseStore)
        // We need to find stores first or use a join if prisma supported it easily for aggs, 
        // but easier to fetch raw or sum via code for nested relation logic
        const stores = await prisma.expenseStore.findMany({
            where: { companyId },
            include: {
                expenses: {
                    where: { year: year }
                }
            }
        })

        const operatingExpensesTotal = stores.reduce((acc, store) => {
            return acc + store.expenses.reduce((sum, exp) => sum + exp.amount, 0)
        }, 0)

        // Fetch Payroll totals
        const payrolls = await prisma.payroll.findMany({
            where: { companyId, year },
            select: { baseSalary: true, bonuses: true } // Simplified cost
        })
        const payrollTotal = payrolls.reduce((acc, curr) => acc + curr.baseSalary + curr.bonuses, 0)

        const totalExpenses = (purchases._sum.amount || 0) + operatingExpensesTotal + payrollTotal

        // 3. Net Profit
        const netProfit = totalIncome - totalExpenses

        // 4. Active Employees
        const employeeCount = await prisma.employee.count({
            where: { companyId, status: 'Active' }
        })

        return {
            success: true,
            data: {
                totalIncome,
                totalExpenses,
                netProfit,
                employeeCount,
                operatingExpensesTotal,
                purchasesTotal: purchases._sum.amount || 0,
                payrollTotal
            }
        }

    } catch (error) {
        console.error("Error getting general stats:", error)
        return { success: false, error: "Failed to fetch stats" }
    }
}

export async function getSalesAnalytics(year: number) {
    const user = await getCurrentUser()
    if (!user || !user.companyId) return { success: false, error: 'Unauthorized' }
    const companyId = user.companyId

    try {
        const sales = await prisma.sale.findMany({
            where: {
                companyId,
                date: {
                    gte: new Date(year, 0, 1),
                    lte: new Date(year, 11, 31)
                }
            },
            select: {
                date: true,
                amount: true,
                paymentMethod: true
            },
            orderBy: { date: 'asc' }
        })

        // Group by Month
        const monthlySales = new Array(12).fill(0)
        sales.forEach(sale => {
            const month = sale.date.getMonth()
            monthlySales[month] += sale.amount
        })

        // Group by Method
        const byMethod: Record<string, number> = {}
        sales.forEach(sale => {
            const method = sale.paymentMethod || 'Otros'
            byMethod[method] = (byMethod[method] || 0) + sale.amount
        })

        return {
            success: true,
            data: {
                monthlySales,
                byMethod
            }
        }
    } catch (error) {
        return { success: false, error: "Failed to fetch sales analytics" }
    }
}

export async function getExpenseAnalytics(year: number) {
    const user = await getCurrentUser()
    if (!user || !user.companyId) return { success: false, error: 'Unauthorized' }
    const companyId = user.companyId

    try {
        const stores = await prisma.expenseStore.findMany({
            where: { companyId },
            include: {
                expenses: {
                    where: { year }
                }
            }
        })

        const byCategory: Record<string, number> = {}
        const categories = new Set<string>()

        // Prepare 12 months of data
        const monthlyData = new Array(12).fill(0).map((_, i) => ({
            month: i + 1,
            total: 0,
            categories: {} as Record<string, number>
        }))

        stores.forEach(store => {
            store.expenses.forEach(exp => {
                const mIdx = exp.month - 1
                if (mIdx >= 0 && mIdx < 12) {
                    monthlyData[mIdx].total += exp.amount
                    monthlyData[mIdx].categories[exp.category] = (monthlyData[mIdx].categories[exp.category] || 0) + exp.amount
                }
                byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount
                categories.add(exp.category)
            })
        })

        // Flatten for Recharts
        const chartData = monthlyData.map(m => ({
            month: m.month,
            total: m.total,
            ...m.categories
        }))

        return {
            success: true,
            data: {
                chartData,
                byCategory,
                allCategories: Array.from(categories)
            }
        }
    } catch (error) {
        console.error("Error in getExpenseAnalytics:", error)
        return { success: false, error: "Failed to fetch expense analytics" }
    }
}

export async function getPayrollAnalytics(year: number) {
    const user = await getCurrentUser()
    if (!user || !user.companyId) return { success: false, error: 'Unauthorized' }
    const companyId = user.companyId

    try {
        const payrolls = await prisma.payroll.findMany({
            where: { companyId, year }
        })

        const monthlyPayroll = new Array(12).fill(0)

        payrolls.forEach(p => {
            if (p.month >= 1 && p.month <= 12) {
                // Total cost per payroll (Salary + Bonuses) 
                // Ignoring complex deductions for the high level view
                monthlyPayroll[p.month - 1] += (p.baseSalary + p.bonuses)
            }
        })

        return {
            success: true,
            data: {
                monthlyPayroll
            }
        }


    } catch (error) {
        return { success: false, error: "Failed to fetch payroll analytics" }
    }
}

export async function getPurchaseAnalytics(year: number) {
    const user = await getCurrentUser()
    if (!user || !user.companyId) return { success: false, error: 'Unauthorized' }
    const companyId = user.companyId

    try {
        const purchases = await prisma.purchase.findMany({
            where: {
                companyId,
                date: {
                    gte: new Date(year, 0, 1),
                    lte: new Date(year, 11, 31)
                }
            },
            orderBy: { date: 'asc' }
        })

        const monthlyPurchases = new Array(12).fill(0)
        const byDescription: Record<string, number> = {}

        purchases.forEach(p => {
            const month = p.date.getMonth()
            monthlyPurchases[month] += p.amount

            const key = p.description || 'Sin descripción'
            byDescription[key] = (byDescription[key] || 0) + p.amount
        })

        const topProviders = Object.entries(byDescription)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)

        return {
            success: true,
            data: {
                monthlyPurchases,
                topProviders
            }
        }
    } catch (error) {
        return { success: false, error: "Failed to fetch purchase analytics" }
    }
}

export async function getTaxAnalytics(year: number) {
    const user = await getCurrentUser()
    if (!user || !user.companyId) return { success: false, error: 'Unauthorized' }
    const companyId = user.companyId

    try {
        const sales = await prisma.sale.findMany({
            where: {
                companyId,
                date: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) }
            }
        })

        const purchases = await prisma.purchase.findMany({
            where: {
                companyId,
                date: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) }
            }
        })

        const monthlyData = new Array(12).fill(0).map(() => ({
            debit: 0,
            credit: 0,
            payable: 0
        }))

        sales.forEach(s => {
            const m = s.date.getMonth()
            monthlyData[m].debit += s.amount * 0.13
        })

        purchases.forEach(p => {
            const m = p.date.getMonth()
            monthlyData[m].credit += p.amount * 0.13
        })

        monthlyData.forEach(d => {
            d.payable = Math.max(0, d.debit - d.credit)
        })

        const totalDebit = monthlyData.reduce((acc, curr) => acc + curr.debit, 0)
        const totalCredit = monthlyData.reduce((acc, curr) => acc + curr.credit, 0)
        const totalPayable = monthlyData.reduce((acc, curr) => acc + curr.payable, 0)

        return {
            success: true,
            data: {
                monthlyData,
                totalDebit,
                totalCredit,
                totalPayable
            }
        }

    } catch (error) {
        return { success: false, error: "Failed to fetch tax analytics" }
    }
}

export async function getMultiYearAnalysis(years: number[]) {
    const user = await getCurrentUser()
    if (!user || !user.companyId) return { success: false, error: 'Unauthorized' }
    const companyId = user.companyId

    try {
        const results = await Promise.all(years.map(async (year) => {
            // Fetch Sales
            const sales = await prisma.sale.findMany({
                where: { companyId, date: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) } },
                select: { date: true, amount: true }
            })

            // Fetch Purchases
            const purchases = await prisma.purchase.findMany({
                where: { companyId, date: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) } },
                select: { date: true, amount: true }
            })

            // Fetch Operating Expenses
            const stores = await prisma.expenseStore.findMany({
                where: { companyId },
                include: { expenses: { where: { year } } }
            })

            // Fetch Payroll
            const payrolls = await prisma.payroll.findMany({
                where: { companyId, year },
                select: { month: true, baseSalary: true, bonuses: true }
            })

            const monthlyData = new Array(12).fill(0).map(() => ({
                income: 0,
                expenses: 0,
                profit: 0
            }))

            // Sales -> Income
            sales.forEach(s => {
                monthlyData[s.date.getMonth()].income += s.amount
            })

            // Purchases -> Expenses
            purchases.forEach(p => {
                monthlyData[p.date.getMonth()].expenses += p.amount
            })

            // Expenses -> Expenses
            stores.forEach(store => {
                store.expenses.forEach(exp => {
                    if (exp.month >= 1 && exp.month <= 12) {
                        monthlyData[exp.month - 1].expenses += exp.amount
                    }
                })
            })

            // Payroll -> Expenses
            payrolls.forEach(p => {
                if (p.month >= 1 && p.month <= 12) {
                    monthlyData[p.month - 1].expenses += (p.baseSalary + p.bonuses)
                }
            })

            // Profit
            monthlyData.forEach(d => {
                d.profit = d.income - d.expenses
            })

            return {
                year,
                monthlyData,
                totalIncome: sales.reduce((acc, s) => acc + s.amount, 0),
                totalExpenses: monthlyData.reduce((acc, d) => acc + d.expenses, 0),
            }
        }))

        // Transform for Recharts
        const chartData = new Array(12).fill(0).map((_, i) => {
            const row: any = {
                month: new Date(2000, i).toLocaleDateString('es-BO', { month: 'short' })
            }
            results.forEach(res => {
                row[`income_${res.year}`] = res.monthlyData[i].income
                row[`expenses_${res.year}`] = res.monthlyData[i].expenses
                row[`profit_${res.year}`] = res.monthlyData[i].profit
            })
            return row
        })

        return {
            success: true,
            data: {
                results,
                chartData
            }
        }
    } catch (error) {
        console.error("Error in getMultiYearAnalysis:", error)
        return { success: false, error: "Failed to fetch multi-year analysis" }
    }
}
