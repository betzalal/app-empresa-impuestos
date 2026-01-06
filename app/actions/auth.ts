'use server'

import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcrypt'

export async function login(formData: FormData) {
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    const user = await prisma.user.findUnique({
        where: { username },
    })

    // Special handling for initial 'admin' setup
    if (!user && username === 'admin' && password === 'admin') {
        const hashedPassword = await bcrypt.hash('admin', 10)
        const newUser = await prisma.user.create({
            data: { username: 'admin', password: hashedPassword }
        })
        cookies().set('sawalife_session', newUser.id, { httpOnly: true })
        redirect('/onboarding')
        return
    }

    if (!user) {
        return { success: false, message: 'Usuario no encontrado' }
    }

    const valid = await bcrypt.compare(password, user.password)

    if (!valid) {
        return { success: false, message: 'Contraseña incorrecta' }
    }

    // Check for Onboarding Condition
    // If username is admin/admin (and we just verified it), AND user has no companyId?
    if (user.username === 'admin' && !(user as any).companyId) {
        cookies().set('sawalife_session', user.id, { httpOnly: true })
        redirect('/onboarding')
        return
    }

    // Set session
    cookies().set('sawalife_session', user.id, { httpOnly: true })
    redirect('/dashboard/company')
}

export async function logout() {
    cookies().delete('sawalife_session')
    redirect('/')
}

export async function register(formData: FormData) {
    // Helper to create users
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.create({
        data: { username, password: hashed }
    })
    return { success: true }
}
