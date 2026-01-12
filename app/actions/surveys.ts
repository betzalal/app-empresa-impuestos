'use server'

import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function getReceivedSurveys() {
    // Only allow for superadmin / specific user? 
    // For now we allow if session exists, but we should restrict.
    const userId = cookies().get('base_session')?.value
    if (!userId) return []

    return await (prisma as any).receivedSurvey.findMany({
        orderBy: { createdAt: 'desc' }
    })
}

export async function deleteReceivedSurvey(id: string) {
    const userId = cookies().get('base_session')?.value
    if (!userId) throw new Error('Unauthorized')

    await (prisma as any).receivedSurvey.delete({
        where: { id }
    })
    return { success: true }
}
