// Use dynamic require to avoid webpack bundling issues in Next.js
import qrcode from 'qrcode'

// Global singleton to prevent multiple clients in dev hot-reloading
declare global {
    var whatsappClient: any
    var whatsappQR: string | null
    var whatsappReady: boolean
    var whatsappLoading: boolean
}

let client: any
let qrCode: string | null = null
let isReady = false
let isLoading = false

export const getClient = () => {
    if (!client) {
        if (global.whatsappClient) {
            return global.whatsappClient
        }

        console.log('Initializing WhatsApp Client...')
        // Require inside to avoid build-time bundling issues
        const { Client, LocalAuth } = require('whatsapp-web.js');

        isLoading = true

        client = new Client({
            authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        })

        client.on('qr', async (qr) => {
            console.log('QR RECEIVED')
            try {
                // Convert to data URI for frontend
                qrCode = await qrcode.toDataURL(qr)
                global.whatsappQR = qrCode
                isLoading = false
            } catch (err) {
                console.error('Error generating QR', err)
            }
        })

        client.on('ready', () => {
            console.log('WHATSAPP READY')
            isReady = true
            global.whatsappReady = true
            qrCode = null
            global.whatsappQR = null
            isLoading = false
        })

        client.on('authenticated', () => {
            console.log('AUTHENTICATED')
        })

        client.on('auth_failure', msg => {
            console.error('AUTHENTICATION FAILURE', msg)
            isLoading = false
        })

        client.on('loading_screen', (percent, message) => {
            console.log('LOADING SCREEN', percent, message);
            isLoading = true;
        });

        client.initialize().catch(err => {
            console.error("Initialization Failed:", err)
            isLoading = false
        })

        global.whatsappClient = client
    }
    return global.whatsappClient!
}

export const getStatus = () => {
    // Ensure client exists?
    // If not started, we might not want to start it on every poll?
    // But for this demo, we can just return global state.

    return {
        isReady: global.whatsappReady || isReady,
        qrCode: global.whatsappQR || qrCode,
        isLoading: global.whatsappLoading || isLoading
    }
}
