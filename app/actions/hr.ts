'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { cookies } from 'next/headers'
import bcrypt from 'bcrypt'
import { verifySession } from './company'

export async function deleteEmployee(id: string) {
    const session = await verifySession()

    // Verify ownership
    const employee = await prisma.employee.findUnique({ where: { id } })
    if (employee?.companyId !== session.companyId) {
        throw new Error('Unauthorized')
    }

    // Safety check: Prevent deletion if payrolls exist
    const payrollCount = await prisma.payroll.count({ where: { employeeId: id } })
    if (payrollCount > 0) {
        throw new Error('Cannot delete employee with existing payroll records. Please Archive instead.')
    }

    await prisma.employee.delete({ where: { id } })
    revalidatePath('/dashboard/personal')
}

export async function createEmployee(formData: FormData) {
    await createEmployeeCore(formData)
    revalidatePath('/dashboard/personal')
    redirect('/dashboard/personal')
}

export async function createEmployeeCore(formData: FormData) {
    const session = await verifySession()

    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const documentId = formData.get('documentId') as string
    const birthDate = formData.get('birthDate') as string

    // Image Upload Handling
    const imageFile = formData.get('image') as File | null
    let imagePath = null

    if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
        const bytes = await imageFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'employees')

        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        const safeFileName = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const filePath = join(uploadDir, safeFileName)
        await writeFile(filePath, buffer)
        imagePath = `/uploads/employees/${safeFileName}`
    } else {
        // Fallback if user somehow sent a string url (backward compat) or nothing
        const potentialUrl = formData.get('image') as string
        if (potentialUrl && typeof potentialUrl === 'string' && potentialUrl.startsWith('http')) {
            imagePath = potentialUrl
        }
    }

    const address = formData.get('address') as string || null

    // Job Data
    const jobTitle = formData.get('jobTitle') as string
    const department = formData.get('department') as string
    const store = formData.get('store') as string || null
    const hiredDate = formData.get('hiredDate') ? new Date(formData.get('hiredDate') as string) : new Date()

    // Contact
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const baseSalary = parseFloat(formData.get('baseSalary') as string) || 0
    const monthlyHours = parseFloat(formData.get('monthlyHours') as string) || 176

    if (!firstName || !lastName || !jobTitle) {
        throw new Error('Missing required fields')
    }

    // FEATURE: Create JobPosition on the fly if it doesn't exist
    // Job Positions should be company specific or global? 
    // Plan says isolated. So we check if title exists FOR THIS COMPANY.
    const existingJob = await prisma.jobPosition.findFirst({
        where: { title: jobTitle, companyId: session.companyId }
    })

    if (!existingJob) {
        await prisma.jobPosition.create({
            data: {
                title: jobTitle,
                description: 'Created automatically via Employee Form',
                responsibilities: 'Auto-generated',
                companyId: session.companyId
            }
        })
    }

    return await prisma.employee.create({
        data: {
            firstName,
            lastName,
            documentId,
            birthDate: birthDate ? new Date(birthDate) : new Date(), // Handle date properly
            email,
            phone,
            address,
            image: imagePath,
            jobTitle, // Linked by string, but we ensured catalog entry exists
            department,
            baseSalary,
            monthlyHours,
            hiredDate,
            store,
            companyId: session.companyId
        }
    })
}

export async function updateEmployee(id: string, formData: FormData) {
    const session = await verifySession()

    // Security check
    const existing = await prisma.employee.findUnique({ where: { id } })
    if (existing?.companyId !== session.companyId) throw new Error('Unauthorized')

    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const documentId = formData.get('documentId') as string
    const birthDate = formData.get('birthDate') as string

    // Image Handling
    const imageFile = formData.get('image') as File | null
    let imagePath = undefined // undefined = do not update

    if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
        const bytes = await imageFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'employees')

        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        const safeFileName = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const filePath = join(uploadDir, safeFileName)
        await writeFile(filePath, buffer)
        imagePath = `/uploads/employees/${safeFileName}`
    } else {
        // If "image" is sent as a string (URL) and valid, use it. 
        // Typically in edit forms, we don't send the old URL back as "image" file input.
        // But if we want to clear it? 
        // For now: only update if new file.
    }

    const address = formData.get('address') as string || null
    const jobTitle = formData.get('jobTitle') as string
    const department = formData.get('department') as string
    const store = formData.get('store') as string || null
    const hiredDate = formData.get('hiredDate') ? new Date(formData.get('hiredDate') as string) : new Date()
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const baseSalary = parseFloat(formData.get('baseSalary') as string) || 0
    const monthlyHours = parseFloat(formData.get('monthlyHours') as string) || 176

    await prisma.employee.update({
        where: { id },
        data: {
            firstName,
            lastName,
            documentId,
            birthDate: birthDate ? new Date(birthDate) : undefined,
            email,
            phone,
            address,
            image: imagePath, // Only updates if imagePath is defined (new file)
            jobTitle,
            department,
            baseSalary,
            monthlyHours,
            hiredDate,
            store
        }
    })

    revalidatePath('/dashboard/personal')
    revalidatePath(`/dashboard/personal/employee/${id}`)
    redirect(`/dashboard/personal/employee/${id}`)
}

