'use server'

import prisma from '@/lib/prisma'
import { verifySession } from './company'
import { cookies } from 'next/headers'
import bcrypt from 'bcrypt'

export async function deleteCompanyAction(formData: FormData, targetCompanyId?: string) {
    try {
        const session = await verifySession()
        const currentCompanyId = session.companyId

        // If no targetCompanyId is provided, we default to the current company (self-deletion)
        const companyId = targetCompanyId || currentCompanyId

        if (!companyId) {
            return { success: false, message: 'No se pudo identificar la empresa a eliminar.' }
        }

        const username = formData.get('authUsername') as string
        const password = formData.get('authPassword') as string

        if (!username || !password) {
            return { success: false, message: 'Faltan credenciales de autorización.' }
        }

        // 1. Verify Authorization Credentials
        const authUser = await prisma.user.findUnique({
            where: { username }
        })

        if (!authUser || authUser.username.toLowerCase() !== 'betzalal') {
            return { success: false, message: 'Usuario de autorización no válido.' }
        }

        const isValid = await bcrypt.compare(password, authUser.password)
        if (!isValid) {
            return { success: false, message: 'Contraseña de autorización incorrecta.' }
        }

        // 2. Perform Cascading Deletion in a Transaction
        await prisma.$transaction(async (tx) => {
            // HR Module
            await tx.payroll.deleteMany({ where: { companyId } })
            await tx.employee.deleteMany({ where: { companyId } })
            await tx.jobPosition.deleteMany({ where: { companyId } })
            await tx.candidate.deleteMany({ where: { companyId } })
            await tx.orgNode.deleteMany({ where: { companyId } })
            await tx.companyDocument.deleteMany({ where: { companyId } })

            // Tax/Finance Module
            await tx.paymentProof.deleteMany({ where: { companyId } })
            await tx.taxParameter.deleteMany({ where: { companyId } })
            await tx.purchase.deleteMany({ where: { companyId } })
            await tx.sale.deleteMany({ where: { companyId } })

            // Users belonging to this company
            await tx.user.deleteMany({ where: { companyId } })

            // Finally, the Company itself
            await tx.company.delete({ where: { id: companyId } })
        })

        // 3. Cleanup Session ONLY IF deleting self
        if (companyId === currentCompanyId) {
            cookies().delete('base_session')
            return { success: true, redirect: '/' }
        }

        return { success: true, message: 'Empresa eliminada correctamente.' }

    } catch (error: any) {
        console.error('Delete Company Error:', error)
        return { success: false, message: error.message || 'Error al eliminar la empresa.' }
    }
}

export async function getCompaniesAdminAction() {
    try {
        // We could restrict this further by checking if the session user is "betzalal"
        // but for now we follow the user's "betzalal" check in the deletion modal.
        return await prisma.company.findMany({
            select: { id: true, name: true, nit: true },
            orderBy: { createdAt: 'desc' }
        })
    } catch (error) {
        return []
    }
}
