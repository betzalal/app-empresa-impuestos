'use server'

import prisma from '@/lib/prisma'
import { getCurrentUser } from './user'
import { getTaxEvents } from '@/lib/tax-calendar'
import { revalidatePath } from 'next/cache'
import { PaymentProof } from '@prisma/client'

// Define unified event type
export type CalendarEvent = {
    id: string
    title: string
    date: Date
    type: 'memory' | 'tax' | 'payment' | 'other' | 'lock'
    description?: string
    metadata?: any // Extra info (e.g., image url, payment status)
}

// ... existing code ...

export async function deleteMemory(id: string) {
    const user = await getCurrentUser()
    if (!user || !user.companyId) return { error: "Unauthorized" }

    await (prisma as any).companyMemory.delete({
        where: { id, companyId: user.companyId }
    })
    revalidatePath('/dashboard/company')
    return { success: true }
}

export async function lockDay(date: Date | string) {
    const user = await getCurrentUser()
    if (!user || user.companyId === undefined) return { error: "Unauthorized" } // fallback check

    const companyId = user.companyId || (await prisma.company.findUnique({ where: { nit: user.nit || '' } }))?.id
    if (!companyId) return { error: "Company not linked" }

    // Check if already locked
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const existingLock = await (prisma as any).companyMemory.findFirst({
        where: {
            companyId,
            content: "SYSTEM::DAY_LOCKED",
            date: { gte: dayStart, lte: dayEnd }
        }
    })

    if (existingLock) return { success: true } // Already locked

    await (prisma as any).companyMemory.create({
        data: {
            content: "SYSTEM::DAY_LOCKED",
            date: new Date(date),
            companyId: companyId
        }
    })
    revalidatePath('/dashboard/company')
    return { success: true }
}

export async function getCompanyInfo() {
    const user = await getCurrentUser()
    if (!user) return null

    if (user.company) return user.company

    if (user.companyId) {
        return await prisma.company.findUnique({
            where: { id: user.companyId }
        })
    }
    return null
}

export async function verifySession() {
    const user = await getCurrentUser()
    if (!user) {
        throw new Error("Unauthorized")
    }

    // Resolve companyId if missing but NIT exists (legacy/fallback) - consistent with getCompanyEvents
    let companyId = user.companyId
    if (!companyId && user.nit) {
        const comp = await prisma.company.findUnique({ where: { nit: user.nit } })
        companyId = comp?.id || null
    }

    return {
        userId: user.id,
        companyId: companyId
    }
}

export async function createMemory(content: string, date: Date | string) {
    const user = await getCurrentUser()
    if (!user || (!user.companyId && !user.nit)) return { error: "No company found" }

    const companyId = user.companyId || (await prisma.company.findUnique({ where: { nit: user.nit || '' } }))?.id

    if (!companyId) return { error: "Company not linked" }

    await (prisma as any).companyMemory.create({
        data: {
            content,
            date: new Date(date),
            companyId: companyId
        }
    })

    revalidatePath('/dashboard/company')
    return { success: true }
}

export async function getCompanyEvents(month: number, year: number) {
    const user = await getCurrentUser()
    if (!user) return []

    // 1. Get Company ID
    let companyId: string | null | undefined = user.companyId
    // Fallback: try to find company by NIT if not directly linked (legacy support)
    if (!companyId && user.nit) {
        const comp = await prisma.company.findUnique({ where: { nit: user.nit } })
        companyId = comp?.id
    }

    const events: CalendarEvent[] = []

    // 2. Fetch Memories
    if (companyId) {
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0) // End of this month

        const memories = await (prisma as any).companyMemory.findMany({
            where: {
                companyId: companyId,
                date: {
                    gte: new Date(year, 0, 1), // Fetch whole year for calendar navigation usually, but let's stick to wider range or specific. 
                    // Better fetch broad range if client navigates. For now, let's fetch current month +/- 1
                }
            },
            orderBy: { date: 'desc' }
        })

        memories.forEach((m: any) => {
            if (m.content === "SYSTEM::DAY_LOCKED") {
                events.push({
                    id: m.id,
                    title: 'Día Cerrado',
                    date: m.date,
                    type: 'lock',
                    description: 'No se pueden realizar más cambios.'
                })
            } else {
                events.push({
                    id: m.id,
                    title: 'Memoria',
                    date: m.date,
                    type: 'memory',
                    description: m.content
                })
            }
        })

        // 3. Fetch Payment Proofs (Real uploaded payments)
        const payments = await prisma.paymentProof.findMany({
            where: {
                companyId: companyId
            }
        })

        payments.forEach(p => {
            // PaymentProof uses month/year integers, construct date (usually 1st or default deadline?)
            // Since we don't store exact upload Day in 'date' field (only CreatedAt), use createdAt.
            events.push({
                id: p.id,
                title: `Pago ${p.taxType}`,
                date: p.createdAt,
                type: 'payment',
                description: 'Comprobante subido',
                metadata: { url: p.filePath }
            })
        })
    }

    // 4. Generate Tax Deadlines (Algorithmic)
    // We reuse the client lib logic but map it to our format
    // Note: getTaxEvents usually generates for "upcoming" relative to "now". 
    // We might need to generate for the requested year/month if the lib supports it, 
    // or just generate the standard set and filter.
    // The current lib `getTaxEvents(nit)` likely generates near-future events.
    const taxEvents = getTaxEvents(user.nit || undefined)

    taxEvents.forEach((te: any) => {
        events.push({
            id: `tax-${te.title}-${te.date.toISOString()}`,
            title: te.title,
            date: te.date,
            type: 'tax',
            description: te.description
        })
    })

    // Sort by date descending
    return events.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export async function getCompanyDataVolume() {
    const user = await getCurrentUser()
    if (!user || !user.companyId) return 0.1 // Default small for new

    const companyId = user.companyId

    // Count various entities to measure "activity"
    const [salesCount, purchasesCount, employeesCount, memoriesCount] = await Promise.all([
        prisma.sale.count({ where: { companyId } }),
        prisma.purchase.count({ where: { companyId } }),
        prisma.employee.count({ where: { companyId } }),
        (prisma as any).companyMemory.count({ where: { companyId } })
    ])

    // Heuristics for "fullness"
    // Let's say:
    // 0-10 items: 0.2 (Small)
    // 10-50 items: 0.5 (Medium)
    // 50-200 items: 0.8 (Large)
    // 200+ items: 1.0 (Full)

    const totalItems = salesCount + purchasesCount + employeesCount + memoriesCount

    if (totalItems === 0) return 0.1
    if (totalItems < 20) return 0.3
    if (totalItems < 100) return 0.6
    if (totalItems < 500) return 0.8
    return 1.0
}
