'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { verifySession } from './company'

export async function addSale(formData: FormData) {
    const date = new Date(formData.get('date') as string)
    const amount = parseFloat(formData.get('amount') as string)
    const clientName = formData.get('clientName') as string
    const itemDescription = formData.get('itemDescription') as string
    const quantity = parseInt(formData.get('quantity') as string)
    const paymentType = formData.get('paymentType') as string
    const paymentMethod = formData.get('paymentMethod') as string
    const buyerNit = formData.get('buyerNit') as string // Added

    try {
        const session = await verifySession()

        await prisma.sale.create({
            data: {
                date,
                amount,
                clientName,
                itemDescription,
                quantity,
                paymentType,
                paymentMethod,
                buyerNit,
                companyId: session.companyId
            },
        })
        revalidatePath('/')
        return { success: true, message: 'Venta registrada correctamente' }
    } catch (error) {
        console.error('Error adding sale:', error)
        return { success: false, message: 'Error al registrar venta' }
    }
}

export async function deleteSale(id: string) {
    try {
        const session = await verifySession()

        // Ensure deletion is scoped to company
        const sale = await prisma.sale.findUnique({ where: { id } })
        if (sale?.companyId !== session.companyId) {
            return { success: false, message: 'Unauthorized' }
        }

        await prisma.sale.delete({
            where: { id },
        })
        revalidatePath('/')
        return { success: true, message: 'Venta eliminada correctamente' }
    } catch (error) {
        console.error('Error deleting sale:', error)
        return { success: false, message: 'Error al eliminar venta' }
    }
}

// ... existing code ...

export async function bulkAddSales(jsonPayload: string) {
    try {
        const session = await verifySession()
        const sales = JSON.parse(jsonPayload)

        // We can use createMany if database supports it (SQLite does)
        // But dates need to be Date objects
        const data = sales.map((s: any) => ({
            date: new Date(s.date),
            amount: s.amount,
            clientName: s.clientName,
            itemDescription: s.itemDescription,
            quantity: s.quantity,
            paymentType: s.paymentType,
            paymentMethod: s.paymentMethod,
            buyerNit: s.buyerNit,
            companyId: session.companyId
        }))

        await prisma.sale.createMany({
            data
        })

        revalidatePath('/')
        return { success: true, message: `${data.length} ventas registradas correctamente` }
    } catch (error) {
        console.error('Error bulk adding sales:', error)
        return { success: false, message: 'Error al registrar ventas masivas' }
    }
}

export async function getSales() {
    try {
        const session = await verifySession()

        const sales = await prisma.sale.findMany({
            where: { companyId: session.companyId },
            orderBy: { date: 'desc' },
        })
        return { success: true, data: sales }
    } catch (error) {
        console.error('Error getting sales:', error)
        return { success: false, data: [] }
    }
}
