
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting multi-tenancy migration...')

    // 1. Ensure "Sawalife" Company exists
    const sawalifeNit = '10203040' // Example NIT or existing one if known

    let company = await prisma.company.findUnique({
        where: { nit: sawalifeNit }
    })

    if (!company) {
        // Try to find by name just in case
        company = await prisma.company.findFirst({
            where: { name: 'Sawalife' }
        })
    }

    if (!company) {
        console.log('Creating default "Sawalife" company...')
        company = await prisma.company.create({
            data: {
                name: 'Sawalife',
                nit: sawalifeNit,
                description: 'Empresa Principal',
                logoUrl: '/logo_sawalife_t.png' // Assuming this is the existing logo
            }
        })
    } else {
        console.log(`Found "Sawalife" company (ID: ${company.id})`)
    }

    const companyId = company.id

    // 2. Link existing Users
    // We should link "Betzalel" or existing admins to this company
    // Actually, let's link ALL users with null companyId to this company for now
    const users = await prisma.user.updateMany({
        where: { companyId: null },
        data: { companyId }
    })
    console.log(`Updated ${users.count} users.`)

    // 3. Link operational data
    const models = [
        'sale', 'purchase', 'taxParameter', 'paymentProof',
        'employee', 'payroll', 'jobPosition', 'candidate',
        'orgNode', 'companyDocument'
    ]

    for (const model of models) {
        // @ts-ignore
        const result = await prisma[model].updateMany({
            where: { companyId: null },
            data: { companyId }
        })
        console.log(`Updated ${result.count} records in ${model}.`)
    }

    console.log('Migration completed successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
