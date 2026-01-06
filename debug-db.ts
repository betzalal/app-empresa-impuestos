
import prisma from '@/lib/prisma'

async function debugData() {
    console.log('--- SALES ---');
    const sales = await prisma.sale.findMany({
        take: 10,
        orderBy: { date: 'desc' }
    });
    sales.forEach(s => {
        console.log(`Sale: ${s.date.toISOString()} | Amount: ${s.amount}`);
    });

    console.log('\n--- PURCHASES ---');
    const purchases = await prisma.purchase.findMany({
        take: 10,
        orderBy: { date: 'desc' }
    });
    purchases.forEach(p => {
        console.log(`Purchase: ${p.date.toISOString()} | Amount: ${p.amount}`);
    });
}

debugData();
