import { NextRequest, NextResponse } from 'next/server'
import archiver from 'archiver'
import { join } from 'path'
import { existsSync, createReadStream } from 'fs'
import { Readable } from 'stream'
import prisma from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const employeeId = params.id

    try {
        // 1. Fetch all data
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                payrolls: true,
                documents: true,
                jobPosition: true
            }
        })

        if (!employee) {
            return new NextResponse('Employee not found', { status: 404 })
        }

        // 2. Setup Archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        })

        // Create a transform stream to pass to NextResponse
        const stream = new Readable({
            read() { }
        })

        archive.on('data', (chunk) => stream.push(chunk))
        archive.on('end', () => stream.push(null))
        archive.on('error', (err) => {
            console.error('Archive error:', err)
            stream.push(null)
        })

        // 3. Add Data JSON
        const safeEmployeeData = JSON.stringify(employee, null, 2)
        archive.append(safeEmployeeData, { name: 'employee_data.json' })

        // 4. Add Files
        // Employee Image
        if (employee.image && employee.image.startsWith('/uploads')) {
            const imagePath = join(process.cwd(), 'public', employee.image)
            if (existsSync(imagePath)) {
                archive.file(imagePath, { name: `profile_image${employee.image.substring(employee.image.lastIndexOf('.'))}` })
            }
        }

        // Company Documents
        if (employee.documents) {
            for (const doc of employee.documents) {
                if (doc.url.startsWith('/uploads')) {
                    const docPath = join(process.cwd(), 'public', doc.url)
                    if (existsSync(docPath)) {
                        archive.file(docPath, { name: `documents/${doc.title.replace(/[^a-z0-9]/gi, '_')}_${doc.id.substring(0, 4)}${doc.url.substring(doc.url.lastIndexOf('.'))}` })
                    }
                }
            }
        }

        // Payroll Proofs
        if (employee.payrolls) {
            for (const payroll of employee.payrolls) {
                const proofFields = ['proofSalary', 'proofSS', 'proofHealth', 'proofLabor']
                for (const field of proofFields) {
                    const url = (payroll as any)[field]
                    if (url && url.startsWith('/uploads')) {
                        const proofPath = join(process.cwd(), 'public', url)
                        if (existsSync(proofPath)) {
                            // Format: payrolls/2024_01/proofSalary.pdf
                            archive.file(proofPath, { name: `payrolls/${payroll.year}_${payroll.month}/${field}${url.substring(url.lastIndexOf('.'))}` })
                        }
                    }
                }
            }
        }

        // Finalize
        archive.finalize()

        // 5. Return Response
        return new NextResponse(stream as any, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="backup_${employee.firstName}_${employee.lastName}.zip"`
            }
        })

    } catch (error) {
        console.error('Backup error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
