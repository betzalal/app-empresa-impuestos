'use server'

import prisma from '../../lib/prisma'
import { verifySession } from './company'

export type IueDataInput = {
    year: number
    initialInventory: number
    finalInventory: number
    depreciation: number
    otherNonMonetaryA: number
    fines: number
    withoutInvoice: number
    personalExpenses: number
    nonMonetaryDetail: string
    nonMonetaryAmount: number
    taxAdjustmentDetail: string
    taxAdjustmentAmount: number
    itemsBox2?: string
    itemsBox3?: string
    itemsBox4?: string
    itemsBox5?: string
    computerValue?: number
    furnitureValue?: number
    appValue?: number
    softwareItems?: string
}

export async function getIueDataAction(year: number) {
    try {
        const session = await verifySession()
        if (!session.companyId) {
            return { success: false, error: 'No se encontró la empresa' }
        }

        const data = await (prisma as any).iueData.findUnique({
            where: {
                year_companyId: {
                    year: year,
                    companyId: session.companyId
                }
            }
        })

        return { success: true, data }
    } catch (error: any) {
        console.error('Error fetching IUE data:', error)
        return { success: false, error: error.message }
    }
}

export async function saveIueDataAction(data: IueDataInput) {
    try {
        const session = await verifySession()
        const companyId = session.companyId
        if (!companyId) {
            return { success: false, error: 'No se encontró la empresa' }
        }

        const result = await prisma.iueData.upsert({
            where: {
                year_companyId: {
                    year: data.year,
                    companyId: companyId
                }
            },
            update: {
                initialInventory: data.initialInventory,
                finalInventory: data.finalInventory,
                depreciation: data.depreciation,
                otherNonMonetaryA: data.otherNonMonetaryA,
                fines: data.fines,
                withoutInvoice: data.withoutInvoice,
                personalExpenses: data.personalExpenses,
                nonMonetaryDetail: data.nonMonetaryDetail,
                nonMonetaryAmount: data.nonMonetaryAmount,
                taxAdjustmentDetail: data.taxAdjustmentDetail,
                taxAdjustmentAmount: data.taxAdjustmentAmount,
                itemsBox2: data.itemsBox2,
                itemsBox3: data.itemsBox3,
                itemsBox4: data.itemsBox4,
                itemsBox5: data.itemsBox5,
                computerValue: data.computerValue,
                furnitureValue: data.furnitureValue,
                appValue: data.appValue,
                softwareItems: data.softwareItems,
            },
            create: {
                year: data.year,
                initialInventory: data.initialInventory,
                finalInventory: data.finalInventory,
                depreciation: data.depreciation,
                otherNonMonetaryA: data.otherNonMonetaryA,
                fines: data.fines,
                withoutInvoice: data.withoutInvoice,
                personalExpenses: data.personalExpenses,
                nonMonetaryDetail: data.nonMonetaryDetail,
                nonMonetaryAmount: data.nonMonetaryAmount,
                taxAdjustmentDetail: data.taxAdjustmentDetail,
                taxAdjustmentAmount: data.taxAdjustmentAmount,
                itemsBox2: data.itemsBox2,
                itemsBox3: data.itemsBox3,
                itemsBox4: data.itemsBox4,
                itemsBox5: data.itemsBox5,
                computerValue: data.computerValue,
                furnitureValue: data.furnitureValue,
                appValue: data.appValue,
                softwareItems: data.softwareItems,
                companyId: companyId
            }
        })

        return { success: true, data: result }
    } catch (error: any) {
        console.error('Error saving IUE data:', error)
        return { success: false, error: error.message }
    }
}

export async function getIueAutomatedDataAction(year: number) {
    try {
        const session = await verifySession()
        const companyId = session.companyId
        if (!companyId) return { success: false, error: 'No se encontró la empresa' }

        const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0))
        const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59))

        // 1. Sales
        const salesAgg = await prisma.sale.aggregate({
            where: { companyId, date: { gte: startDate, lte: endDate } },
            _sum: { amount: true }
        })

        // 2. Purchases
        const purchasesAgg = await prisma.purchase.aggregate({
            where: { companyId, date: { gte: startDate, lte: endDate } },
            _sum: { importBaseCF: true }
        })

        // 3. Operating Expenses (Categories)
        const expenses = await prisma.operatingExpense.findMany({
            where: {
                store: { companyId },
                year: year
            },
            select: { category: true, amount: true }
        })

        const expensesByCategory: Record<string, number> = {
            "Alquileres": 0,
            "Servicios Básicos": 0,
            "Mantenimiento": 0,
            "Publicidad y Marketing": 0,
            "Seguros": 0
        }

        expenses.forEach(exp => {
            if (expensesByCategory[exp.category] !== undefined) {
                expensesByCategory[exp.category] += exp.amount
            }
        })

        // 4. Payroll
        const payrolls = await prisma.payroll.findMany({
            where: { companyId, year }
        })

        let payrollTotal = 0
        let sueldosTotal = 0
        let aportesTotal = 0
        let provisionsTotal = 0 // Aguinaldos + Indemnización

        payrolls.forEach(p => {
            const gross = p.baseSalary + p.bonuses
            const employerSocial = p.baseSalary * p.socialSecurity
            const employerHealth = p.baseSalary * p.healthInsurance
            const laborMinistry = p.laborMinistry

            // As per user feedback, provisions are already included in aportes/seguros
            // and only Aguinaldo (8.33% of gross) should be shown for reference.
            const totalPayrollCost = gross + employerSocial + employerHealth + laborMinistry
            const aguinaldo = gross * 0.0833

            sueldosTotal += gross
            aportesTotal += (employerSocial + employerHealth + laborMinistry)
            provisionsTotal += aguinaldo
            // total already contains provisions according to the user
            payrollTotal += totalPayrollCost
        })

        return {
            success: true,
            data: {
                totalSales: salesAgg._sum.amount || 0,
                totalPurchases: purchasesAgg._sum.importBaseCF || 0,
                operatingExpenses: expensesByCategory,
                payroll: {
                    sueldos: sueldosTotal,
                    aportes: aportesTotal,
                    provisions: provisionsTotal,
                    total: payrollTotal
                }
            }
        }
    } catch (error: any) {
        console.error('Error fetching automated IUE data:', error)
        return { success: false, error: error.message }
    }
}
