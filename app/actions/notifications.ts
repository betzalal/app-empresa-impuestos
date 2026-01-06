'use server'

import prisma from '@/lib/prisma'

export type SystemNotification = {
    id: string
    title: string
    message: string
    type: 'emergency' | 'warning' | 'info'
    link?: string
}

export async function getSystemNotifications(): Promise<SystemNotification[]> {
    const notifications: SystemNotification[] = []
    const today = new Date()
    const currentDay = today.getDate()

    // 1. Determine Tax Deadline (Bolivia Rule: NIT last digit + 13)
    // We need the user's NIT. Assuming single tenant or getting first user/company config.
    // For now, let's fetch the first user or a config. If no NIT, default to 20th.

    const user = await prisma.user.findFirst() // or find specific admin
    const nit = user?.nit || '0'
    const lastDigit = parseInt(nit.slice(-1)) || 0
    const taxDeadlineDay = 13 + lastDigit

    // Check if we are close to deadline (current month)
    // Deadline Date for THIS month
    const deadlineDate = new Date(today.getFullYear(), today.getMonth(), taxDeadlineDay)

    // Difference in days
    // If today is 10th and deadline is 15th, diff is 5.
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 5) {
        notifications.push({
            id: 'tax-5-days',
            title: 'Impuestos: 5 días restantes',
            message: `El vencimiento de impuestos (NIT termina en ${lastDigit}) es el día ${taxDeadlineDay}.`,
            type: 'warning',
            link: '/dashboard'
        })
    } else if (diffDays === 1) {
        notifications.push({
            id: 'tax-1-day',
            title: 'IMPUESTOS: VENCE MAÑANA',
            message: `URGENTE: El pago de impuestos vence mañana día ${taxDeadlineDay}.`,
            type: 'emergency',
            link: '/dashboard'
        })
    } else if (diffDays === 0) {
        notifications.push({
            id: 'tax-today',
            title: 'IMPUESTOS: VENCE HOY',
            message: `URGENTE: Debe declarar sus impuestos hoy.`,
            type: 'emergency',
            link: '/dashboard'
        })
    }

    // 2. Start of Month (Payroll)
    // Alert on day 1, 2, 3? User said "Fechas de inicio de mes". Let's say days 1-3.
    if (currentDay >= 1 && currentDay <= 3) {
        notifications.push({
            id: 'payroll-start',
            title: 'Pago de Salarios',
            message: 'Inicio de mes: Recuerde procesar el pago de sueldos y beneficios.',
            type: 'info',
            link: '/dashboard/personal/payroll'
        })
    }

    // 3. 15th of Month (Ministry, Social, Health)
    // "cada 15 de mes se tiene que cancelar ministerio de trabajo igual seguro social y seguro de salud"
    // Let's warn on 14th and 15th
    if (currentDay === 14) {
        notifications.push({
            id: 'min-14',
            title: 'Vencimiento de Aportes Mañana',
            message: 'Recuerde cancelar Ministerio de Trabajo, Caja y AFP.',
            type: 'warning'
        })
    }
    if (currentDay === 15) {
        notifications.push({
            id: 'min-15',
            title: 'Vencimiento de Aportes HOY',
            message: 'URGENTE: Hoy es el plazo para Ministerio de Trabajo y Seguros.',
            type: 'emergency'
        })
    }

    return notifications
}
