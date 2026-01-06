import prisma from '@/lib/prisma'
import { verifySession } from '../../actions/company'

export async function getEmployees() {
    const session = await verifySession()
    return await prisma.employee.findMany({
        where: { companyId: session.companyId },
        orderBy: { createdAt: 'desc' },
        include: { jobPosition: true } // often needed
    })
}

export async function getEmployeesWithPayrolls() {
    const session = await verifySession()
    return await prisma.employee.findMany({
        where: { companyId: session.companyId },
        include: {
            payrolls: {
                orderBy: [
                    { year: 'desc' },
                    { month: 'desc' }
                ]
            },
            jobPosition: true,
            documents: true
        },
        orderBy: { createdAt: 'desc' }
    })
}

export async function getPayroll(id: string) {
    const session = await verifySession()
    const payroll = await prisma.payroll.findUnique({
        where: { id }
    })

    if (payroll && payroll.companyId !== session.companyId) {
        return null
    }

    return payroll
}