export async function createPayroll(formData: FormData) {
    const session = await verifySession()

    const employeeId = formData.get('employeeId') as string
    const month = parseInt(formData.get('month') as string)
    const year = parseInt(formData.get('year') as string)
    const baseSalary = parseFloat(formData.get('baseSalary') as string)
    const bonuses = parseFloat(formData.get('bonuses') as string) || 0

    // Configurable Charges
    // User submits percentage as whole number (e.g. 19), we store as decimal (0.19)
    const socialSecurityRaw = parseFloat(formData.get('socialSecurity') as string)
    const socialSecurity = socialSecurityRaw / 100

    const healthInsuranceRaw = parseFloat(formData.get('healthInsurance') as string)
    const healthInsurance = healthInsuranceRaw / 100

    const laborMinistry = parseFloat(formData.get('laborMinistry') as string)

    const otherDeductions = parseFloat(formData.get('otherDeductions') as string) || 0
    const otherReason = formData.get('otherReason') as string

    await prisma.payroll.create({
        data: {
            employeeId,
            month,
            year,
            baseSalary,
            bonuses,
            socialSecurity, // Stored as 0.19
            healthInsurance, // Stored as 0.10
            laborMinistry,  // Stored as 70
            otherDeductions,
            otherReason,
            companyId: session.companyId
        }
    })

    revalidatePath('/dashboard/personal/payroll')
    redirect('/dashboard/personal/payroll')
}

export async function createJobPosition(formData: FormData) {
    const session = await verifySession()

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const responsibilities = formData.get('responsibilities') as string

    if (!title) {
        throw new Error('Title is required')
    }

    try {
        await prisma.jobPosition.create({
            data: {
                title,
                description,
                responsibilities,
                companyId: session.companyId
            }
        })
    } catch (e) {
        // Handle unique constraint if needed, or just let it fail
        console.error('Job creation failed', e)
    }

    revalidatePath('/dashboard/personal/trabajos')
}

export async function deletePayroll(id: string, password: string) {
    const session = await verifySession()

    // 1. Verify User Password
    const userId = session.userId
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return { success: false, message: 'User not found' }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) return { success: false, message: 'Incorrect Password' }

    // 2. Verify Payroll Ownership
    const payroll = await prisma.payroll.findUnique({ where: { id } })
    if (payroll?.companyId !== session.companyId) return { success: false, message: 'Unauthorized' }

    await prisma.payroll.delete({
        where: { id }
    })

    revalidatePath('/dashboard/personal/payroll')
    return { success: true, message: 'Payroll record deleted' }
}

export async function archiveEmployee(id: string) {
    const session = await verifySession()
    const employee = await prisma.employee.findUnique({ where: { id } })
    if (!employee) return { success: false, message: 'Employee not found' }
    if (employee.companyId !== session.companyId) return { success: false, message: 'Unauthorized' }

    const fullName = `${employee.firstName} ${employee.lastName}`

    await prisma.$transaction([
        // 1. Set Status to Archived
        prisma.employee.update({
            where: { id },
            data: { status: 'Archived' }
        }),
        // 2. Remove from Org Chart (User requested "no guardes organigramas")
        // We keep 'Flujograma' documents as requested ("en documentos agrega lo que estaba en flujogramas")
        prisma.orgNode.deleteMany({
            where: {
                name: fullName,
                companyId: session.companyId
            }
        })
    ])

    revalidatePath('/dashboard/personal')
    revalidatePath('/dashboard/personal/payroll')
    revalidatePath('/dashboard/personal/organigrama')
    return { success: true, message: 'Employee archived successfully' }
}

