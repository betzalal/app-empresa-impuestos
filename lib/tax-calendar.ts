export type TaxEvent = {
    date: Date
    title: string
    description: string
    type: 'monthly' | 'annual' | 'special'
}

/**
 * Returns the deadline day for Form 200/400 (IVA/IT) based on NIT last digit.
 * Rule: 13 + lastDigit
 */
export function getMonthlyDeadlineDay(nit: string): number {
    const lastDigit = parseInt(nit.slice(-1))
    if (isNaN(lastDigit)) return 13 // Default if invalid
    return 13 + lastDigit
}

/**
 * Returns a list of upcoming tax events for the given NIT.
 */
export function getTaxEvents(nit: string | null | undefined): TaxEvent[] {
    const events: TaxEvent[] = []
    const today = new Date()
    const currentYear = today.getFullYear()

    // 1. Monthly Deadlines (Next 3 months)
    // If no NIT, default to generic or prompt
    const lastDigit = nit ? parseInt(nit.slice(-1)) : 0
    const deadlineDay = 13 + (isNaN(lastDigit) ? 0 : lastDigit)

    for (let i = 0; i < 3; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() + i, deadlineDay)
        // If deadline is weekend/holiday, logic should move it (simplified here)
        if (d < today) continue // Skip passed days? Or show if overdue?

        events.push({
            date: d,
            title: `Vencimiento IVA/IT (Mensual)`,
            description: `Declaración Jurada Form 200/400 (NIT term. ${lastDigit})`,
            type: 'monthly'
        })
    }

    // 2. Annual IUE (Fixed dates for now, assuming Commercial/Services - Apr 30)
    // Commercial closes Dec 31 -> Deadline Apr 30 next year (2025 -> 2026)
    const iueDeadline = new Date(2026, 3, 30) // April 30, 2026
    events.push({
        date: iueDeadline,
        title: 'Vencimiento IUE (Anual)',
        description: 'Pago Formulario 500 (Cierre 31 Dic)',
        type: 'annual'
    })

    // 3. Special Dates (Hardcoded for 2026/2025 as requested)
    events.push({
        date: new Date(2026, 0, 30), // Jan 30
        title: 'Vencimiento RAU',
        description: 'Pago Gestión 2024 (Prorroga)',
        type: 'special'
    })

    return events.sort((a, b) => a.date.getTime() - b.date.getTime())
}
