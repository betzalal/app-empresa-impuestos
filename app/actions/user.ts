'use server'

import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function getCurrentUser() {
    const cookieStore = cookies()
    const userId = cookieStore.get('base_session')?.value

    if (!userId) {
        return null
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                nit: true,
                companyId: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                        logoUrl: true
                    }
                }
            }
        })
        return user
    } catch (e) {
        console.error('Error fetching user:', e)
        return null
    }
}

export async function updateUserName(newName: string) {
    const cookieStore = cookies()
    const userId = cookieStore.get('base_session')?.value

    if (!userId) {
        throw new Error('Unauthorized')
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { username: newName }
        })
        return { success: true }
    } catch (e) {
        console.error('Error updating username:', e)
        return { success: false, error: 'Error al actualizar el nombre' }
    }
}
