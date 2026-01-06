
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    // 1. Delete 'admin' if exists
    const deleted = await prisma.user.deleteMany({
        where: { username: 'admin' }
    })
    console.log(`Deleted ${deleted.count} user(s) named 'admin'`)

    // 2. Verify 'Betzalal'
    const betzalal = await prisma.user.findUnique({
        where: { username: 'Betzalal' }
    })

    if (betzalal) {
        console.log("User 'Betzalal' exists.")
        // Optional: Verify password again just to be sure
        // const match = await bcrypt.compare('*MorrowindJustcause_2*', betzalal.password)
        // console.log("Password match:", match)
    } else {
        console.log("User 'Betzalal' NOT FOUND. Creating...")
        const password = '*MorrowindJustcause_2*'
        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.user.create({
            data: {
                username: 'Betzalal',
                password: hashedPassword
            }
        })
        console.log("User 'Betzalal' created.")
    }

    // List all users to be sure
    const allUsers = await prisma.user.findMany()
    console.log("Current Users in DB:", allUsers.map(u => u.username))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
