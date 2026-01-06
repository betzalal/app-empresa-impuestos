'use server'

import { getClient, getStatus } from '@/app/lib/whatsappClient'

export async function initWhatsApp() {
    try {
        getClient() // Trigger init
        return { success: true }
    } catch (error) {
        console.error("Failed to init WhatsApp", error)
        return { success: false, error: 'Failed to initialize' }
    }
}

export async function getWhatsAppState() {
    const status = getStatus()
    return {
        isConnected: status.isReady,
        qr: status.qrCode,
        isLoading: status.isLoading
    }
}
