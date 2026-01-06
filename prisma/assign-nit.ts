
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const username = 'Betzalal'
    const nit = '376382025'

    try {
        const user = await prisma.user.update({
            where: { username },
            data: { nit }
        })
        console.log(`SUCCESS: User '${user.username}' updated with NIT: ${user.nit}`)
    } catch (e) {
        console.log("Error updating user. User might not exist.", e)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
