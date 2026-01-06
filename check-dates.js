
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const sales = await prisma.sale.findMany({
        select: { date: true }
    })

    console.log(`Found ${sales.length} sales.`)
    sales.forEach(s => {
        console.log('Sale Date:', s.date)
    })

    const purchases = await prisma.purchase.findMany({
        select: { date: true }
    })
    console.log(`Found ${purchases.length} purchases.`)
    purchases.forEach(p => {
        console.log('Purchase Date:', p.date)
    })
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