export async function deleteEmployeeSecure(id: string, password: string, overrideCode?: string) {
    const session = await verifySession()

    // 1. Verify User Password
    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) return { success: false, message: 'User not found' }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) return { success: false, message: 'Incorrect Password' }

    // Verify Employee Ownership
    const employeeToCheck = await prisma.employee.findUnique({ where: { id } })
    if (employeeToCheck?.companyId !== session.companyId) return { success: false, message: 'Unauthorized' }

    // Check for existing payrolls
    const payrollCount = await prisma.payroll.count({
        where: { employeeId: id }
    })

    // FORCE DELETE FLOW
    if (overrideCode === '196723') {
        const { unlink } = require('fs/promises')
        const { join } = require('path')

        try {
            // 0. GATHER FILES TO DELETE
            const filesToDelete: string[] = []

            // a. Employee Image
            const employee = await prisma.employee.findUnique({
                where: { id },
                include: { payrolls: true, documents: true }
            })

            if (employee?.image && employee.image.startsWith('/uploads/')) {
                filesToDelete.push(employee.image)
            }

            // b. Payroll Proofs
            if (employee?.payrolls) {
                for (const payroll of employee.payrolls) {
                    if (payroll.proofSalary) filesToDelete.push(payroll.proofSalary)
                    if (payroll.proofSS) filesToDelete.push(payroll.proofSS)
                    if (payroll.proofHealth) filesToDelete.push(payroll.proofHealth)
                    if (payroll.proofLabor) filesToDelete.push(payroll.proofLabor)
                }
            }

            // c. Company Documents (only if local uploads)
            if (employee?.documents) {
                for (const doc of employee.documents) {
                    if (doc.url && doc.url.startsWith('/uploads/')) {
                        filesToDelete.push(doc.url)
                    }
                }
            }

            // DELETE PHYSICAL FILES
            for (const relativePath of filesToDelete) {
                try {
                    const absolutePath = join(process.cwd(), 'public', relativePath)
                    if (existsSync(absolutePath)) {
                        await unlink(absolutePath)
                    }
                } catch (err) {
                    console.error(`Failed to delete file: ${relativePath}`, err)
                }
            }

            // 1. Delete all Payrolls for this employee
            await prisma.payroll.deleteMany({
                where: {
                    employeeId: id,
                    companyId: session.companyId
                }
            })

            // 2. Delete all Company Documents for this employee
            await prisma.companyDocument.deleteMany({
                where: {
                    employeeId: id,
                    companyId: session.companyId
                }
            })

            // 3. Remove from Org Chart
            if (employee) {
                await prisma.orgNode.deleteMany({
                    where: {
                        name: `${employee.firstName} ${employee.lastName}`,
                        companyId: session.companyId
                    }
                })
            }

            // 4. Finally Delete Employee
            await prisma.employee.delete({
                where: { id }
            })

            revalidatePath('/dashboard/personal')
            revalidatePath('/dashboard/personal/payroll')
            return { success: true, message: 'Employee, history, and physical files permanently deleted.' }

        } catch (error) {
            console.error("Force delete error:", error)
            return { success: false, message: 'Force delete failed. Check server logs.' }
        }
    }

    // NORMAL FLOW (Restricted)
    if (payrollCount > 0) {
        return {
            success: false,
            message: 'RESTRICTED', // Special flag for UI to trigger Backup flow
            payrollCount
        }
    }

    await prisma.employee.delete({
        where: { id }
    })

    revalidatePath('/dashboard/personal')
    revalidatePath('/dashboard/personal/payroll')
    return { success: true, message: 'Employee deleted' }
}


export async function uploadPayrollProof(formData: FormData) {
    try {
        const session = await verifySession()

        const payrollId = formData.get('payrollId') as string

        // Verify Ownership
        const payroll = await prisma.payroll.findUnique({ where: { id: payrollId } })
        if (payroll?.companyId !== session.companyId) return { success: false, message: 'Unauthorized' }

        const fieldType = formData.get('fieldType') as string
        const file = formData.get('file') as File

        if (!file || file.size === 0 || file.name === 'undefined') {
            return { success: false, message: 'No file uploaded' }
        }
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'payroll-proofs')

        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const filePath = join(uploadDir, safeFileName)
        await writeFile(filePath, buffer)

        const publicPath = `/uploads/payroll-proofs/${safeFileName}`

        // Dynamic update based on fieldType
        const updateData: any = {}
        if (['proofSalary', 'proofSS', 'proofHealth', 'proofLabor'].includes(fieldType)) {
            updateData[fieldType] = publicPath
        } else {
            return { success: false, message: 'Invalid field type' }
        }

        await prisma.payroll.update({
            where: { id: payrollId },
            data: updateData
        })

        revalidatePath('/dashboard/personal/payroll')
        return { success: true, message: 'Proof uploaded successfully' }

    } catch (error) {
        console.error('Upload error:', error)
        return { success: false, message: 'Failed to upload proof' }
    }
}


