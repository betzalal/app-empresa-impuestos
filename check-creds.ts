
import prisma from '@/lib/prisma'

async function main() {
    const user = await prisma.user.findFirst({
        where: { username: 'pepe' }, // Assuming 'pepe' is the main user based on context
        include: { company: true }
    })

    if (!user || !user.company) {
        console.log('User or Company not found')
        return
    }

    console.log('--- GMAIL CONFIG ---')
    console.log('Email:', user.company.gmailUser || 'Not configured')
    console.log('App Password:', user.company.gmailAppPassword ? '****** (Configured)' : 'Not configured')

    // Also check if there's any whatsapp info in DB? unlikely based on schema review, but good to double check via logic 
    // (Schema review didn't show whatsapp fields in Company)
}

main()
