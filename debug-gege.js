const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log('--- DB DEBUG START ---');
    const users = await prisma.user.findMany({
        select: { username: true, companyId: true, id: true }
    });
    console.log('USERS:', JSON.stringify(users, null, 2));

    const companies = await prisma.company.findMany({
        select: { name: true, nit: true, id: true }
    });
    console.log('COMPANIES:', JSON.stringify(companies, null, 2));
    console.log('--- DB DEBUG END ---');
}
main().catch(console.error).finally(() => prisma.$disconnect());
