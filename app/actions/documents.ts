'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { verifySession } from './company'

export type ActionResponse = {
    success: boolean
    message: string
    data?: any
}

/**
 * Uploads a company document (PDF, Image, etc).
 */
export async function uploadDocument(formData: FormData): Promise<ActionResponse> {
    try {
        const file = formData.get('file') as File
        const title = formData.get('title') as string
        const type = formData.get('type') as string || 'General' // Flujograma, etc.
        const employeeId = formData.get('employeeId') as string | null

        if (!file || !title) {
            return { success: false, message: 'Faltan datos requeridos (Archivo o Título).' }
        }

        // 1. Prepare file storage
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Directory: public/uploads/documents/
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'documents')

        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        // Clean filename to avoid issues
        const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const filePath = join(uploadDir, safeFileName)
        const publicPath = `/uploads/documents/${safeFileName}`

        // 2. Save file
        await writeFile(filePath, buffer)

        const session = await verifySession()

        // 3. Create DB record
        const savedDoc = await prisma.companyDocument.create({
            data: {
                title,
                type,
                url: publicPath,
                employeeId: employeeId || null,
                companyId: session.companyId
            }
        })

        revalidatePath('/dashboard/personal/flujogramas') // Revalidate listing page
        if (employeeId) revalidatePath(`/dashboard/personal/employee/${employeeId}`) // Revalidate employee page

        return { success: true, message: 'Documento subido correctamente.', data: savedDoc }

    } catch (error) {
        console.error('Upload error:', error)
        return { success: false, message: 'Error en el servidor al subir el archivo.' }
    }
}

/**
 * Deletes a document.
 */
export async function deleteDocument(id: string): Promise<ActionResponse> {
    try {
        const session = await verifySession()

        const doc = await prisma.companyDocument.findUnique({
            where: { id }
        })

        if (!doc || doc.companyId !== session.companyId) {
            return { success: false, message: 'Documento no encontrado o acceso denegado.' }
        }

        // Delete file
        // Construct FS path from DB public URL
        // stored: /uploads/documents/filename.pdf
        const fsPath = join(process.cwd(), 'public', doc.url)

        if (existsSync(fsPath)) {
            await unlink(fsPath).catch(err => console.error("Error deleting file", err))
        }

        // Delete record
        await prisma.companyDocument.delete({
            where: { id }
        })

        revalidatePath('/dashboard/personal/flujogramas')
        return { success: true, message: 'Documento eliminado.' }

    } catch (error) {
        console.error('Delete error:', error)
        return { success: false, message: 'Error al eliminar el documento.' }
    }
}

export async function getCompanyDocuments() {
    const session = await verifySession()
    return await prisma.companyDocument.findMany({
        where: { companyId: session.companyId },
        orderBy: { createdAt: 'desc' }
    })
}
