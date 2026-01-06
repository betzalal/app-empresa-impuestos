'use server'

import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function getCurrentUser() {
    const cookieStore = cookies()
    const userId = cookieStore.get('sawalife_session')?.value

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
                        name: true
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
