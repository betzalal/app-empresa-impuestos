
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Searching for Employee or Payroll with "666"...')

    // Search Employee
    const emp = await prisma.employee.findFirst({
        where: {
            OR: [
                { documentId: { contains: '666' } },
                { firstName: { contains: '666' } },
                { lastName: { contains: '666' } }
            ]
        },
        include: { payrolls: true }
    })

    if (emp) {
        console.log('Found Employee:', emp.firstName, emp.lastName, emp.id)
        console.log('Payrolls count:', emp.payrolls.length)
    } else {
        console.log('Employee not found.')
    }

    // Search Orphaned Payrolls (if any, though cascade should have killed them)
    // We can't search easily if we don't know the ID, but let's list all helpful info?
    // Maybe just count total payrolls
    const totalPayrolls = await prisma.payroll.count()
    console.log('Total Payrolls in DB:', totalPayrolls)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
