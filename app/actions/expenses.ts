'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './user'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// --- Expense Store Actions ---

export async function createExpenseStore(data: { name: string; description?: string }) {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const store = await prisma.expenseStore.create({
            data: {
                name: data.name,
                description: data.description,
                companyId: user.companyId,
            }
        })

        revalidatePath('/dashboard/expenses')
        return { success: true, data: store }
    } catch (error) {
        console.error('Error creating expense store:', error)
        return { success: false, error: 'Failed to create store' }
    }
}

export async function getExpenseStores() {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const stores = await prisma.expenseStore.findMany({
            where: {
                companyId: user.companyId
            },
            orderBy: {
                createdAt: 'desc' // Newest first
            }
        })
        return { success: true, data: stores }
    } catch (error) {
        console.error('Error fetching expense stores:', error)
        return { success: false, error: 'Failed to fetch stores' }
    }
}

export async function getExpenseStoreById(storeId: string) {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const store = await prisma.expenseStore.findUnique({
            where: { id: storeId, companyId: user.companyId }
        })
        return { success: true, data: store }
    } catch (error) {
        console.error('Error fetching expense store:', error)
        return { success: false, error: 'Failed to fetch store' }
    }
}


// --- Operating Expense Actions ---

export async function getExpenses(storeId: string, year: number, month?: number) {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Verify store belongs to company
        const store = await prisma.expenseStore.findFirst({
            where: { id: storeId, companyId: user.companyId }
        })

        if (!store) {
            return { success: false, error: 'Store not found' }
        }

        const whereClause: any = {
            storeId: storeId,
            year: year
        }

        if (month !== undefined) {
            whereClause.month = month
        }

        const expenses = await prisma.operatingExpense.findMany({
            where: whereClause
        })

        return { success: true, data: expenses }
    } catch (error) {
        console.error('Error fetching expenses:', error)
        return { success: false, error: 'Failed to fetch expenses' }
    }
}

export async function upsertExpense(data: {
    id?: string, // If present, update. If not, create.
    storeId: string,
    category: string,
    amount: number,
    description?: string,
    month: number,
    year: number,
    proofUrl?: string
}) {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Verify store belongs to company
        const store = await prisma.expenseStore.findFirst({
            where: { id: data.storeId, companyId: user.companyId }
        })

        if (!store) {
            return { success: false, error: 'Store not found' }
        }

        if (data.id) {
            // Update
            const updated = await prisma.operatingExpense.update({
                where: { id: data.id },
                data: {
                    amount: data.amount,
                    description: data.description,
                    proofUrl: data.proofUrl,
                    // Typically we don't change category/month/year/store for an edit, but we could if needed. 
                    // For now, let's assume those remain stable or create new if big change.
                }
            })
            revalidatePath(`/dashboard/expenses/${data.storeId}`)
            return { success: true, data: updated }
        } else {
            // Create
            const created = await prisma.operatingExpense.create({
                data: {
                    storeId: data.storeId,
                    category: data.category,
                    amount: data.amount,
                    description: data.description,
                    month: data.month,
                    year: data.year,
                    proofUrl: data.proofUrl
                }
            })
            revalidatePath(`/dashboard/expenses/${data.storeId}`)
            return { success: true, data: created }
        }

    } catch (error) {
        console.error('Error upserting expense:', error)
        return { success: false, error: 'Failed to save expense' }
    }
}

export async function deleteExpense(expenseId: string, storeId: string) {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Verify ownership implicitly by checking if we can find it
        // Actually prisma delete where unique is fine, but we should ensure it belongs to a store of the company
        // A join query or two-step is safer.

        const expense = await prisma.operatingExpense.findUnique({
            where: { id: expenseId },
            include: { store: true }
        })

        if (!expense || expense.store.companyId !== user.companyId) {
            return { success: false, error: 'Unauthorized or not found' }
        }

        await prisma.operatingExpense.delete({
            where: { id: expenseId }
        })

        revalidatePath(`/dashboard/expenses/${storeId}`)
        return { success: true }
    } catch (error) {
        console.error('Error deleting expense:', error)
        return { success: false, error: 'Failed to delete expense' }
    }
}

export async function uploadExpenseReceipt(formData: FormData) {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const file = formData.get('file') as File
        const storeId = formData.get('storeId') as string
        const year = formData.get('year') as string
        const month = formData.get('month') as string

        if (!file || !storeId || !year || !month) {
            return { success: false, error: 'Missing required fields' }
        }

        // Verify store ownership
        const store = await prisma.expenseStore.findFirst({
            where: { id: storeId, companyId: user.companyId }
        })

        if (!store) {
            return { success: false, error: 'Store not found' }
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Directory: public/uploads/expenses/[storeId]/[year]/[month]/
        // Note: Using storeId in path prevents collisions between stores
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'expenses', storeId, year, month)

        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const filePath = join(uploadDir, safeFileName)
        const publicPath = `/uploads/expenses/${storeId}/${year}/${month}/${safeFileName}`

        await writeFile(filePath, buffer)

        return { success: true, path: publicPath }
    } catch (error) {
        console.error('Error uploading receipt:', error)
        return { success: false, error: 'Failed to upload file' }
    }
}
