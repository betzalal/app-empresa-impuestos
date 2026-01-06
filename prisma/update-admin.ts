
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    const username = 'Betzalal'
    const password = '*MorrowindJustcause_2*'
    const hashedPassword = await bcrypt.hash(password, 10)

    // Upsert user: create if not exists, update password if exists
    const user = await prisma.user.upsert({
        where: { username },
        update: { password: hashedPassword },
        create: {
            username,
            password: hashedPassword,
        },
    })

    console.log(`User ${user.username} updated/created successfully.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
