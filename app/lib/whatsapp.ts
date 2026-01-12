import 'server-only';
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';

declare global {
    var whatsappClient: Client | undefined;
    var qrCodeData: string | null | undefined;
    var connectionStatus: ('DISCONNECTED' | 'CONNECTING' | 'QR_READY' | 'AUTHENTICATED' | 'READY') | undefined;
    var isInitializing: boolean | undefined;
}

// Singleton logic for the WhatsApp Client
export const getWhatsAppClient = () => {
    if (global.isInitializing) return global.whatsappClient;

    if (!global.whatsappClient) {
        console.log('Initializing New WhatsApp Client Instance');
        global.isInitializing = true;

        global.whatsappClient = new Client({
            authStrategy: new LocalAuth({
                clientId: 'sawalife-tax-app'
            }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        global.connectionStatus = 'CONNECTING';

        global.whatsappClient.on('qr', async (qr) => {
            console.log('WhatsApp QR Received');
            global.qrCodeData = await qrcode.toDataURL(qr);
            global.connectionStatus = 'QR_READY';
        });

        global.whatsappClient.on('ready', () => {
            console.log('WhatsApp Client is Ready');
            global.qrCodeData = null;
            global.connectionStatus = 'READY';
            global.isInitializing = false;
        });

        global.whatsappClient.on('authenticated', () => {
            console.log('WhatsApp Client Authenticated');
            global.connectionStatus = 'AUTHENTICATED';
        });

        global.whatsappClient.on('auth_failure', (msg) => {
            console.error('WhatsApp Auth Failure', msg);
            global.connectionStatus = 'DISCONNECTED';
            global.qrCodeData = null;
            global.isInitializing = false;
        });

        global.whatsappClient.on('disconnected', (reason) => {
            console.log('WhatsApp Client Disconnected', reason);
            global.connectionStatus = 'DISCONNECTED';
            global.qrCodeData = null;
            global.whatsappClient = undefined;
            global.isInitializing = false;
        });

        global.whatsappClient.initialize().then(() => {
            global.isInitializing = false;
        }).catch(err => {
            console.error('Failed to initialize WhatsApp client', err);
            global.connectionStatus = 'DISCONNECTED';
            global.whatsappClient = undefined;
            global.isInitializing = false;
        });
    }

    return global.whatsappClient;
};

export const getWhatsAppStatus = () => {
    return {
        status: global.connectionStatus || 'DISCONNECTED',
        qrCode: global.qrCodeData || null
    };
};

export const getWhatsAppChats = async () => {
    if (!global.whatsappClient || global.connectionStatus !== 'READY') {
        return [];
    }
    try {
        const chats = await global.whatsappClient.getChats();
        // Map to a serializable format for server actions
        return chats.slice(0, 20).map(chat => ({
            id: chat.id._serialized,
            name: chat.name,
            unreadCount: chat.unreadCount,
            lastMessage: chat.lastMessage ? {
                body: chat.lastMessage.body,
                timestamp: chat.lastMessage.timestamp,
                fromMe: chat.lastMessage.fromMe
            } : null,
            isGroup: chat.isGroup
        }));
    } catch (e) {
        console.error('Error fetching WhatsApp chats', e);
        return [];
    }
};

export const getWhatsAppMessages = async (chatId: string) => {
    if (!global.whatsappClient || global.connectionStatus !== 'READY') {
        return [];
    }
    try {
        const chat = await global.whatsappClient.getChatById(chatId);
        const messages = await chat.fetchMessages({ limit: 50 });
        return messages.map(msg => ({
            id: msg.id._serialized,
            body: msg.body,
            timestamp: msg.timestamp,
            fromMe: msg.fromMe,
            type: msg.type,
            senderName: msg.author || msg.from
        }));
    } catch (e) {
        console.error('Error fetching WhatsApp messages', e);
        return [];
    }
};

export const sendWhatsAppMessage = async (chatId: string, message: string) => {
    if (!global.whatsappClient || global.connectionStatus !== 'READY') {
        throw new Error('WhatsApp client is not ready');
    }
    try {
        const sentMsg = await global.whatsappClient.sendMessage(chatId, message);
        return {
            id: sentMsg.id._serialized,
            body: sentMsg.body,
            timestamp: sentMsg.timestamp,
            fromMe: sentMsg.fromMe,
            type: sentMsg.type
        };
    } catch (e) {
        console.error('Error sending WhatsApp message', e);
        throw e;
    }
};

export const disconnectWhatsApp = async () => {
    if (global.whatsappClient) {
        try {
            await global.whatsappClient.logout();
            await global.whatsappClient.destroy();
        } catch (e) {
            console.error('Error during WhatsApp disconnect', e);
        }
        global.whatsappClient = undefined;
        global.qrCodeData = null;
        global.connectionStatus = 'DISCONNECTED';
    }
};
