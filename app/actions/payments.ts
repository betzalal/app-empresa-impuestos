'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { verifySession } from './company'

// Define the shape of our server action response
export type ActionResponse = {
    success: boolean
    message: string
    data?: any
}

/**
 * Uploads a payment proof file for a specific tax type in a given month/year.
 */
export async function uploadPaymentProof(formData: FormData): Promise<ActionResponse> {
    try {
        const file = formData.get('file') as File
        const month = parseInt(formData.get('month') as string)
        const year = parseInt(formData.get('year') as string)
        const taxType = formData.get('taxType') as string

        if (!file || !month || !year || !taxType) {
            return { success: false, message: 'Faltan datos requeridos.' }
        }

        const session = await verifySession()

        // 1. Check if proof already exists and is locked
        // We use findFirst because composite unique includes companyId now, but where clause needs adjustment if we rely on simple uniqueness
        const existingProof = await prisma.paymentProof.findFirst({
            where: {
                month,
                year,
                taxType,
                companyId: session.companyId
            }
        })

        if (existingProof && existingProof.isLocked) {
            return { success: false, message: 'Este comprobante está bloqueado y no se puede modificar.' }
        }

        // 2. Prepare file storage
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Directory: public/uploads/payments/[year]/[month]/
        // Ideally, we should store this outside of public for security if sensitive, 
        // but for this MVP per instructions we'll put it in public/uploads to serve easily.
        // We'll rename it to avoid collisions: [taxType]-[originalName]
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'payments', year.toString(), month.toString())

        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        const safeFileName = `${taxType}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const filePath = join(uploadDir, safeFileName)
        const publicPath = `/uploads/payments/${year}/${month}/${safeFileName}`

        // 3. Delete old file if exists (and not locked, checked above)
        if (existingProof) {
            const oldPath = join(process.cwd(), 'public', existingProof.filePath) // stored path is relative to public? Let's assume we stored public web path.
            // Wait, need to reconstruct FS path from stored web path if necessary.
            // Let's standardise: store web path in DB.
            const fsOldPath = join(process.cwd(), 'public', existingProof.filePath)
            if (existsSync(fsOldPath)) {
                await unlink(fsOldPath).catch(err => console.error("Failed to delete old file", err))
            }
        }

        // 4. Save file
        await writeFile(filePath, buffer)

        // 5. Update/Create DB record
        const savedProof = await prisma.paymentProof.upsert({
            where: {
                month_year_taxType_companyId: {
                    month,
                    year,
                    taxType,
                    companyId: session.companyId
                }
            },
            create: {
                month,
                year,
                taxType,
                filePath: publicPath,
                fileName: file.name,
                fileType: file.type,
                fileName: file.name,
                fileType: file.type,
                isLocked: false,
                companyId: session.companyId
            },
            update: {
                filePath: publicPath,
                fileName: file.name,
                fileType: file.type
                // Don't reset isLocked, but we checked it's false above.
            }
        })

        revalidatePath('/dashboard/pagos')
        return { success: true, message: 'Comprobante subido correctamente.', data: savedProof }

    } catch (error) {
        console.error('Upload error:', error)
        return { success: false, message: 'Error al servidor al subir el archivo.' }
    }
}

/**
 * Deletes a payment proof if not locked.
 */
export async function deletePaymentProof(id: string): Promise<ActionResponse> {
    try {
        const session = await verifySession()

        const proof = await prisma.paymentProof.findUnique({
            where: { id }
        })

        if (proof?.companyId !== session.companyId) throw new Error('Unauthorized')

        if (!proof) {
            return { success: false, message: 'Comprobante no encontrado.' }
        }

        if (proof.isLocked) {
            return { success: false, message: 'No se puede eliminar un comprobante guardado permanentemente.' }
        }

        // Delete file
        const fsPath = join(process.cwd(), 'public', proof.filePath)
        if (existsSync(fsPath)) {
            await unlink(fsPath)
        }

        // Delete record
        await prisma.paymentProof.delete({
            where: { id }
        })

        revalidatePath('/dashboard/pagos')
        return { success: true, message: 'Comprobante eliminado.' }

    } catch (error) {
        console.error('Delete error:', error)
        return { success: false, message: 'Error al eliminar el comprobante.' }
    }
}

/**
 * Locks a payment proof permanently.
 */
export async function lockPaymentProof(id: string): Promise<ActionResponse> {
    try {
        const session = await verifySession()
        const proof = await prisma.paymentProof.findUnique({ where: { id } })
        if (proof?.companyId !== session.companyId) throw new Error('Unauthorized')

        await prisma.paymentProof.update({
            where: { id },
            data: { isLocked: true }
        })

        revalidatePath('/dashboard/pagos')
        return { success: true, message: 'Comprobante guardado permanentemente.' }
    } catch (error) {
        return { success: false, message: 'Error al bloquear el comprobante.' }
    }
}

/**
 * Fetch proofs for a specific period.
 */
export async function getPaymentProofs(month: number, year: number) {
    const session = await verifySession()
    return await prisma.paymentProof.findMany({
        where: {
            month,
            year,
            companyId: session.companyId
        }
    })
}
