'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { verifySession } from './company'

export async function addPurchase(formData: FormData) {
    const date = new Date(formData.get('date') as string)
    const amount = parseFloat(formData.get('amount') as string)
    const description = formData.get('description') as string
    const nitProvider = formData.get('nitProvider') as string
    const importBaseCF = parseFloat(formData.get('importBaseCF') as string) || parseFloat(formData.get('amount') as string)

    try {
        const session = await verifySession()

        await prisma.purchase.create({
            data: {
                date,
                amount,
                description,
                nitProvider,
                importBaseCF,
                companyId: session.companyId
            },
        })
        revalidatePath('/')
        return { success: true, message: 'Compra registrada correctamente' }
    } catch (error) {
        console.error('Error adding purchase:', error)
        return { success: false, message: 'Error al registrar compra' }
    }
}

export async function bulkAddPurchases(purchasesStr: string) {
    try {
        const purchases = JSON.parse(purchasesStr);
        // Expects array of objects

        const session = await verifySession()

        // Prisma createMany is supported in SQLite? Yes.
        const created = await prisma.purchase.createMany({
            data: purchases.map((p: any) => ({
                date: new Date(p.date),
                amount: parseFloat(p.amount),
                description: p.description,
                nitProvider: String(p.nitProvider),
                importBaseCF: parseFloat(p.importBaseCF),
                companyId: session.companyId
            }))
        })

        revalidatePath('/')
        return { success: true, message: `Se importaron ${created.count} compras correctamente` }
    } catch (error) {
        console.error('Error bulk adding purchases:', error)
        return { success: false, message: 'Error al importar compras masivas.' }
    }
}

export async function deletePurchase(id: string) {
    try {
        const session = await verifySession()
        // Verify ownership
        const purchase = await prisma.purchase.findUnique({ where: { id } })
        if (purchase?.companyId !== session.companyId) throw new Error('Unauthorized')

        await prisma.purchase.delete({
            where: { id },
        })
        revalidatePath('/')
        return { success: true, message: 'Compra eliminada correctamente' }
    } catch (error) {
        console.error('Error deleting purchase:', error)
        return { success: false, message: 'Error al eliminar compra' }
    }
}

export async function getPurchases() {
    try {
        const session = await verifySession()

        const purchases = await prisma.purchase.findMany({
            where: { companyId: session.companyId },
            orderBy: { date: 'desc' },
        })
        return { success: true, data: purchases }
    } catch (error) {
        console.error('Error getting purchases:', error)
        return { success: false, data: [] }
    }
}
