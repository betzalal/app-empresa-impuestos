'use server'

import { getWhatsAppStatus, getWhatsAppClient, disconnectWhatsApp, getWhatsAppChats, getWhatsAppMessages, sendWhatsAppMessage } from '@/app/lib/whatsapp';

export async function getWhatsAppConnectionStatus() {
    try {
        // Ensure client is initialized if someone checks status
        getWhatsAppClient();
        return { success: true, ...getWhatsAppStatus() };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function initializeWhatsAppAction() {
    try {
        const client = getWhatsAppClient();
        return { success: true, status: 'INITIALIZING' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function logoutWhatsAppAction() {
    try {
        await disconnectWhatsApp();
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getWhatsAppChatsAction() {
    try {
        const chats = await getWhatsAppChats();
        return { success: true, chats };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getWhatsAppMessagesAction(chatId: string) {
    try {
        const messages = await getWhatsAppMessages(chatId);
        return { success: true, messages };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function sendWhatsAppMessageAction(chatId: string, message: string) {
    try {
        const result = await sendWhatsAppMessage(chatId, message);
        return { success: true, message: result };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
