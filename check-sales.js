
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const sales = await prisma.sale.findMany({
        select: { date: true }
    })

    console.log(`Found ${sales.length} sales.`)

    // Group by Month-Year
    const groups = {}
    sales.forEach(s => {
        const d = new Date(s.date)
        const key = `${d.getMonth() + 1}-${d.getFullYear()}`
        groups[key] = (groups[key] || 0) + 1
    })

    console.log('Sales by Month:', groups)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
