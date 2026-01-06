import prisma from '@/lib/prisma'
import { verifySession } from '../../actions/company' // Assuming path relative to app/lib/data


// --- Widget 1: Workload & Performance Data ---
export async function getWorkloadAnalysis() {
    const session = await verifySession()

    const employees = await prisma.employee.findMany({
        where: { companyId: session.companyId },
        include: { payrolls: true }
    })

    return employees.map(emp => {
        return {
            id: emp.id,
            name: `${emp.firstName} ${emp.lastName} `,
            role: emp.jobTitle,
            baseSalary: emp.baseSalary,
            monthlyHours: (emp as any).monthlyHours || 176,
        }
    })
}

// --- Widget 2: Mobility Data ---
export async function getMobilityData() {
    const session = await verifySession()

    const stages = await prisma.projectStage.findMany({
        where: {
            project: { companyId: session.companyId }
        },
        include: {
            assignments: {
                include: { employee: true }
            }
        }
    })

    return stages
}

// --- Widget 3: Payments vs Hours ---
export async function getPaymentsVsHoursData() {
    const session = await verifySession()

    const employees = await prisma.employee.findMany({
        where: { companyId: session.companyId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            baseSalary: true,
            monthlyHours: true
        }
    })

    return employees.map(e => ({
        name: `${e.firstName} ${e.lastName} `,
        payment: e.baseSalary,
        hours: (e as any).monthlyHours || 176
    })).sort((a, b) => b.payment - a.payment)
}

// --- Widget 4: Gap Analysis ---
export async function getGapAnalysisData() {
    const session = await verifySession()

    const futureProjects = await prisma.project.findMany({
        where: {
            companyId: session.companyId,
            status: 'Planning'
        },
        include: { resources: true }
    })

    const employees = await prisma.employee.findMany({
        where: { companyId: session.companyId, status: 'Active' },
        select: { jobTitle: true }
    })

    const currentCounts: Record<string, number> = {}
    employees.forEach(e => {
        const role = e.jobTitle.trim()
        currentCounts[role] = (currentCounts[role] || 0) + 1
    })

    const analysis = futureProjects.map(proj => {
        const gaps: any[] = []
        let totalBudgetNeeded = 0

        proj.resources.forEach(res => {
            const current = currentCounts[res.roleString] || 0
            const diff = res.count - current
            if (diff > 0) {
                const estimatedSalary = 2500
                const cost = diff * estimatedSalary * proj.durationMonths
                totalBudgetNeeded += cost

                gaps.push({
                    role: res.roleString,
                    required: res.count,
                    current,
                    missing: diff,
                    estimatedCost: cost
                })
            }
        })

        return {
            projectName: proj.name,
            totalBudgetNeeded,
            gaps
        }
    })

    return analysis
}

// --- Widget 5: Financial Projections ---
export async function getFinancialProjections() {
    const session = await verifySession()

    const employees = await prisma.employee.findMany({ where: { companyId: session.companyId, status: 'Active' } })
    const totalMonthlyCost = employees.reduce((sum, e) => sum + e.baseSalary, 0)

    const yearlyBase = totalMonthlyCost * 12

    return {
        year1: { cost: yearlyBase, value: yearlyBase * 3 },
        year2: { cost: yearlyBase * 1.05, value: (yearlyBase * 1.05) * 3 },
        year3: { cost: yearlyBase * 1.10, value: (yearlyBase * 1.10) * 3 },
    }
}
