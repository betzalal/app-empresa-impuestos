'use server'

import prisma from '@/lib/prisma'
import { verifySession } from './company'
import { revalidatePath } from 'next/cache'

// --- Widget 2: Mobility & Stage Management ---
export async function createProjectStage(prevState: any, formData: FormData) {
    const session = await verifySession()
    const name = formData.get('name') as string
    const projectId = formData.get('projectId') as string // Optional
    const startDate = new Date(formData.get('startDate') as string)
    const endDate = new Date(formData.get('endDate') as string)

    // Validation...

    await prisma.projectStage.create({
        data: {
            name,
            startDate,
            endDate,
            projectId: projectId || undefined
        }
    })

    revalidatePath('/dashboard/personal/analisis')
    return { success: true, message: 'Stage Created' }
}

export async function assignPersonnelToStage(prevState: any, formData: FormData) {
    const session = await verifySession()
    const stageId = formData.get('stageId') as string
    const employeeId = formData.get('employeeId') as string
    const assignedHours = parseFloat(formData.get('assignedHours') as string)
    const extraExpenses = parseFloat(formData.get('extraExpenses') as string) || 0

    await prisma.stageAssignment.create({
        data: {
            stageId,
            employeeId,
            assignedHours,
            extraExpenses
            // Cost calculation happens on read or we can store it if we want to freeze it
        }
    })

    revalidatePath('/dashboard/personal/analisis')
    return { success: true, message: 'Personnel Assigned' }
}
