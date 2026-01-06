'use server'

import { revalidatePath } from 'next/cache'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { verifySession } from './company'
import prisma from '@/lib/prisma'

export type Candidate = {
    id: string
    name: string
    appliedPosition: string
    status: string
    cvUrl: string | null
    description: string | null
    previousJobs: string | null
    yearsExperience: number | null
    proposedRole: string | null
    expectedSalary: number | null
    interviewDate: Date | null
    offerDetails: string | null
    createdAt: Date
}

export async function getCandidates() {
    const session = await verifySession()
    return await prisma.candidate.findMany({
        where: { companyId: session.companyId },
        orderBy: { createdAt: 'desc' }
    })
}

export async function createCandidate(formData: FormData) {
    const name = formData.get('name') as string
    const appliedPosition = formData.get('appliedPosition') as string

    // New Fields
    const description = formData.get('description') as string || null
    const previousJobs = formData.get('previousJobs') as string || null
    const yearsExperience = formData.get('yearsExperience') ? parseInt(formData.get('yearsExperience') as string) : null
    const proposedRole = formData.get('proposedRole') as string || null
    const expectedSalary = formData.get('expectedSalary') ? parseFloat(formData.get('expectedSalary') as string) : null

    const cvFile = formData.get('cv') as File | null

    let cvUrl = null

    if (!name || !appliedPosition) {
        return { success: false, message: 'Name and Position are required' }
    }

    if (cvFile && cvFile.size > 0 && cvFile.name !== 'undefined') {
        const bytes = await cvFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'cvs')

        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        const safeFileName = `${Date.now()}-${cvFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const filePath = join(uploadDir, safeFileName)
        await writeFile(filePath, buffer)
        cvUrl = `/uploads/cvs/${safeFileName}`
    }

    const session = await verifySession()

    await prisma.candidate.create({
        data: {
            name,
            appliedPosition,
            status: 'Recibido', // Default status
            cvUrl,
            description,
            previousJobs,
            yearsExperience,
            proposedRole,
            expectedSalary,
            companyId: session.companyId
        }
    })

    revalidatePath('/dashboard/personal/candidatos')
    return { success: true, message: 'Candidate added' }
}

export async function updateCandidateStatus(id: string, newStatus: string, extraData: Partial<Candidate> = {}) {
    const session = await verifySession()

    // Verify Ownership
    const candidate = await prisma.candidate.findUnique({ where: { id } })
    if (candidate?.companyId !== session.companyId) return { success: false, message: 'Unauthorized' }

    await prisma.candidate.update({
        where: { id },
        data: {
            status: newStatus,
            ...extraData
        }
    })
    revalidatePath('/dashboard/personal/candidatos')
}

import { createEmployeeCore } from './hr'
import { redirect } from 'next/navigation'

export async function hireCandidate(formData: FormData) {
    const session = await verifySession()
    const candidateId = formData.get('candidateId') as string

    // Verify Ownership if ID provided
    if (candidateId) {
        const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } })
        if (candidate?.companyId !== session.companyId) throw new Error('Unauthorized')
    }

    // 1. Create Employee
    await createEmployeeCore(formData)

    // 2. Update Candidate Status (if ID provided)
    if (candidateId) {
        await prisma.candidate.update({
            where: { id: candidateId },
            data: { status: 'Contratado' }
        })
    }

    // 3. Redirect
    revalidatePath('/dashboard/personal/candidatos')
    revalidatePath('/dashboard/personal')
    redirect('/dashboard/personal')
}

export async function deleteCandidate(id: string) {
    const session = await verifySession()

    // Verify Ownership
    const candidate = await prisma.candidate.findUnique({ where: { id } })
    if (candidate?.companyId !== session.companyId) throw new Error('Unauthorized')

    await prisma.candidate.delete({
        where: { id }
    })
    revalidatePath('/dashboard/personal/candidatos')
}
