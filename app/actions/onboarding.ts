'use server'

import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcrypt'

export async function completeOnboarding(formData: any) {
    try {
        const sessionUserId = cookies().get('sawalife_session')?.value
        if (!sessionUserId) throw new Error('No session found')

        return await prisma.$transaction(async (tx) => {
            // 1. Create Company
            const company = await tx.company.create({
                data: {
                    name: formData.companyName,
                    nit: formData.nit,
                    logoUrl: formData.logoUrl,
                    description: formData.description,
                    industry: formData.industry,
                    primaryGoal: formData.priority,
                    teamSize: formData.teamSize,
                    acquisitionSource: formData.source,
                }
            })

            // 2. Update Current User (Admin)
            // Hash new password
            const hashedPassword = await bcrypt.hash(formData.adminPassword, 10)

            // Find current user and update details
            await tx.user.update({
                where: { id: sessionUserId },
                data: {
                    username: formData.adminUsername,
                    password: hashedPassword,
                    email: formData.email,
                    fullName: formData.fullName,
                    role: formData.role,
                    companyId: company.id
                }
            })

            // 3. Create Extra Users (Optional)
            if (formData.extraUser1) {
                const extraUser1Pass = await bcrypt.hash('123456', 10)
                await tx.user.create({
                    data: {
                        username: formData.extraUser1,
                        password: extraUser1Pass,
                        role: 'User',
                        companyId: company.id
                    }
                })
            }

            if (formData.extraUser2) {
                const extraUser2Pass = await bcrypt.hash('123456', 10)
                await tx.user.create({
                    data: {
                        username: formData.extraUser2,
                        password: extraUser2Pass,
                        role: 'User',
                        companyId: company.id
                    }
                })
            }

            return { success: true }
        })

    } catch (error: any) {
        console.error("Onboarding Error Full Details:", JSON.stringify(error, null, 2))

        // Handle Unique Constraint Violations
        if (error.code === 'P2002') {
            const target = error.meta?.target
            if (Array.isArray(target)) {
                if (target.includes('nit')) return { success: false, error: 'El NIT ya está registrado.' }
                if (target.includes('username')) return { success: false, error: 'El nombre de usuario ya existe.' }
            }
            return { success: false, error: 'Datos duplicados (NIT o Usuario).' }
        }

        return { success: false, error: `Error: ${error.message || 'Error al guardar datos'}` }
    }

    // Perform redirect outside try/catch
    return { success: true }
}
